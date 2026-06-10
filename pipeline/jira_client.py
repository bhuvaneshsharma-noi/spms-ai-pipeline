"""
jira_client.py — All Jira REST API calls are centralised here.
Uses Basic Auth (email + API token) encoded in base64.
"""

import base64
import requests
from datetime import datetime
from typing import Any
from config import JIRA_URL, JIRA_EMAIL, JIRA_TOKEN, JIRA_PROJECT_KEY, JIRA_USER1, JIRA_USER2


def _auth_header() -> dict[str, str]:
    """Build the Authorization header required by Jira REST API v3."""
    credentials = f"{JIRA_EMAIL}:{JIRA_TOKEN}"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def get_todo_tickets() -> list[dict[str, Any]]:
    """Fetch all To Do tickets for user1 and user2, sorted by priority descending."""
    url = f"{JIRA_URL}/rest/api/3/search/jql"
    jql = (
        f'project={JIRA_PROJECT_KEY} '
        f'AND status="To Do" '
        f'ORDER BY priority DESC'
    )
    payload = {
        "jql": jql,
        "fields": ["summary", "description", "assignee", "priority", "status"],
        "maxResults": 50,
    }
    try:
        response = requests.post(url, headers=_auth_header(), json=payload, timeout=10)
        response.raise_for_status()
        issues = response.json().get("issues", [])
        tickets = []
        for issue in issues:
            fields = issue.get("fields", {})
            # Extract plain text from Atlassian Document Format description
            description = _extract_plain_text(fields.get("description"))
            assignee_field = fields.get("assignee") or {}
            tickets.append({
                "id": issue["key"],
                "summary": fields.get("summary", ""),
                "description": description,
                "assignee": assignee_field.get("accountId", ""),
                "assignee_name": assignee_field.get("displayName", ""),
                "priority": (fields.get("priority") or {}).get("name", "Medium"),
                "status": (fields.get("status") or {}).get("name", "To Do"),
            })
        print(f"[Jira] Fetched {len(tickets)} To Do tickets.")
        return tickets
    except requests.RequestException as exc:
        print(f"[Jira] ERROR fetching tickets: {exc}")
        return []


def get_transitions(ticket_id: str) -> list[dict[str, Any]]:
    """Retrieve available workflow transitions for a Jira ticket."""
    url = f"{JIRA_URL}/rest/api/3/issue/{ticket_id}/transitions"
    try:
        response = requests.get(url, headers=_auth_header(), timeout=10)
        response.raise_for_status()
        return response.json().get("transitions", [])
    except requests.RequestException as exc:
        print(f"[Jira] ERROR fetching transitions for {ticket_id}: {exc}")
        return []


def transition_ticket(ticket_id: str, target_status: str) -> bool:
    """Move a ticket to target_status (e.g. 'In Progress', 'Done', 'To Do')."""
    transitions = get_transitions(ticket_id)
    transition_id = None
    for t in transitions:
        if t.get("name", "").lower() == target_status.lower():
            transition_id = t["id"]
            break
    if not transition_id:
        print(f"[Jira] Could not find transition '{target_status}' for {ticket_id}.")
        return False
    url = f"{JIRA_URL}/rest/api/3/issue/{ticket_id}/transitions"
    payload = {"transition": {"id": transition_id}}
    try:
        response = requests.post(url, headers=_auth_header(), json=payload, timeout=10)
        response.raise_for_status()
        print(f"[Jira] {ticket_id} transitioned to '{target_status}'.")
        return True
    except requests.RequestException as exc:
        print(f"[Jira] ERROR transitioning {ticket_id}: {exc}")
        return False


def block_ticket(ticket_id: str, reason: str, action_needed: str = "") -> bool:
    """
    Mark a ticket as BLOCKED:
      - Transitions to BLOCKED status (appears in BLOCKED column on board)
      - Adds label BLOCKED + sets priority to Highest
      - Posts a detailed comment with reason and action needed
    CEO sees: ticket in BLOCKED column with red label at Highest priority.
    """
    transition_ticket(ticket_id, "BLOCKED")

    url = f"{JIRA_URL}/rest/api/3/issue/{ticket_id}"
    try:
        requests.put(url, headers=_auth_header(), timeout=10, json={
            "fields": {
                "labels": ["BLOCKED"],
                "priority": {"name": "Highest"},
            }
        })
    except requests.RequestException as exc:
        print(f"[Jira] ERROR setting BLOCKED label on {ticket_id}: {exc}")

    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    msg = f"🚨 BLOCKED — AI Pipeline failure at {ts}\n\nReason: {reason}"
    if action_needed:
        msg += f"\n\nAction needed: {action_needed}"
    add_comment(ticket_id, msg)
    print(f"[Jira] {ticket_id} marked as BLOCKED.")
    return True


def add_comment(ticket_id: str, comment: str) -> bool:
    """Post a plain-text comment on a Jira ticket using Atlassian Document Format."""
    url = f"{JIRA_URL}/rest/api/3/issue/{ticket_id}/comment"
    payload = {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": comment}],
                }
            ],
        }
    }
    try:
        response = requests.post(url, headers=_auth_header(), json=payload, timeout=10)
        response.raise_for_status()
        print(f"[Jira] Comment added to {ticket_id}.")
        return True
    except requests.RequestException as exc:
        print(f"[Jira] ERROR adding comment to {ticket_id}: {exc}")
        return False


def get_active_sprint_id(board_id: int = 34) -> int | None:
    url = f"{JIRA_URL}/rest/agile/1.0/board/{board_id}/sprint?state=active"
    try:
        response = requests.get(url, headers=_auth_header(), timeout=10)
        response.raise_for_status()
        sprints = response.json().get("values", [])
        return sprints[0]["id"] if sprints else None
    except requests.RequestException as exc:
        print(f"[Jira] ERROR fetching active sprint: {exc}")
        return None


def move_to_sprint(sprint_id: int, ticket_ids: list[str]) -> bool:
    if not ticket_ids:
        return True
    url = f"{JIRA_URL}/rest/agile/1.0/sprint/{sprint_id}/issue"
    try:
        response = requests.post(url, headers=_auth_header(),
                                 json={"issues": ticket_ids}, timeout=10)
        if response.status_code in (204, 200):
            print(f"[Jira] Moved {ticket_ids} to sprint {sprint_id}.")
            return True
        print(f"[Jira] Move to sprint returned {response.status_code}: {response.text[:200]}")
        return False
    except requests.RequestException as exc:
        print(f"[Jira] ERROR moving to sprint: {exc}")
        return False


def check_jira_reachable() -> bool:
    """Ping Jira to confirm the instance is reachable and credentials work."""
    url = f"{JIRA_URL}/rest/api/3/myself"
    try:
        response = requests.get(url, headers=_auth_header(), timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False


def _extract_plain_text(description: Any) -> str:
    """Recursively extract plain text from Jira's Atlassian Document Format (ADF)."""
    if description is None:
        return ""
    if isinstance(description, str):
        return description
    if isinstance(description, dict):
        if description.get("type") == "text":
            return description.get("text", "")
        texts = []
        for child in description.get("content", []):
            texts.append(_extract_plain_text(child))
        return " ".join(t for t in texts if t)
    return ""
