"""
config.py — Loads all environment variables from .env and exposes them
as module-level constants used throughout the pipeline.
"""

import os
from dotenv import load_dotenv

# Load .env file from the project root (one level above pipeline/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# Jira settings
JIRA_URL = os.getenv("JIRA_URL", "")
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "")
JIRA_TOKEN = os.getenv("JIRA_TOKEN", "")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY", "SPMS")
JIRA_USER1 = os.getenv("JIRA_USER1", "user1")
JIRA_USER2 = os.getenv("JIRA_USER2", "user2")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Vercel
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "")
VERCEL_PROJECT_PATH = os.getenv("VERCEL_PROJECT_PATH", "")

# FastAPI
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT", "8000"))

def validate_config() -> list[str]:
    """Check that all required env vars are set and return a list of missing ones."""
    required = {
        "JIRA_URL": JIRA_URL,
        "JIRA_EMAIL": JIRA_EMAIL,
        "JIRA_TOKEN": JIRA_TOKEN,
        "OPENAI_API_KEY": OPENAI_API_KEY,
        "VERCEL_TOKEN": VERCEL_TOKEN,
        "VERCEL_PROJECT_PATH": VERCEL_PROJECT_PATH,
    }
    missing = [k for k, v in required.items() if not v]
    return missing
