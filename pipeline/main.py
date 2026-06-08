"""
main.py — FastAPI server that receives triggers from n8n and runs the CrewAI pipeline.
"""

import json
import os
from collections import deque
from datetime import datetime
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import FASTAPI_PORT, validate_config
import jira_client

RESULTS_FILE = os.path.join(os.path.dirname(__file__), "results.json")

# In-memory state — includes a live log buffer (last 50 lines)
_run_state: dict = {
    "status": "idle",
    "last_run": None,
    "tickets_processed": 0,
    "deployment_url": "",
    "error": "",
    "logs": [],
}

# Rolling log buffer — keeps last 50 messages visible in /status
_log_buffer: deque = deque(maxlen=50)


def _log(msg: str) -> None:
    """Print to terminal AND store in the live log buffer."""
    print(msg)
    ts = datetime.utcnow().strftime("%H:%M:%S")
    entry = f"[{ts}] {msg}"
    _log_buffer.append(entry)
    _run_state["logs"] = list(_log_buffer)


# ─────────────────────────────────────────────────────────────
# FastAPI app setup
# ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = validate_config()
    if missing:
        _log(f"[WARN] Missing env vars: {', '.join(missing)}")
    else:
        _log("[OK] All environment variables loaded.")
    _load_results()
    yield


app = FastAPI(
    title="SPMS AI Pipeline",
    description="Autonomous AI pipeline for Student Personal Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


class HealthResponse(BaseModel):
    server: str
    jira: str
    vercel_path: str


# ─────────────────────────────────────────────────────────────
# Pipeline runner
# ─────────────────────────────────────────────────────────────

def _run_crew_pipeline() -> None:
    global _run_state
    _log_buffer.clear()
    _run_state["status"] = "running"
    _run_state["error"] = ""
    _run_state["last_run"] = datetime.utcnow().isoformat()
    _run_state["logs"] = []

    _log("=" * 55)
    _log("  SPMS AI PIPELINE STARTED")
    _log("=" * 55)

    try:
        # ── Step 1: Fetch tickets ──────────────────────────────
        _log("STEP 1/5  Fetching Jira tickets...")
        tickets_before = jira_client.get_todo_tickets()
        ticket_ids = [t["id"] for t in tickets_before]

        if not ticket_ids:
            _log("  No To Do tickets found. Pipeline idle.")
            _run_state["status"] = "idle"
            _run_state["tickets_processed"] = 0
            _save_results()
            return

        _log(f"  Found {len(ticket_ids)} ticket(s): {', '.join(ticket_ids)}")
        for t in tickets_before:
            _log(f"  • {t['id']} [{t['priority']}] {t['summary']}")

        # ── Step 2: Load CrewAI ────────────────────────────────
        _log("STEP 2/5  Loading CrewAI agents (LLM init)...")
        from crewai import Crew, Process
        from tasks import (
            read_tickets_task, frontend_task, backend_task,
            testing_task, deploy_and_update_task,
        )
        from agents import (
            ticket_reader, frontend_developer, backend_developer,
            tester, devops_updater,
        )
        _log("  Agents ready: Ticket Reader, Frontend Dev, Backend Dev, Tester, DevOps")

        # ── Step 3: Run agents ─────────────────────────────────
        _log("STEP 3/5  Running agents sequentially...")
        _log("  Agent 1/5 → Ticket Reader   : reading Jira tickets")
        _log("  Agent 2/5 → Frontend Dev    : writing Next.js components")
        _log("  Agent 3/5 → Backend Dev     : writing FastAPI routes")
        _log("  Agent 4/5 → Tester          : running tests")
        _log("  Agent 5/5 → DevOps Updater  : updating Jira + deploying")

        crew = Crew(
            agents=[ticket_reader, frontend_developer, backend_developer, tester, devops_updater],
            tasks=[read_tickets_task, frontend_task, backend_task, testing_task, deploy_and_update_task],
            process=Process.sequential,
            verbose=True,
        )

        result = crew.kickoff()
        _log("  All agents finished.")

        # ── Step 4: Git commit + push ──────────────────────────
        _log("STEP 4/5  Committing code to GitHub...")
        deploy_url = _auto_git_push(ticket_ids)

        # ── Step 5: Done ───────────────────────────────────────
        _log("STEP 5/5  Pipeline complete!")
        _log(f"  Tickets processed : {len(ticket_ids)}")
        _log(f"  Vercel deploy URL : {deploy_url or 'https://noi-sms.vercel.app'}")
        _log(f"  Jira tickets      : {', '.join(ticket_ids)} → Done")
        _log("=" * 55)

        _run_state["tickets_processed"] = len(ticket_ids)
        _run_state["status"] = "success"
        _run_state["deployment_url"] = deploy_url or "https://noi-sms.vercel.app"

    except Exception as exc:
        _log(f"  ERROR: {exc}")
        _run_state["status"] = "error"
        _run_state["error"] = str(exc)
        _log("=" * 55)

    _save_results()


def _auto_git_push(ticket_ids: list) -> str:
    import subprocess

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    commit_msg = f"AI pipeline: implement {', '.join(ticket_ids)}"

    def run(cmd: list) -> tuple:
        r = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True, timeout=60)
        if r.stdout.strip():
            _log(f"  git: {r.stdout.strip()}")
        if r.stderr.strip() and r.returncode != 0:
            _log(f"  git ERR: {r.stderr.strip()}")
        return r.returncode, r.stdout, r.stderr

    run(["git", "add", "spms-app/"])

    code, status_out, _ = run(["git", "status", "--porcelain", "spms-app/"])
    if not status_out.strip():
        _log("  Nothing new to commit — code unchanged.")
        return "https://noi-sms.vercel.app"

    code, _, _ = run(["git", "commit", "-m", commit_msg])
    if code != 0:
        _log("  git commit failed.")
        return ""

    _log("  Pushing to GitHub...")
    code, _, stderr = run(["git", "push", "origin", "main"])
    if code != 0:
        _log(f"  git push FAILED: {stderr.strip()}")
        return ""

    _log("  Pushed! Vercel will auto-deploy in ~60 seconds.")
    return "https://noi-sms.vercel.app"


def _extract_url_from_result(result_text: str) -> str:
    for word in result_text.split():
        if ".vercel.app" in word:
            return word.strip(".,;\"'")
    return ""


def _save_results() -> None:
    state_to_save = {k: v for k, v in _run_state.items() if k != "logs"}
    with open(RESULTS_FILE, "w", encoding="utf-8") as fh:
        json.dump(state_to_save, fh, indent=2)


def _load_results() -> None:
    global _run_state
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, "r", encoding="utf-8") as fh:
            loaded = json.load(fh)
            _run_state.update(loaded)
        _log(f"[Pipeline] Loaded previous results. Status: {_run_state.get('status')}")


# ─────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────

@app.post("/run-pipeline")
async def run_pipeline(body: PipelineTriggerRequest, background_tasks: BackgroundTasks) -> dict:
    if _run_state["status"] == "running":
        return {"status": "already_running", "message": "Pipeline is already running."}
    _log(f"[API] Pipeline triggered by '{body.trigger}'")
    background_tasks.add_task(_run_crew_pipeline)
    return {"status": "started", "message": "Pipeline started. Watch /status for live logs."}


@app.get("/status")
async def get_status() -> dict:
    return {
        "status":             _run_state.get("status", "idle"),
        "last_run":           _run_state.get("last_run"),
        "tickets_processed":  _run_state.get("tickets_processed", 0),
        "deployment_url":     _run_state.get("deployment_url", ""),
        "error":              _run_state.get("error", ""),
        "live_log":           _run_state.get("logs", []),
    }


@app.get("/tickets")
async def get_tickets() -> dict:
    tickets = jira_client.get_todo_tickets()
    return {"tickets": tickets, "count": len(tickets)}


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    from config import VERCEL_PROJECT_PATH
    jira_ok = jira_client.check_jira_reachable()
    vercel_path_ok = os.path.isdir(VERCEL_PROJECT_PATH) if VERCEL_PROJECT_PATH else False
    return HealthResponse(
        server="ok",
        jira="reachable" if jira_ok else "unreachable",
        vercel_path="exists" if vercel_path_ok else "missing",
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=FASTAPI_PORT, reload=True)
