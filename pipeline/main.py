"""
main.py — FastAPI server that receives triggers from n8n and runs the CrewAI pipeline.
Exposes three endpoints: /run-pipeline, /status, /health.
"""

import json
import os
from datetime import datetime
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import FASTAPI_PORT, validate_config
import jira_client

# Deferred import — only loaded when pipeline actually runs
# (avoids slow LLM init on every server start)

RESULTS_FILE = os.path.join(os.path.dirname(__file__), "results.json")

# In-memory state for the current run
_run_state: dict = {
    "status": "idle",
    "last_run": None,
    "tickets_processed": 0,
    "deployment_url": "",
    "error": "",
}


# ─────────────────────────────────────────────────────────────
# FastAPI app setup
# ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: validate config and load previous results if any."""
    missing = validate_config()
    if missing:
        print(f"[WARN] Missing env vars: {', '.join(missing)}")
    else:
        print("[OK] All environment variables loaded.")
    _load_results()
    yield
    print("[INFO] Server shutting down.")


app = FastAPI(
    title="SPMS AI Pipeline",
    description="Autonomous AI pipeline for Student Personal Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────────────────────

class PipelineTriggerRequest(BaseModel):
    trigger: str = "manual"
    time: str = ""


class PipelineStatusResponse(BaseModel):
    status: str
    last_run: str | None
    tickets_processed: int
    deployment_url: str
    error: str


class HealthResponse(BaseModel):
    server: str
    jira: str
    vercel_path: str


# ─────────────────────────────────────────────────────────────
# Background pipeline runner
# ─────────────────────────────────────────────────────────────

def _run_crew_pipeline() -> None:
    """Import and execute the CrewAI crew in a background thread."""
    global _run_state
    _run_state["status"] = "running"
    _run_state["error"] = ""
    _run_state["last_run"] = datetime.utcnow().isoformat()
    print(f"[Pipeline] Starting at {_run_state['last_run']}")

    try:
        # Import here so LLM initialisation only happens when needed
        from crewai import Crew, Process
        from tasks import (
            read_tickets_task,
            frontend_task,
            backend_task,
            testing_task,
            deploy_and_update_task,
        )
        from agents import (
            ticket_reader,
            frontend_developer,
            backend_developer,
            tester,
            devops_updater,
        )

        crew = Crew(
            agents=[
                ticket_reader,
                frontend_developer,
                backend_developer,
                tester,
                devops_updater,
            ],
            tasks=[
                read_tickets_task,
                frontend_task,
                backend_task,
                testing_task,
                deploy_and_update_task,
            ],
            process=Process.sequential,
            verbose=True,
        )

        result = crew.kickoff()
        print(f"[Pipeline] Completed. Result snippet: {str(result)[:200]}")

        # Count tickets processed from Jira
        tickets = jira_client.get_todo_tickets()
        _run_state["tickets_processed"] = len(tickets)
        _run_state["status"] = "success"
        _run_state["deployment_url"] = _extract_url_from_result(str(result))

    except Exception as exc:
        print(f"[Pipeline] ERROR: {exc}")
        _run_state["status"] = "error"
        _run_state["error"] = str(exc)

    _save_results()
    print(f"[Pipeline] State saved. Status: {_run_state['status']}")


def _extract_url_from_result(result_text: str) -> str:
    """Pull the first .vercel.app URL out of the crew result text."""
    for word in result_text.split():
        if ".vercel.app" in word:
            return word.strip(".,;\"'")
    return ""


def _save_results() -> None:
    """Persist run state to results.json so it survives server restarts."""
    with open(RESULTS_FILE, "w", encoding="utf-8") as fh:
        json.dump(_run_state, fh, indent=2)


def _load_results() -> None:
    """Restore last run state from results.json on server startup."""
    global _run_state
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r", encoding="utf-8") as fh:
            loaded = json.load(fh)
            _run_state.update(loaded)
        print(f"[Pipeline] Loaded previous results. Last run: {_run_state.get('last_run')}")


# ─────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────

@app.post("/run-pipeline")
async def run_pipeline(
    body: PipelineTriggerRequest,
    background_tasks: BackgroundTasks,
) -> dict:
    """Receive a trigger from n8n (or manual curl) and start the pipeline in the background."""
    if _run_state["status"] == "running":
        return {
            "status": "already_running",
            "message": "Pipeline is already running. Check /status for updates.",
        }
    print(f"[API] /run-pipeline triggered by '{body.trigger}' at {body.time or 'now'}")
    background_tasks.add_task(_run_crew_pipeline)
    return {
        "status": "started",
        "message": "Pipeline started in background. Poll /status for results.",
        "trigger": body.trigger,
    }


@app.get("/status", response_model=PipelineStatusResponse)
async def get_status() -> PipelineStatusResponse:
    """Return the current or last run status."""
    return PipelineStatusResponse(
        status=_run_state.get("status", "idle"),
        last_run=_run_state.get("last_run"),
        tickets_processed=_run_state.get("tickets_processed", 0),
        deployment_url=_run_state.get("deployment_url", ""),
        error=_run_state.get("error", ""),
    )


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check that FastAPI is up, Jira is reachable, and Vercel path exists."""
    from config import VERCEL_PROJECT_PATH
    jira_ok = jira_client.check_jira_reachable()
    vercel_path_ok = os.path.isdir(VERCEL_PROJECT_PATH) if VERCEL_PROJECT_PATH else False
    return HealthResponse(
        server="ok",
        jira="reachable" if jira_ok else "unreachable",
        vercel_path="exists" if vercel_path_ok else "missing",
    )


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=FASTAPI_PORT, reload=True)
