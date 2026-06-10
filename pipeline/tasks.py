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
        "Fetch all 'To Do' tickets from Jira project SPMS. "
        "Sort tickets by priority descending (High → Medium → Low). "
        "For each ticket extract and clearly label:\n"
        "  - id: the Jira ticket key (e.g. SPMS-12)\n"
        "  - summary: one-line description of the task\n"
        "  - description: full requirement details\n"
        "  - assignee: whether this is user1 (frontend) or user2 (backend) — if unassigned, classify based on content\n"
        "  - priority: High / Medium / Low\n"
        "  - operation_type: classify EACH ticket as one of:\n"
        "      CREATE  — build a new page, component, or feature\n"
        "      MODIFY  — change or update an existing component (e.g. change color, update text)\n"
        "      REMOVE  — remove, delete, hide, or disable a component or section\n"
        "      FIX     — fix a bug or broken behaviour\n"
        "\n"
        "CLASSIFICATION RULES:\n"
        "  - If summary/description contains 'remove', 'delete', 'hide', 'disable', 'get rid of' → REMOVE\n"
        "  - If summary/description contains 'change', 'update', 'modify', 'edit', 'rename' → MODIFY\n"
        "  - If summary/description contains 'fix', 'bug', 'broken', 'error', 'issue' → FIX\n"
        "  - Everything else → CREATE\n"
        "\n"
        "ASSIGNMENT RULES (if ticket has no assignee):\n"
        "  - UI, layout, color, component, page, footer, sidebar, navbar → assign to user1 (frontend)\n"
        "  - API, route, endpoint, database, data, backend → assign to user2 (backend)\n"
        "\n"
        "Return the complete structured list. "
        "If Jira is unreachable, log the error clearly and return an empty list."
    ),
    expected_output=(
        "A numbered list of all To Do tickets with id, summary, description, "
        "assignee (user1 or user2), priority, and operation_type fields clearly labeled for each ticket. "
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
        "Check the operation_type field for each ticket and follow the correct action:\n"
        "\n"
        "━━━ operation_type = CREATE ━━━\n"
        "  1. Write a complete Next.js 14 page or component using the App Router.\n"
        "  2. Use Tailwind CSS for all styling — no inline styles, no other CSS libraries.\n"
        "  3. Save the file to the correct path inside: {vercel_project_path}/app/\n"
        "     e.g. assignments page → {vercel_project_path}/app/assignments/page.tsx\n"
        "  4. Every file must be 100% complete — no '...', no 'TODO', no placeholders.\n"
        "  5. Handle loading states and empty states in the UI.\n"
        "\n"
        "━━━ operation_type = MODIFY ━━━\n"
        "  1. Read the existing file that needs to be changed.\n"
        "  2. Apply ONLY the specific changes described in the ticket (e.g. change color class, update text).\n"
        "  3. Keep all other existing code exactly as it is.\n"
        "  4. Save the modified file back to the same path.\n"
        "\n"
        "━━━ operation_type = REMOVE ━━━\n"
        "  READ THIS CAREFULLY — removal works differently depending on what is being removed:\n"
        "\n"
        "  To REMOVE the Footer from all pages:\n"
        "    - Edit {vercel_project_path}/app/layout.tsx\n"
        "    - Delete the line: import Footer from './components/Footer';\n"
        "    - Delete the line: <Footer />\n"
        "    - Save the file. Do NOT change anything else in layout.tsx.\n"
        "\n"
        "  To REMOVE the Sidebar from all pages:\n"
        "    - DO NOT do this. The Sidebar is the main navigation. Skip this ticket and add comment 'Skipped: Sidebar removal not allowed'.\n"
        "\n"
        "  To REMOVE a section, div, or element from a specific page:\n"
        "    - Open the specific page file (e.g. {vercel_project_path}/app/assignments/page.tsx)\n"
        "    - Delete only the specific JSX block described in the ticket.\n"
        "    - Save the file.\n"
        "\n"
        "  To REMOVE a full page:\n"
        "    - Do not delete the file. Instead, make the page return a simple placeholder:\n"
        "      export default function Page() {{ return <div className='p-8 text-gray-500'>This section has been removed.</div>; }}\n"
        "\n"
        "━━━ operation_type = FIX ━━━\n"
        "  1. Read the broken file described in the ticket.\n"
        "  2. Fix only the specific bug or error described.\n"
        "  3. Save the fixed file.\n"
        "\n"
        "CRITICAL NEXT.JS RULES — ALWAYS FOLLOW:\n"
        "  - NEVER completely rewrite or overwrite app/layout.tsx — you MAY edit specific lines\n"
        "    (add/remove an import or JSX element) but do NOT rewrite the whole file.\n"
        "  - NEVER edit or overwrite app/components/Sidebar.tsx.\n"
        "  - Every page file (page.tsx) and every component that uses useState, useEffect,\n"
        "    onClick, or any React hook MUST have 'use client'; as the very first line.\n"
        "  - NEVER wrap page content in a <Layout> component — Next.js App Router applies\n"
        "    layout.tsx automatically. Just return your content directly.\n"
        "  - NEVER import Layout from '../layout' or './layout' in any page file.\n"
        "  - Use localStorage for client-side data storage — NOT fetch('/data/file.json').\n"
        "\n"
        "If there are no user1 tickets, output: 'No frontend tickets to process.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A list of all files modified, each with:\n"
        "  - Full filepath\n"
        "  - operation_type applied (CREATE / MODIFY / REMOVE / FIX)\n"
        "  - One-sentence summary of what was done\n"
        "  - Confirmation the file is complete and correct"
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
        "\n"
        "IMPORTANT: If a ticket is about UI, layout, color, component, footer, sidebar, navbar,\n"
        "or any visual/frontend change — DO NOT process it here.\n"
        "Output: 'Skipped [TICKET-ID]: frontend ticket, handled by frontend developer.'\n"
        "\n"
        "For each user2 ticket (backend only):\n"
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
