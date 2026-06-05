"""
tasks.py — All 5 CrewAI tasks, one per agent, executed sequentially.
Each task passes its output as context to the next task in the chain.
"""

from crewai import Task
from agents import (
    ticket_reader,
    frontend_developer,
    backend_developer,
    tester,
    devops_updater,
)
from config import VERCEL_PROJECT_PATH


# ─────────────────────────────────────────────────────────────
# Task 1 — Read Jira Tickets
# ─────────────────────────────────────────────────────────────

read_tickets_task = Task(
    description=(
        "Fetch all 'To Do' tickets from Jira project SPMS for user1 and user2. "
        "Sort tickets by priority descending (High → Medium → Low). "
        "For each ticket extract and clearly label:\n"
        "  - id: the Jira ticket key (e.g. SPMS-12)\n"
        "  - summary: one-line description of the task\n"
        "  - description: full requirement details\n"
        "  - assignee: whether this is user1 (frontend) or user2 (backend)\n"
        "  - priority: High / Medium / Low\n"
        "Return the complete structured list. "
        "If Jira is unreachable, log the error clearly and return an empty list."
    ),
    expected_output=(
        "A numbered list of all To Do tickets with id, summary, description, "
        "assignee (user1 or user2), and priority fields clearly labeled for each ticket. "
        "Sorted by priority descending."
    ),
    agent=ticket_reader,
)


# ─────────────────────────────────────────────────────────────
# Task 2 — Frontend Development
# ─────────────────────────────────────────────────────────────

frontend_task = Task(
    description=(
        "Using the ticket list from the previous task, process ONLY tickets assigned to user1.\n"
        "For each user1 ticket:\n"
        "  1. Read the ticket summary and description carefully.\n"
        "  2. Write a complete Next.js 14 page or component using the App Router.\n"
        "  3. Use Tailwind CSS for all styling — no inline styles, no other CSS libraries.\n"
        "  4. Use JSON files in public/data/ for any data storage.\n"
        "  5. Save the file to the correct path inside: {vercel_project_path}/app/\n"
        "     e.g. assignments page → {vercel_project_path}/app/assignments/page.tsx\n"
        "  6. Every file must be 100% complete — no '...', no 'TODO', no placeholders.\n"
        "  7. Handle loading states and empty states in the UI.\n"
        "If there are no user1 tickets, output: 'No frontend tickets to process.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A list of all Next.js files written, each with:\n"
        "  - Full filepath\n"
        "  - One-sentence summary of what the component does\n"
        "  - Confirmation that the file is complete with no placeholders"
    ),
    agent=frontend_developer,
    context=[read_tickets_task],
)


# ─────────────────────────────────────────────────────────────
# Task 3 — Backend Development
# ─────────────────────────────────────────────────────────────

backend_task = Task(
    description=(
        "Using the ticket list from the first task, process ONLY tickets assigned to user2.\n"
        "For each user2 ticket:\n"
        "  1. Read the ticket summary and description carefully.\n"
        "  2. Write a complete FastAPI route file with Pydantic models.\n"
        "  3. Include proper HTTP status codes (200, 201, 404, 422, 500).\n"
        "  4. Include input validation and error handling for all edge cases.\n"
        "  5. Use JSON files in {vercel_project_path}/api/data/ for persistence.\n"
        "  6. Save the file to: {vercel_project_path}/api/<feature>_routes.py\n"
        "  7. Every file must be 100% complete — no '...', no 'TODO', no placeholders.\n"
        "If there are no user2 tickets, output: 'No backend tickets to process.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A list of all FastAPI route files written, each with:\n"
        "  - Full filepath\n"
        "  - List of API endpoints created (method + path)\n"
        "  - Confirmation that the file is complete with no placeholders"
    ),
    agent=backend_developer,
    context=[read_tickets_task],
)


# ─────────────────────────────────────────────────────────────
# Task 4 — Testing
# ─────────────────────────────────────────────────────────────

testing_task = Task(
    description=(
        "Review all files written by the frontend and backend developers.\n"
        "For each frontend file (Next.js):\n"
        "  1. Write a Jest + React Testing Library test file.\n"
        "  2. Save to the correct __tests__/ directory next to the component.\n"
        "  3. Run: npm test -- --watchAll=false from {vercel_project_path}\n"
        "For each backend file (FastAPI):\n"
        "  1. Write a pytest test file using httpx.AsyncClient.\n"
        "  2. Save to {vercel_project_path}/api/tests/test_<feature>.py\n"
        "  3. Run: pytest api/tests/ from {vercel_project_path}\n"
        "Report results:\n"
        "  - PASS: test file name and number of tests that passed\n"
        "  - FAIL: test file name, test name that failed, and exact error message\n"
        "If no files were written by developers, output: 'No files to test.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "Test results for every file, clearly labeled PASS or FAIL.\n"
        "For FAIL: include the exact test name and error message.\n"
        "Final summary line: 'OVERALL: PASS' or 'OVERALL: FAIL — X tests failed'"
    ),
    agent=tester,
    context=[frontend_task, backend_task],
)


# ─────────────────────────────────────────────────────────────
# Task 5 — Deploy and Update Jira
# ─────────────────────────────────────────────────────────────

deploy_and_update_task = Task(
    description=(
        "Read the test results from the previous task.\n\n"
        "IF OVERALL: PASS:\n"
        "  1. Run 'vercel --prod --yes' from {vercel_project_path} using VercelDeployTool.\n"
        "  2. Extract the live .vercel.app URL from the deployment output.\n"
        "  3. For each Jira ticket that was processed today:\n"
        "     a. Transition the ticket status to 'Done'.\n"
        "     b. Add this comment: 'Implemented by AI pipeline. "
        "Live at: [URL] — [current datetime ISO format]'\n\n"
        "IF OVERALL: FAIL:\n"
        "  1. Do NOT deploy.\n"
        "  2. For each processed Jira ticket:\n"
        "     a. Transition the ticket status back to 'To Do'.\n"
        "     b. Add a comment explaining which tests failed and why.\n\n"
        "Always log what happened clearly."
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A final report containing:\n"
        "  - Deployment URL (if deployed) or 'Not deployed — tests failed'\n"
        "  - List of Jira tickets updated, each with new status and comment posted\n"
        "  - Any errors encountered during deployment or Jira updates"
    ),
    agent=devops_updater,
    context=[testing_task],
)
