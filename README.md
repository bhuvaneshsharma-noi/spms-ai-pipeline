# SPMS — Student Personal Management System
### Fully Autonomous AI Agent Pipeline

Every day at 9:00 AM IST, this system wakes up automatically, reads open Jira tickets,
writes code, tests it, deploys to Vercel, and closes the tickets — zero human involvement.

---

## Architecture

```
n8n (9AM cron) → FastAPI /run-pipeline → CrewAI Crew
                                              │
                    ┌─────────────────────────┼───────────────────┐
                    │                         │                   │
              Agent 1                   Agent 2 + 3          Agent 4
           Ticket Reader           Frontend + Backend         Tester
          (reads Jira)              (writes code)          (runs tests)
                    │                         │                   │
                    └─────────────────────────┴───────────────────┘
                                              │
                                          Agent 5
                                    DevOps + Jira Updater
                                 (deploys to Vercel, closes tickets)
```

---

## Project Structure

```
spms-ai-pipeline/
├── .env                    # API keys — never commit
├── .gitignore
├── README.md
├── n8n_workflow.json       # Import into n8n
│
├── pipeline/               # Python AI pipeline
│   ├── requirements.txt
│   ├── main.py             # FastAPI server
│   ├── scheduler.py        # Backup scheduler (no n8n needed)
│   ├── agents.py           # 5 CrewAI agents
│   ├── tasks.py            # 5 sequential tasks
│   ├── tools.py            # JiraRead, JiraUpdate, FileWriter, Shell, Vercel
│   ├── jira_client.py      # Jira REST API helper
│   └── config.py           # .env loader
│
└── spms-app/               # Next.js 14 Student App
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx         # Dashboard
    │   ├── assignments/page.tsx
    │   ├── exams/page.tsx
    │   ├── attendance/page.tsx
    │   ├── timetable/page.tsx
    │   └── notes/page.tsx
    ├── components/          # AI writes components here
    ├── package.json
    └── tailwind.config.ts
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Pipeline runtime |
| Node.js | 18+ | Next.js app |
| Vercel CLI | latest | Deployment |
| n8n | latest | Scheduler |

Install Vercel CLI globally:
```bash
npm install -g vercel
```

---

## Setup — Step by Step

### 1. Clone and configure

```bash
git clone https://github.com/your-org/spms-ai-pipeline.git
cd spms-ai-pipeline
```

Edit `.env` and fill in every value:
```bash
cp .env .env.backup   # keep a backup
nano .env             # fill in all keys
```

Required values:
- `JIRA_URL` — e.g. `https://mycompany.atlassian.net`
- `JIRA_EMAIL` — your Atlassian account email
- `JIRA_TOKEN` — create at https://id.atlassian.com/manage-profile/security/api-tokens
- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
- `VERCEL_TOKEN` — from https://vercel.com/account/tokens
- `VERCEL_PROJECT_PATH` — absolute path to the `spms-app/` folder on your machine

### 2. Install Python dependencies

```bash
cd pipeline
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Install Node.js dependencies

```bash
cd ../spms-app
npm install
```

### 4. Verify Jira setup

Make sure your Jira project has:
- Project key: `SPMS`
- Two users: `user1` (frontend) and `user2` (backend)
- At least one ticket in "To Do" status assigned to user1 or user2

---

## Running the System

### Option A — Full Stack (recommended)

Open **3 terminals**:

**Terminal 1 — FastAPI Server:**
```bash
cd pipeline
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — n8n Scheduler:**
```bash
npx n8n start
```
Then open http://localhost:5678 → Import workflow → select `n8n_workflow.json`
Activate the workflow. It will trigger at 9:00 AM IST every day.

**Terminal 3 — Next.js Dev Server:**
```bash
cd spms-app
npm run dev
```
Open http://localhost:3000

### Option B — Without n8n (backup scheduler)

```bash
cd pipeline
source venv/bin/activate
python scheduler.py          # runs daily at 09:00
# OR trigger immediately:
python scheduler.py --now
```

---

## Testing the Pipeline Manually

Trigger the pipeline right now without waiting for the schedule:

```bash
curl -X POST http://localhost:8000/run-pipeline \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual", "time": "now"}'
```

Check pipeline status:
```bash
curl http://localhost:8000/status
```

Health check (confirms Jira + Vercel path):
```bash
curl http://localhost:8000/health
```

---

## How the Pipeline Works — Step by Step

1. **n8n** triggers at 9:00 AM IST and POSTs to `http://localhost:8000/run-pipeline`
2. **FastAPI** receives the request and starts the CrewAI crew in a background thread
3. **Agent 1 (Ticket Reader)** calls the Jira REST API and fetches all "To Do" tickets for user1 and user2, sorted by priority
4. **Agent 2 (Frontend Developer)** writes complete Next.js components for user1 tickets and saves them to `spms-app/app/`
5. **Agent 3 (Backend Developer)** writes complete FastAPI routes for user2 tickets and saves them to `spms-app/api/`
6. **Agent 4 (Tester)** writes Jest and pytest test files, runs them, and reports PASS/FAIL
7. **Agent 5 (DevOps)** deploys to Vercel if tests pass, then updates every Jira ticket to "Done" with the live URL as a comment. If tests fail, tickets are set back to "To Do" with an explanation.

---

## Jira Ticket Format

For best results, write tickets like this:

**Frontend ticket (assign to user1):**
```
Summary: Add assignments list page
Description: 
Create a Next.js page at /assignments that shows all assignments.
- List view with title, subject, due date, priority
- Add new assignment form
- Mark assignment as complete checkbox
- Filter by subject
- Use Tailwind CSS
- Store data in localStorage
```

**Backend ticket (assign to user2):**
```
Summary: Create assignments REST API
Description:
Create a FastAPI route file for assignments.
Endpoints needed:
- GET /assignments — list all
- POST /assignments — create new (title, subject, dueDate, priority)
- PUT /assignments/{id} — update (mark complete)
- DELETE /assignments/{id} — delete
Store data in JSON file at api/data/assignments.json
Include Pydantic models for request/response validation.
```

---

## SPMS App Features

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Summary cards: pending assignments, next exam, attendance %, today's classes |
| Assignments | `/assignments` | Add, complete, filter, delete assignments |
| Exams | `/exams` | Countdown to next exam, add/remove exams |
| Attendance | `/attendance` | Per-subject present/absent tracking with % bar |
| Timetable | `/timetable` | Weekly Mon-Sat grid with class slots |
| Notes | `/notes` | Notes by subject with search and inline editor |

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `JIRA_URL` | Jira instance base URL | `https://myco.atlassian.net` |
| `JIRA_EMAIL` | Your Atlassian email | `dev@myco.com` |
| `JIRA_TOKEN` | Jira API token | `ATATTxxx...` |
| `JIRA_PROJECT_KEY` | Jira project key | `SPMS` |
| `JIRA_USER1` | Frontend developer username | `user1` |
| `JIRA_USER2` | Backend developer username | `user2` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `VERCEL_TOKEN` | Vercel personal access token | `xxx...` |
| `VERCEL_PROJECT_PATH` | Absolute path to spms-app | `/home/user/spms-ai-pipeline/spms-app` |
| `FASTAPI_PORT` | Port for the FastAPI server | `8000` |

---

## Troubleshooting

**Jira unreachable:**
- Check `JIRA_URL` has no trailing slash
- Verify your API token is valid at https://id.atlassian.com/manage-profile/security/api-tokens
- Confirm user1 and user2 exist as Jira account IDs (not display names)

**Vercel deploy fails:**
- Run `vercel login` once manually to authenticate
- Make sure `VERCEL_PROJECT_PATH` points to the `spms-app/` folder
- Check that `vercel` CLI is installed: `vercel --version`

**Pipeline runs but no code is written:**
- Check that tickets have clear descriptions (the AI reads these to write code)
- Look at FastAPI logs: `http://localhost:8000/status`
- Run `python scheduler.py --now` to see verbose CrewAI output

**n8n not triggering:**
- Confirm the workflow is activated (toggle in top right of n8n UI)
- Check the timezone is set to `Asia/Kolkata`
- Test manually: activate the workflow and click "Execute Workflow" once

---

## Security Notes

- **Never commit `.env`** — it contains all your API keys
- The `.gitignore` already excludes `.env`
- Rotate your Jira and Vercel tokens if you accidentally expose them
- The FastAPI server has no authentication — run it only locally or behind a VPN

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** FastAPI (Python), Pydantic, Uvicorn
- **AI Agents:** CrewAI, LangChain, OpenAI gpt-4o-mini
- **Automation:** n8n (schedule trigger)
- **Deployment:** Vercel CLI
- **Project Tracking:** Jira REST API v3
