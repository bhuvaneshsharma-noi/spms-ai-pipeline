"""
tools.py — All CrewAI custom tools used by the 5 agents.
Each tool is a subclass of crewai.tools.BaseTool.
"""

import os
import subprocess
from datetime import datetime
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

import jira_client
from config import VERCEL_TOKEN, VERCEL_PROJECT_PATH


# ─────────────────────────────────────────────────────────────
# Input schemas — Pydantic models that describe tool arguments
# ─────────────────────────────────────────────────────────────

class JiraReadInput(BaseModel):
    """Input schema for JiraReadTool — no arguments needed."""
    dummy: str = Field(default="", description="Not used; call with empty string.")


class JiraUpdateInput(BaseModel):
    """Input schema for JiraUpdateTool."""
    ticket_id: str = Field(description="Jira ticket key, e.g. SPMS-12")
    target_status: str = Field(description="Status to transition to: 'Done' or 'To Do'")
    comment: str = Field(description="Comment to post on the ticket")


class FileWriterInput(BaseModel):
    """Input schema for FileWriterTool."""
    filepath: str = Field(description="Absolute or relative path to write the file to")
    content: str = Field(description="Complete file content as a string")


class ShellCommandInput(BaseModel):
    """Input schema for ShellCommandTool."""
    command: str = Field(description="Shell command to execute, e.g. 'pytest tests/'")
    working_dir: str = Field(
        default="",
        description="Directory to run the command from. Defaults to VERCEL_PROJECT_PATH.",
    )


class VercelDeployInput(BaseModel):
    """Input schema for VercelDeployTool — no arguments needed."""
    dummy: str = Field(default="", description="Not used; call with empty string.")


# ─────────────────────────────────────────────────────────────
# Tool 1 — JiraReadTool
# ─────────────────────────────────────────────────────────────

class JiraReadTool(BaseTool):
    """Fetch all To Do Jira tickets for user1 and user2 sorted by priority."""

    name: str = "JiraReadTool"
    description: str = (
        "Reads all open 'To Do' Jira tickets for user1 (frontend) and user2 (backend) "
        "from the SPMS project. Returns a structured list sorted by priority."
    )
    args_schema: Type[BaseModel] = JiraReadInput

    def _run(self, dummy: str = "") -> str:
        """Call Jira REST API and return formatted ticket list."""
        tickets = jira_client.get_todo_tickets()
        if not tickets:
            return "No To Do tickets found or Jira is unreachable."
        lines = ["JIRA TICKETS (sorted by priority):", "=" * 50]
        for t in tickets:
            lines.append(
                f"ID: {t['id']}\n"
                f"  Summary   : {t['summary']}\n"
                f"  Assignee  : {t['assignee_name']} ({t['assignee']})\n"
                f"  Priority  : {t['priority']}\n"
                f"  Status    : {t['status']}\n"
                f"  Description: {t['description'][:300]}...\n"
                f"  ---"
            )
        return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Tool 2 — JiraUpdateTool
# ─────────────────────────────────────────────────────────────

class JiraUpdateTool(BaseTool):
    """Transition a Jira ticket status and post a comment on it."""

    name: str = "JiraUpdateTool"
    description: str = (
        "Transitions a Jira ticket to a new status (Done or To Do) and adds a comment. "
        "Use after deployment succeeds or fails."
    )
    args_schema: Type[BaseModel] = JiraUpdateInput

    def _run(self, ticket_id: str, target_status: str, comment: str) -> str:
        """Apply status transition and post comment via Jira REST API."""
        transitioned = jira_client.transition_ticket(ticket_id, target_status)
        commented = jira_client.add_comment(ticket_id, comment)
        if transitioned and commented:
            return f"SUCCESS: {ticket_id} moved to '{target_status}' and comment added."
        if not transitioned:
            return f"PARTIAL FAILURE: Could not transition {ticket_id} to '{target_status}'."
        return f"PARTIAL FAILURE: Transitioned {ticket_id} but failed to add comment."


# ─────────────────────────────────────────────────────────────
# Tool 3 — FileWriterTool
# ─────────────────────────────────────────────────────────────

class FileWriterTool(BaseTool):
    """Write complete file content to disk, creating directories as needed."""

    name: str = "FileWriterTool"
    description: str = (
        "Writes a complete file to the given filepath. "
        "Creates all parent directories automatically. "
        "Use this to save generated Next.js components and FastAPI routes."
    )
    args_schema: Type[BaseModel] = FileWriterInput

    def _run(self, filepath: str, content: str) -> str:
        """Create parent directories and write the full file content."""
        try:
            abs_path = os.path.abspath(filepath)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            with open(abs_path, "w", encoding="utf-8") as fh:
                fh.write(content)
            print(f"[FileWriter] Wrote {abs_path}")
            return f"SUCCESS: File written to {abs_path}"
        except OSError as exc:
            return f"ERROR writing {filepath}: {exc}"


# ─────────────────────────────────────────────────────────────
# Tool 4 — ShellCommandTool
# ─────────────────────────────────────────────────────────────

class ShellCommandTool(BaseTool):
    """Run a shell command and return stdout + stderr."""

    name: str = "ShellCommandTool"
    description: str = (
        "Executes a shell command (e.g. pytest, npm test) in a specified directory. "
        "Returns combined stdout and stderr so the tester agent can read results."
    )
    args_schema: Type[BaseModel] = ShellCommandInput

    def _run(self, command: str, working_dir: str = "") -> str:
        """Execute command in working_dir (defaults to VERCEL_PROJECT_PATH)."""
        run_dir = working_dir if working_dir else VERCEL_PROJECT_PATH
        if not run_dir or not os.path.isdir(run_dir):
            run_dir = os.getcwd()
        print(f"[Shell] Running '{command}' in {run_dir}")
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=run_dir,
                capture_output=True,
                text=True,
                timeout=120,
            )
            output = (
                f"EXIT CODE: {result.returncode}\n"
                f"STDOUT:\n{result.stdout}\n"
                f"STDERR:\n{result.stderr}"
            )
            return output
        except subprocess.TimeoutExpired:
            return "ERROR: Command timed out after 120 seconds."
        except Exception as exc:
            return f"ERROR executing command: {exc}"


# ─────────────────────────────────────────────────────────────
# Tool 5 — VercelDeployTool
# ─────────────────────────────────────────────────────────────

class VercelDeployTool(BaseTool):
    """Deploy the spms-app to Vercel using the CLI and return the live URL."""

    name: str = "VercelDeployTool"
    description: str = (
        "Runs 'vercel --prod --yes' inside VERCEL_PROJECT_PATH using VERCEL_TOKEN. "
        "Parses the deployment URL from CLI output and returns it."
    )
    args_schema: Type[BaseModel] = VercelDeployInput

    def _run(self, dummy: str = "") -> str:
        """Execute vercel CLI deploy and extract the production URL."""
        if not VERCEL_PROJECT_PATH or not os.path.isdir(VERCEL_PROJECT_PATH):
            return f"ERROR: VERCEL_PROJECT_PATH '{VERCEL_PROJECT_PATH}' does not exist."
        if not VERCEL_TOKEN:
            return "ERROR: VERCEL_TOKEN is not set in .env."
        env = os.environ.copy()
        env["VERCEL_TOKEN"] = VERCEL_TOKEN
        print(f"[Vercel] Deploying from {VERCEL_PROJECT_PATH} ...")
        try:
            result = subprocess.run(
                "vercel --prod --yes",
                shell=True,
                cwd=VERCEL_PROJECT_PATH,
                capture_output=True,
                text=True,
                timeout=300,
                env=env,
            )
            combined = result.stdout + result.stderr
            # Extract the .vercel.app deployment URL from CLI output
            deploy_url = ""
            for line in combined.splitlines():
                if ".vercel.app" in line:
                    parts = line.strip().split()
                    for part in parts:
                        if ".vercel.app" in part:
                            deploy_url = part.strip()
                            break
                if deploy_url:
                    break
            if result.returncode != 0:
                return f"DEPLOY FAILED (exit {result.returncode}):\n{combined}"
            if deploy_url:
                print(f"[Vercel] Deployed to: {deploy_url}")
                return f"DEPLOY SUCCESS: {deploy_url}"
            return f"DEPLOY SUCCESS but URL not parsed. Output:\n{combined}"
        except subprocess.TimeoutExpired:
            return "ERROR: Vercel deploy timed out after 300 seconds."
        except Exception as exc:
            return f"ERROR during Vercel deploy: {exc}"
