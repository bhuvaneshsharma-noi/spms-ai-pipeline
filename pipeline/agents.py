"""
agents.py — All 5 CrewAI agents for the SPMS autonomous pipeline.
Agents ONLY write code — all Jira/deployment is managed by main.py.
"""

import os
from crewai import Agent, LLM

from tools import JiraReadTool, FileReaderTool, FileWriterTool
from config import OPENAI_API_KEY

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Primary LLM — fast and cheap for most tasks
llm = LLM(model="gpt-4o-mini", temperature=0.1)

# Fallback LLM — used by frontend developer for complex code tasks
llm_smart = LLM(model="gpt-4o", temperature=0.1)

jira_read_tool  = JiraReadTool()
file_reader_tool = FileReaderTool()
file_writer_tool = FileWriterTool()


# ─────────────────────────────────────────────────────────────
# Agent 1 — Ticket Reader
# ─────────────────────────────────────────────────────────────

ticket_reader = Agent(
    role="Jira Ticket Analyst",
    goal=(
        "Read all To Do Jira tickets, classify each as CREATE/MODIFY/REMOVE/FIX, "
        "assign user1 (frontend) or user2 (backend), sort by priority, "
        "and pass a precise implementation plan to the next agents."
    ),
    backstory=(
        "Expert at reading Jira tickets and converting requirements into technical specs. "
        "Always classifies tickets accurately using keywords in the summary and description. "
        "Never skips a ticket."
    ),
    tools=[jira_read_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=3,
)


# ─────────────────────────────────────────────────────────────
# Agent 2 — Frontend Developer
# ─────────────────────────────────────────────────────────────

frontend_developer = Agent(
    role="Senior Next.js Frontend Developer",
    goal=(
        "Write complete, working Next.js components and pages. "
        "For MODIFY/REMOVE/FIX: always read the existing file first using FileReaderTool. "
        "Save every file to the correct path inside spms-app/. "
        "Files must be 100% TypeScript with no placeholders."
    ),
    backstory=(
        "Expert Next.js 14 developer for student management systems. "
        "Writes clean, responsive components using App Router and Tailwind CSS. "
        "Always reads existing files before modifying them. "
        "Writes complete TypeScript — all useState arrays typed, all catch blocks typed. "
        "Never uses react-icons. Never wraps content in <Layout>. "
        "Always adds 'use client' when using hooks."
    ),
    tools=[file_reader_tool, file_writer_tool],
    llm=llm_smart,
    verbose=True,
    allow_delegation=False,
    max_iter=5,
)


# ─────────────────────────────────────────────────────────────
# Agent 3 — Backend Developer
# ─────────────────────────────────────────────────────────────

backend_developer = Agent(
    role="Senior Next.js API Developer",
    goal=(
        "Write complete Next.js API routes (TypeScript) for backend tickets. "
        "Skip any frontend/UI tickets. "
        "Files must be 100% complete with proper error handling."
    ),
    backstory=(
        "Expert at building Next.js API routes with TypeScript. "
        "Writes clean REST endpoints with proper HTTP methods, input validation, "
        "and JSON file persistence. Never writes frontend code."
    ),
    tools=[file_reader_tool, file_writer_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=4,
)


# ─────────────────────────────────────────────────────────────
# Agent 4 — Code Reviewer (no shell commands)
# ─────────────────────────────────────────────────────────────

tester = Agent(
    role="TypeScript Code Reviewer",
    goal=(
        "Review every file written by the frontend and backend developers. "
        "Check for TypeScript errors, missing 'use client', bad imports, "
        "untyped useState, untyped catch blocks, and placeholder text. "
        "Output PASS or WARN for each file. Always end with OVERALL: PASS."
    ),
    backstory=(
        "Expert TypeScript code reviewer who catches common Next.js mistakes. "
        "Reviews code quality without running shell commands. "
        "Focuses on TypeScript correctness, React patterns, and completeness. "
        "Always gives an OVERALL: PASS verdict — warns about issues but never blocks."
    ),
    tools=[file_reader_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=3,
)


# ─────────────────────────────────────────────────────────────
# Agent 5 — Summary Reporter (no Jira or Vercel)
# ─────────────────────────────────────────────────────────────

devops_updater = Agent(
    role="Pipeline Summary Reporter",
    goal=(
        "Write a clean deployment summary report listing all files written, "
        "review results, and ticket IDs processed. "
        "Do NOT call Jira or Vercel — those are handled by the pipeline automatically."
    ),
    backstory=(
        "Writes concise, professional pipeline summaries for the CEO. "
        "Lists all work done, any warnings, and confirms what will be deployed. "
        "Never touches Jira or Vercel directly."
    ),
    tools=[],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=2,
)
