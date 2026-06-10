"""
agents.py — All 5 CrewAI agents for the SPMS autonomous pipeline.
Each agent has a focused role, goal, backstory, tools, and llm config.
"""

import os
from crewai import Agent, LLM

from tools import JiraReadTool, JiraUpdateTool, FileReaderTool, FileWriterTool, ShellCommandTool, VercelDeployTool
from config import OPENAI_API_KEY

# Set API key in environment so CrewAI LLM can pick it up
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Shared LLM using CrewAI's own LLM class
llm = LLM(model="gpt-4o-mini", temperature=0.1)

# Instantiate tools once so all agents share the same object
jira_read_tool = JiraReadTool()
jira_update_tool = JiraUpdateTool()
file_writer_tool = FileWriterTool()
shell_command_tool = ShellCommandTool()
vercel_deploy_tool = VercelDeployTool()


# ─────────────────────────────────────────────────────────────
# Agent 1 — Ticket Reader
# ─────────────────────────────────────────────────────────────

ticket_reader = Agent(
    role="Jira Ticket Analyst",
    goal=(
        "Read Jira tickets for user1 and user2, understand what needs to be built, "
        "sort by priority (High first), and pass a clear implementation plan to the next agent."
    ),
    backstory=(
        "Expert at reading Jira tickets and understanding software requirements. "
        "Converts vague ticket descriptions into precise technical specifications. "
        "Has deep knowledge of both frontend (Next.js) and backend (FastAPI) development "
        "so can accurately categorise and prioritise work."
    ),
    tools=[jira_read_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
)


# ─────────────────────────────────────────────────────────────
# Agent 2 — Frontend Developer
# ─────────────────────────────────────────────────────────────

frontend_developer = Agent(
    role="Senior Next.js Frontend Developer",
    goal=(
        "Write complete, working Next.js components and pages based on the ticket specification. "
        "Use Tailwind CSS for all styling. "
        "Save every file to the correct path inside the spms-app/ folder. "
        "Files must be 100% complete — no placeholders, no TODOs, no '...' sections."
    ),
    backstory=(
        "Expert Next.js 14 developer specialising in student management systems. "
        "Writes clean, responsive components using the App Router and Tailwind CSS. "
        "Always writes complete files with no placeholders. "
        "For MODIFY tickets: always reads the existing file first using FileReaderTool, "
        "then writes the updated version with only the required changes. "
        "Every component is fully functional, handles loading and error states, "
        "and is mobile-friendly."
    ),
    tools=[FileReaderTool(), file_writer_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
)


# ─────────────────────────────────────────────────────────────
# Agent 3 — Backend Developer
# ─────────────────────────────────────────────────────────────

backend_developer = Agent(
    role="Senior FastAPI Backend Developer",
    goal=(
        "Write complete FastAPI route files based on the ticket specification. "
        "Include proper Pydantic request/response models, validation, and error handling. "
        "Save every file to the correct path inside the spms-app/api/ directory. "
        "Files must be 100% complete — no placeholders or TODOs."
    ),
    backstory=(
        "Expert Python FastAPI developer who builds clean REST APIs for educational applications. "
        "Writes complete endpoint files with Pydantic models, proper HTTP status codes, "
        "clear docstrings, and comprehensive error handling. "
        "Uses JSON files for persistence — no database required. "
        "Every route is fully implemented with input validation and meaningful error messages."
    ),
    tools=[file_writer_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
)


# ─────────────────────────────────────────────────────────────
# Agent 4 — Tester
# ─────────────────────────────────────────────────────────────

tester = Agent(
    role="QA Engineer",
    goal=(
        "Read all code written by the frontend and backend developers. "
        "Write appropriate test files for each piece of code. "
        "Run the tests using shell commands. "
        "Report PASS or FAIL for each file with exact details of any failures."
    ),
    backstory=(
        "Expert at writing and running tests for both Next.js (Jest + React Testing Library) "
        "and FastAPI (pytest + httpx). "
        "Always writes tests that check the core functionality described in the original Jira ticket. "
        "Writes clear, deterministic test cases that cover the happy path and key error cases. "
        "Reports failures with enough detail for the developer to fix them immediately."
    ),
    tools=[file_writer_tool, shell_command_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
)


# ─────────────────────────────────────────────────────────────
# Agent 5 — DevOps + Jira Updater
# ─────────────────────────────────────────────────────────────

devops_updater = Agent(
    role="DevOps Engineer and Project Manager",
    goal=(
        "Deploy the built and tested code to Vercel using the vercel CLI. "
        "Extract the live deployment URL from the CLI output. "
        "Update every processed Jira ticket: set status to Done and add a comment "
        "with the live deployment URL. "
        "If tests failed, set status back to To Do and add a comment explaining what failed."
    ),
    backstory=(
        "Expert at deploying Next.js apps to Vercel using the CLI tool. "
        "Also expert at updating Jira tickets via API after automated deployments. "
        "Always confirms the deployment is live before closing tickets. "
        "Writes clear, professional comments on Jira tickets that include the live URL "
        "and timestamp so the team can verify the deployment instantly."
    ),
    tools=[vercel_deploy_tool, jira_update_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
)
