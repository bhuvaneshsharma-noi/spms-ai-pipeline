"""
tasks.py — All 5 CrewAI tasks executed sequentially.
Agents only WRITE CODE — all Jira transitions and deployments are handled by main.py.
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
        "Fetch all 'To Do' tickets from Jira project SPMS using JiraReadTool. "
        "Sort tickets by priority descending (High → Medium → Low). "
        "For each ticket extract and clearly label:\n"
        "  - id: the Jira ticket key (e.g. SPMS-22)\n"
        "  - summary: one-line description\n"
        "  - description: full requirement details\n"
        "  - assignee: user1 (frontend) or user2 (backend)\n"
        "  - priority: High / Medium / Low\n"
        "  - operation_type:\n"
        "      CREATE  — build a new page, component, or feature\n"
        "      MODIFY  — change or update an existing component\n"
        "      REMOVE  — remove, delete, hide, or disable something\n"
        "      FIX     — fix a bug or broken behaviour\n"
        "\n"
        "CLASSIFICATION RULES:\n"
        "  - 'remove', 'delete', 'hide', 'disable', 'get rid of' → REMOVE\n"
        "  - 'change', 'update', 'modify', 'edit', 'rename', 'apply' → MODIFY\n"
        "  - 'fix', 'bug', 'broken', 'error', 'issue' → FIX\n"
        "  - Everything else → CREATE\n"
        "\n"
        "ASSIGNMENT RULES (if unassigned):\n"
        "  - UI, layout, color, component, page, footer, sidebar, navbar, theme → user1\n"
        "  - API, route, endpoint, database, backend, data → user2\n"
        "\n"
        "Return the complete structured list. "
        "If no tickets found, return: 'NO_TICKETS_FOUND'."
    ),
    expected_output=(
        "A numbered list of all To Do tickets with id, summary, description, "
        "assignee (user1 or user2), priority, and operation_type clearly labeled. "
        "Sorted by priority descending."
    ),
    agent=ticket_reader,
)


# ─────────────────────────────────────────────────────────────
# Task 2 — Frontend Development
# ─────────────────────────────────────────────────────────────

frontend_task = Task(
    description=(
        "Using the ticket list from Task 1, process ONLY tickets assigned to user1.\n"
        "Check the operation_type field for each ticket and follow the correct action:\n"
        "\n"
        "━━━ operation_type = CREATE ━━━\n"
        "  1. Write a complete Next.js page or component using the App Router.\n"
        "  2. Use Tailwind CSS only — no inline styles, no other CSS libraries.\n"
        "  3. Save to the correct path inside: {vercel_project_path}/app/\n"
        "     e.g. assignments page → {vercel_project_path}/app/assignments/page.tsx\n"
        "  4. Every file must be 100% complete — no '...', no 'TODO', no placeholders.\n"
        "  5. Handle loading states and empty states.\n"
        "\n"
        "━━━ operation_type = MODIFY ━━━\n"
        "  1. Use FileReaderTool to read the existing file FIRST.\n"
        "  2. Apply ONLY the specific changes in the ticket.\n"
        "  3. Keep all other existing code exactly as-is.\n"
        "  4. Save the modified file back to the same path.\n"
        "\n"
        "━━━ operation_type = REMOVE ━━━\n"
        "  To REMOVE the Footer:\n"
        "    - Use FileReaderTool to read {vercel_project_path}/app/layout.tsx first.\n"
        "    - Delete only: import line for Footer and <Footer /> JSX tag.\n"
        "    - Keep everything else in layout.tsx unchanged.\n"
        "\n"
        "  To REMOVE a section from a specific page:\n"
        "    - Read the file first, then delete only the described JSX block.\n"
        "\n"
        "  To REMOVE a full page:\n"
        "    - Replace with: export default function Page() {{ return <div className='p-8 text-gray-500'>Removed.</div>; }}\n"
        "\n"
        "━━━ operation_type = FIX ━━━\n"
        "  1. Read the broken file first using FileReaderTool.\n"
        "  2. Fix only the specific bug described. Keep everything else unchanged.\n"
        "  3. Save the fixed file.\n"
        "\n"
        "CRITICAL RULES — NEVER BREAK THESE:\n"
        "  - NEVER rewrite app/layout.tsx completely — only edit specific lines.\n"
        "  - NEVER edit app/components/Sidebar.tsx.\n"
        "  - Every file using useState/useEffect/onClick MUST start with 'use client';\n"
        "  - NEVER wrap content in <Layout> — Next.js applies layout.tsx automatically.\n"
        "  - NEVER import Layout from '../layout' in any page.\n"
        "  - Use localStorage for client-side storage, not fetch('/data/file.json').\n"
        "  - TypeScript ONLY — every variable, param, and state must be typed.\n"
        "  - catch blocks: always use catch (err: unknown) and (err as Error).message\n"
        "  - useState arrays: useState<Type[]>([]) — never useState([])\n"
        "\n"
        "DO NOT update Jira. DO NOT deploy. Only write files.\n"
        "If no user1 tickets, output: 'No frontend tickets to process.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A list of all files written or modified:\n"
        "  - Full filepath\n"
        "  - operation_type applied (CREATE / MODIFY / REMOVE / FIX)\n"
        "  - One-sentence summary of what was changed\n"
        "  - Confirmation the file is complete with no placeholders"
    ),
    agent=frontend_developer,
    context=[read_tickets_task],
)


# ─────────────────────────────────────────────────────────────
# Task 3 — Backend Development
# ─────────────────────────────────────────────────────────────

backend_task = Task(
    description=(
        "Using the ticket list from Task 1, process ONLY tickets assigned to user2.\n"
        "\n"
        "If a ticket is about UI, layout, color, component, footer, sidebar, or navbar "
        "— DO NOT process it. Output: 'Skipped [ID]: frontend ticket.'\n"
        "\n"
        "For each user2 ticket:\n"
        "  1. Write a complete Next.js API route file (TypeScript).\n"
        "  2. Save to: {vercel_project_path}/app/api/<feature>/route.ts\n"
        "  3. Use proper HTTP methods (GET, POST, PUT, DELETE).\n"
        "  4. Include input validation and error handling.\n"
        "  5. Use a JSON file in {vercel_project_path}/data/ for persistence.\n"
        "  6. 100% complete — no TODOs, no placeholders.\n"
        "\n"
        "DO NOT update Jira. DO NOT deploy. Only write files.\n"
        "If no user2 tickets: 'No backend tickets to process.'"
    ).format(vercel_project_path=VERCEL_PROJECT_PATH),
    expected_output=(
        "A list of all API route files written:\n"
        "  - Full filepath\n"
        "  - HTTP endpoints created (method + path)\n"
        "  - Confirmation the file is complete"
    ),
    agent=backend_developer,
    context=[read_tickets_task],
)


# ─────────────────────────────────────────────────────────────
# Task 4 — Code Review (NOT test execution)
# ─────────────────────────────────────────────────────────────

testing_task = Task(
    description=(
        "Review all files written by the frontend and backend developers.\n"
        "For each file, check:\n"
        "  1. 'use client' present at top if using React hooks\n"
        "  2. No Layout wrapper imports or usage\n"
        "  3. All TypeScript types are explicit (no 'any' without generics)\n"
        "  4. catch blocks use (err: unknown) and (err as Error).message\n"
        "  5. useState arrays typed as useState<Type[]>([])\n"
        "  6. No placeholder text ('...', 'TODO', 'PLACEHOLDER')\n"
        "  7. All imports are valid (no react-icons, no missing modules)\n"
        "\n"
        "DO NOT run any shell commands. DO NOT execute npm test or pytest.\n"
        "This is a CODE REVIEW ONLY — read the file content and check manually.\n"
        "\n"
        "For each file output:\n"
        "  REVIEW PASS: [filepath] — all checks passed\n"
        "  REVIEW WARN: [filepath] — [specific issue found]\n"
        "\n"
        "End with one of:\n"
        "  OVERALL: PASS\n"
        "  OVERALL: PASS WITH WARNINGS — [count] warnings found\n"
        "\n"
        "If no files were written: output 'No files to review. OVERALL: PASS'"
    ),
    expected_output=(
        "Review results for every file (PASS or WARN).\n"
        "Final line must be: 'OVERALL: PASS' or 'OVERALL: PASS WITH WARNINGS — N warnings'"
    ),
    agent=tester,
    context=[frontend_task, backend_task],
)


# ─────────────────────────────────────────────────────────────
# Task 5 — Summary Report (deployment handled by main.py)
# ─────────────────────────────────────────────────────────────

deploy_and_update_task = Task(
    description=(
        "Read the code review results from Task 4.\n\n"
        "Write a concise deployment summary report containing:\n"
        "  1. Total files written by frontend developer\n"
        "  2. Total files written by backend developer\n"
        "  3. Code review result (PASS / PASS WITH WARNINGS)\n"
        "  4. List of all ticket IDs that were processed (e.g. SPMS-22, SPMS-23)\n"
        "  5. Any warnings from code review\n\n"
        "DO NOT call JiraUpdateTool. DO NOT run VercelDeployTool.\n"
        "DO NOT transition any Jira tickets.\n"
        "The deployment and Jira updates are handled automatically by the pipeline — "
        "your job is only to write this summary.\n\n"
        "Format the summary clearly so it can be read at a glance."
    ),
    expected_output=(
        "A deployment summary with:\n"
        "  - Files written count (frontend + backend)\n"
        "  - Code review result\n"
        "  - List of processed ticket IDs\n"
        "  - Any warnings or notes"
    ),
    agent=devops_updater,
    context=[testing_task],
)
