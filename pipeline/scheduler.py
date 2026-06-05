"""
scheduler.py — Backup scheduler that runs the pipeline without n8n.
Uses the 'schedule' library to trigger the CrewAI crew at 09:00 daily.
Can also be run immediately with: python scheduler.py --now
"""

import sys
import time
import logging
from datetime import datetime

import schedule

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("SPMS-Scheduler")


def run_pipeline() -> None:
    """Import and execute the full CrewAI pipeline crew."""
    log.info("=" * 60)
    log.info("SPMS Pipeline starting at %s", datetime.now().isoformat())
    log.info("=" * 60)

    try:
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

        log.info("Step 1/5 — Ticket Reader: fetching Jira tickets...")
        log.info("Step 2/5 — Frontend Developer: writing Next.js components...")
        log.info("Step 3/5 — Backend Developer: writing FastAPI routes...")
        log.info("Step 4/5 — Tester: running tests...")
        log.info("Step 5/5 — DevOps: deploying to Vercel and updating Jira...")

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
        log.info("Pipeline completed successfully.")
        log.info("Result: %s", str(result)[:500])

    except Exception as exc:
        log.error("Pipeline failed with error: %s", exc, exc_info=True)

    log.info("=" * 60)
    log.info("Pipeline run finished at %s", datetime.now().isoformat())
    log.info("=" * 60)


def start_scheduled_runner() -> None:
    """Schedule the pipeline to run at 09:00 every day and block until interrupted."""
    log.info("SPMS Scheduler started. Pipeline will run daily at 09:00.")
    log.info("Press Ctrl+C to stop.")

    schedule.every().day.at("09:00").do(run_pipeline)

    while True:
        schedule.run_pending()
        time.sleep(30)  # check every 30 seconds


if __name__ == "__main__":
    # Run immediately if --now flag is passed, otherwise start daily schedule
    if "--now" in sys.argv:
        log.info("--now flag detected: running pipeline immediately.")
        run_pipeline()
    else:
        start_scheduled_runner()
