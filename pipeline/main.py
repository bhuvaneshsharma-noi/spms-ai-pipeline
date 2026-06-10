"""
main.py — FastAPI server that receives triggers from n8n and runs the CrewAI pipeline.
"""

import json
import os
import re
import subprocess
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

        # Move tickets to active sprint + transition to In Progress
        sprint_id = jira_client.get_active_sprint_id()
        if sprint_id:
            jira_client.move_to_sprint(sprint_id, ticket_ids)
        for tid in ticket_ids:
            jira_client.transition_ticket(tid, "In Progress")
            jira_client.add_comment(tid, f"🤖 AI Pipeline started processing this ticket.\nAgents are reading tickets and writing code...")
        _log("  Jira tickets → IN PROGRESS")

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

        # ── Step 3.5: Pre-build file verification ─────────────
        _log("STEP 3.5  Pre-build file verification...")
        fixed_count, fixed_files = _pre_build_verify()
        if fixed_count:
            _log(f"  Auto-fixed {fixed_count} file(s) before build: {', '.join(fixed_files)}")
        else:
            _log("  All agent-written files look clean.")

        # ── Step 4: Git commit + push ──────────────────────────
        _log("STEP 4/5  Build check + auto-fix before commit...")
        build_ok, build_error = _build_and_fix()
        if not build_ok:
            _log("  Build FAILED — marking tickets BLOCKED in Jira.")
            for tid in ticket_ids:
                jira_client.block_ticket(
                    tid,
                    reason=f"yarn build failed after auto-fix attempt.\n\n{build_error[:500]}",
                    action_needed="Fix the TypeScript/build error shown above, then move ticket back to To Do."
                )
            _run_state["status"] = "error"
            _run_state["error"] = f"Build failed: {build_error[:200]}"
            _save_results()
            return

        _log("STEP 5/5  Committing code to GitHub...")
        for tid in ticket_ids:
            jira_client.transition_ticket(tid, "IN REVIEW")
            jira_client.add_comment(tid, f"✅ Build passed. Code pushed to GitHub. Waiting for Vercel to deploy...")
        deploy_url = _auto_git_push(ticket_ids)

        # ── Step 5: Done ───────────────────────────────────────
        live_url = deploy_url or "https://noi-sms-bhuvaneshsharma-nois-projects.vercel.app"
        for tid in ticket_ids:
            jira_client.transition_ticket(tid, "Done")
            jira_client.add_comment(tid,
                f"🚀 DEPLOYED TO PRODUCTION\n\n"
                f"Live URL: {live_url}\n"
                f"Tickets: {', '.join(ticket_ids)}"
            )
        _log("STEP 6/6  Pipeline complete!")
        _log(f"  Tickets processed : {len(ticket_ids)}")
        _log(f"  Vercel deploy URL : {live_url}")
        _log(f"  Jira tickets      : {', '.join(ticket_ids)} → Done")
        _log("=" * 55)

        _run_state["tickets_processed"] = len(ticket_ids)
        _run_state["status"] = "success"
        _run_state["deployment_url"] = deploy_url or "https://noi-sms.vercel.app"

    except Exception as exc:
        _log(f"  UNEXPECTED ERROR: {exc}")
        if ticket_ids:
            for tid in ticket_ids:
                jira_client.block_ticket(
                    tid,
                    reason=f"Unexpected pipeline error: {exc}",
                    action_needed="Check pipeline server logs for full traceback. Move ticket back to To Do when fixed."
                )
        _run_state["status"] = "error"
        _run_state["error"] = str(exc)
        _log("=" * 55)

    _save_results()


def _pre_build_verify() -> tuple[int, list[str]]:
    """
    Scan every .tsx file in spms-app/ that was written or modified by agents
    (within the last 60 minutes). Apply all known fixes in-place so that
    yarn build has the best chance of passing on the first attempt.

    Protections:
      - layout.tsx: if <html>, {children}, or <body are missing → restore from git
      - Sidebar.tsx: never modified — any agent change is restored from git

    Fixes applied to all other files:
      0. Literal \\n escapes → real newlines
      1. Missing "use client" directive on hook-using files
      2. Bad Layout imports / wrappers
      3. react-icons imports (not installed)
      4. Untyped arrow-function parameters
      5. Untyped useState([]) / useState({}) / useState(null)

    Returns (files_fixed_count, list_of_relative_paths_fixed).
    """
    import glob as _glob
    import time as _time

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_dir   = os.path.join(repo_root, "spms-app")
    cutoff    = _time.time() - 3600  # touched in the last 60 minutes

    all_tsx = _glob.glob(os.path.join(app_dir, "**", "*.tsx"), recursive=True)
    recent  = [f for f in all_tsx if os.path.getmtime(f) > cutoff]

    fixed: list[str] = []

    # ── SAFE CONTENT for protected files ──────────────────────
    PROTECTED_LAYOUT = (
        'import type { Metadata } from "next";\n'
        'import Sidebar from "./components/Sidebar";\n'
        'import Footer from "./components/Footer";\n'
        'import "./globals.css";\n\n'
        'export const metadata: Metadata = {\n'
        '  title: "SPMS — Student Personal Management System",\n'
        '  description: "Manage assignments, exams, attendance, timetable, and notes.",\n'
        '};\n\n'
        'export default function RootLayout({ children }: { children: React.ReactNode }) {\n'
        '  return (\n'
        '    <html lang="en">\n'
        '      <body className="min-h-screen bg-white text-slate-800 flex">\n'
        '        <Sidebar />\n'
        '        <div className="flex-1 flex flex-col min-h-screen">\n'
        '          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">\n'
        '            {children}\n'
        '          </main>\n'
        '          <Footer />\n'
        '        </div>\n'
        '      </body>\n'
        '    </html>\n'
        '  );\n'
        '}\n'
    )

    for abs_path in recent:
        rel_path = os.path.relpath(abs_path, app_dir)

        # ── Layout.tsx protection ──────────────────────────────
        if rel_path == "app/layout.tsx":
            with open(abs_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Restore if agent broke core structure OR removed Footer
            if ("<html" not in content or "{children}" not in content
                    or "<body" not in content or "<Footer" not in content):
                _log(f"  PROTECT: layout.tsx missing required elements — restoring safe version")
                with open(abs_path, "w", encoding="utf-8") as f:
                    f.write(PROTECTED_LAYOUT)
                fixed.append("app/layout.tsx (restored with Footer)")
            continue  # skip other fixes for layout.tsx

        # ── Sidebar.tsx protection ─────────────────────────────
        if rel_path == "app/components/Sidebar.tsx":
            _log(f"  PROTECT: Sidebar.tsx modified by agent — restoring from git")
            subprocess.run(
                ["git", "checkout", "HEAD", "spms-app/app/components/Sidebar.tsx"],
                cwd=repo_root, capture_output=True
            )
            fixed.append("app/components/Sidebar.tsx (restored from git)")
            continue

        # ── Apply fixes to all other .tsx files ───────────────
        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()
        original = content

        # Fix 0: Literal \n escapes
        if r'\n' in content:
            escaped = content.count(r'\n')
            real    = content.count('\n')
            if escaped > real:
                content = content.replace(r'\n', '\n')
                content = content.replace(r'\t', '\t')
                content = content.replace(r'\"', '"')
                content = content.replace(r"\'", "'")

        lines = content.splitlines()

        # Fix 1: Missing "use client"
        uses_hooks = any(h in content for h in
                         ["useState", "useEffect", "useRef", "useCallback", "onClick", "onChange"])
        has_directive = bool(lines) and lines[0].strip() in ('"use client";', "'use client';")
        if uses_hooks and not has_directive:
            content = '"use client";\n\n' + content

        # Fix 2: Bad Layout import / wrapper
        content = re.sub(r"^import\s+\w+\s+from\s+['\"]\.\.?/layout['\"];\n?", "", content, flags=re.MULTILINE)
        content = re.sub(r"<Layout>\s*\n", "", content)
        content = re.sub(r"\s*</Layout>", "", content)

        # Fix 3: react-icons (not installed)
        content = re.sub(r"^import\s+\{[^}]+\}\s+from\s+'react-icons[^']*';\n?", "", content, flags=re.MULTILINE)
        content = re.sub(r'^import\s+\S+\s+from\s+"react-icons[^"]*";\n?',       "", content, flags=re.MULTILINE)

        # Fix 4: Untyped arrow params — only add : string when param is NOT used as object
        def _safe_type_param(m: re.Match) -> str:
            param = m.group(1)
            # Don't type as string if the param accesses properties (e.g. param.id, param.name)
            after = content[m.end():]
            if re.search(rf'\b{re.escape(param)}\s*\.\s*\w+', after[:300]):
                return m.group(0)  # leave untyped — object, not string
            return f'({param}: string) =>'
        content = re.sub(r'\(([a-zA-Z_]\w*)\)\s*=>', _safe_type_param, content)
        content = re.sub(
            r'\(([a-zA-Z_]\w*): string\)\s*=>\s*\{[^}]*preventDefault',
            lambda m: m.group(0).replace(f'({m.group(1)}: string)', f'({m.group(1)}: React.FormEvent)'),
            content
        )

        # Fix 5: Untyped useState
        content = re.sub(r'useState\(\[\]\)',  'useState<any[]>([]);',                 content)
        content = re.sub(r'useState\(\{\}\)',  'useState<Record<string, any>>({});',   content)
        content = re.sub(r'useState\(null\)',  'useState<string | null>(null)',         content)

        # Fix 6: catch (err) { ... err.message → (err as Error).message
        content = re.sub(r'\} catch \((\w+)\) \{', r'} catch (\1: unknown) {', content)
        content = re.sub(r'\b(\w+)\.message\b', r'(\1 as Error).message', content)

        if content != original:
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)
            fixed.append(rel_path)

    return len(fixed), fixed


def _build_and_fix() -> tuple[bool, str]:
    """
    Run `yarn build` inside spms-app/.
    If it fails, auto-fix common agent mistakes and retry once.
    Returns (True, "") on success or (False, error_detail) on failure.
    """
    import subprocess, re

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_dir = os.path.join(repo_root, "spms-app")

    def run_build():
        return subprocess.run(
            ["yarn", "build"],
            cwd=app_dir,
            capture_output=True,
            text=True,
            timeout=120,
        )

    # ── First build attempt ────────────────────────────────────
    _log("  Running yarn build...")
    result = run_build()

    if result.returncode == 0:
        _log("  Build PASSED ✓")
        return True, ""

    _log("  Build FAILED — scanning errors and auto-fixing...")
    combined = result.stdout + result.stderr

    # Extract broken file paths from build output
    # Matches patterns like: ./app/attendance/page.tsx or ./app/components/Sidebar.tsx
    broken_files = list(dict.fromkeys(re.findall(r"\./([^\s:]+\.tsx)", combined)))
    _log(f"  Broken files: {broken_files}")

    fixed_any = False
    for rel_path in broken_files:
        abs_path = os.path.join(app_dir, rel_path)
        if not os.path.exists(abs_path):
            continue

        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()

        original = content
        lines = content.splitlines()

        # Fix 0: Decode literal \n escape sequences — happens when LLM writes escaped strings
        if r'\n' in content:
            escaped = content.count(r'\n')
            real    = content.count('\n')
            if escaped > real:
                content = content.replace(r'\n', '\n')
                content = content.replace(r'\t', '\t')
                content = content.replace(r'\"', '"')
                content = content.replace(r"\'", "'")
                lines = content.splitlines()
                _log(f"  Fixed: decoded literal \\n escapes in {rel_path}")

        # Fix 1: Add "use client" if file uses hooks but is missing the directive
        uses_hooks = any(hook in content for hook in ["useState", "useEffect", "useRef", "useCallback", "onClick", "onChange"])
        has_directive = lines[0].strip() == '"use client";' or lines[0].strip() == "'use client';"
        if uses_hooks and not has_directive:
            content = '"use client";\n\n' + content
            _log(f"  Fixed: added 'use client' to {rel_path}")

        # Fix 2: Remove `import Layout from` lines — layout is auto-applied by Next.js
        content = re.sub(r"^import\s+\w+\s+from\s+['\"]\.\.?/layout['\"];\n?", "", content, flags=re.MULTILINE)

        # Fix 3: Unwrap <Layout>...</Layout> wrapper — just keep children
        content = re.sub(r"<Layout>\s*\n", "", content)
        content = re.sub(r"\s*</Layout>", "", content)

        # Fix 4: Remove `import { HiMenu, HiX } from 'react-icons/hi'` (not installed)
        content = re.sub(r"^import\s+\{[^}]+\}\s+from\s+'react-icons[^']*';\n?", "", content, flags=re.MULTILINE)
        content = re.sub(r'^import\s+\S+\s+from\s+"react-icons[^"]*";\n?', "", content, flags=re.MULTILINE)

        # Fix 5: Untyped arrow params — only add : string when param is NOT used as object
        def _type_param(m: re.Match) -> str:
            param = m.group(1)
            after = content[m.end():]
            if re.search(rf'\b{re.escape(param)}\s*\.\s*\w+', after[:300]):
                return m.group(0)  # object param — leave for TypeScript to infer
            return f'({param}: string) =>'
        content = re.sub(r'\(([a-zA-Z_]\w*)\)\s*=>', _type_param, content)

        # Form submit handlers: (e) / (event) should be React.FormEvent
        content = re.sub(r'\(([a-zA-Z_]\w*): string\)\s*=>\s*\{[^}]*preventDefault',
                         lambda m: m.group(0).replace(f'({m.group(1)}: string)', f'({m.group(1)}: React.FormEvent)'),
                         content)

        # Fix 6: Replace useState([]) with useState<any[]>([]) to avoid implicit any
        content = re.sub(r'useState\(\[\]\)', 'useState<any[]>([])', content)
        content = re.sub(r'useState\(\{\}\)', 'useState<Record<string, any>>({})', content)
        content = re.sub(r'useState\(null\)', 'useState<string | null>(null)', content)

        # Fix 7: catch (err) unknown type — err.message fails TypeScript strict mode
        content = re.sub(r'\} catch \((\w+)\) \{', r'} catch (\1: unknown) {', content)
        content = re.sub(r'\b(\w+)\.message\b', r'(\1 as Error).message', content)

        if content != original:
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)
            fixed_any = True

    if not fixed_any:
        error_detail = combined[-800:]
        _log("  No auto-fixable patterns found — build cannot be repaired.")
        _log(f"  Build errors:\n{error_detail}")
        return False, error_detail

    # ── Second build attempt after fixes ──────────────────────
    _log("  Re-running yarn build after fixes...")
    result2 = run_build()

    if result2.returncode == 0:
        _log("  Build PASSED after auto-fix ✓")
        return True, ""

    error_detail = (result2.stdout + result2.stderr)[-600:]
    _log("  Build still FAILED after auto-fix.")
    _log(f"  Remaining errors:\n{error_detail}")
    return False, error_detail


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
