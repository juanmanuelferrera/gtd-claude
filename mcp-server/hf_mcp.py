#!/usr/bin/env python3
"""HyperFiler MCP Server — gives Claude tools to manage HyperFiler tasks."""

import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

API_BASE = "https://hyperfiler-api.joanmanelferrera-400.workers.dev"
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".org2hyperfiler.env")

mcp = FastMCP("hyperfiler")

# Cached auth state
_auth = {"token": None, "user_id": None}


def _load_credentials():
    creds = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                creds[k.strip()] = v.strip()
    return creds.get("EMAIL"), creds.get("PASSWORD")


def _api(method, path, data=None, token=None):
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://hyperfiler.pro",
        "Referer": "https://hyperfiler.pro/",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def _ensure_auth():
    if _auth["token"]:
        # Verify token still works; re-auth if expired
        try:
            _api("GET", f"/tasks/{_auth['user_id']}", token=_auth["token"])
            return _auth["token"], _auth["user_id"]
        except urllib.error.HTTPError as e:
            if e.code == 401:
                _auth["token"] = None
                _auth["user_id"] = None
            else:
                raise
    email, password = _load_credentials()
    result = _api("POST", "/auth/login", {"email": email, "password": password})
    _auth["token"] = result["token"]
    _auth["user_id"] = result["user"]["id"]
    return _auth["token"], _auth["user_id"]


def _get_all_tasks():
    token, user_id = _ensure_auth()
    result = _api("GET", f"/tasks/{user_id}", token=token)
    tasks_data = result.get("tasks", [])
    if isinstance(tasks_data, list) and len(tasks_data) > 0:
        first = tasks_data[0]
        if isinstance(first, dict) and "task_data" in first:
            return json.loads(first["task_data"])
        return tasks_data
    return []


def _sync_tasks(all_tasks):
    token, user_id = _ensure_auth()
    result = _api("POST", "/tasks/sync", {"userId": user_id, "tasks": all_tasks}, token=token)
    return result and result.get("success")


@mcp.tool()
def hf_list_tasks(
    status: str = "",
    template: str = "",
    date: str = "",
) -> str:
    """List HyperFiler tasks. Optional filters: status (pending/completed), template (@project), date (YYYY-MM-DD)."""
    tasks = _get_all_tasks()
    active = [t for t in tasks if not t.get("isDeleted")]
    if status:
        active = [t for t in active if t.get("status") == status]
    if template:
        tpl = template.lower().lstrip("@")
        active = [t for t in active if tpl in (t.get("notes") or "").lower() or tpl in (t.get("template") or "").lower()]
    if date:
        active = [t for t in active if t.get("dueDate") == date]
    if not active:
        return "No tasks found."
    lines = []
    for t in active:
        line = f"- [{t.get('status','?')}] {t.get('title','')}  (id: {t.get('id','')})"
        if t.get("dueDate"):
            line += f"  due: {t['dueDate']}"
        if t.get("notes"):
            line += f"  notes: {t['notes']}"
        lines.append(line)
    return "\n".join(lines)


@mcp.tool()
def hf_create_task(
    title: str,
    notes: str = "",
    due_date: str = "",
    due_time: str = "",
    template: str = "",
) -> str:
    """Create a new HyperFiler task. title is required. due_date as YYYY-MM-DD, template as @project name."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    # Tasks created via MCP without a date go to backlog (2099-01-01)
    BACKLOG_DATE = "2099-01-01"
    new_task = {
        "id": str(int(time.time() * 1000)),
        "title": title,
        "notes": notes,
        "images": [],
        "dueDate": due_date or BACKLOG_DATE,
        "dueTime": due_time or None,
        "status": "pending",
        "repeatType": None,
        "template": template or None,
        "isEvent": False,
        "createdAt": now,
        "updatedAt": now,
        "isDeleted": False,
        "deletedAt": None,
    }
    all_tasks = _get_all_tasks() + [new_task]
    if _sync_tasks(all_tasks):
        return f"Created task: {title} (id: {new_task['id']})"
    return "Failed to create task."


@mcp.tool()
def hf_delete_task(task_id: str) -> str:
    """Delete a HyperFiler task by its ID."""
    all_tasks = _get_all_tasks()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    found = False
    for t in all_tasks:
        if str(t.get("id")) == task_id:
            t["isDeleted"] = True
            t["deletedAt"] = now
            t["updatedAt"] = now
            t["status"] = "deleted"
            found = True
            break
    if not found:
        return f"Task {task_id} not found."
    if _sync_tasks(all_tasks):
        return f"Deleted task {task_id}."
    return "Failed to delete task."


@mcp.tool()
def hf_complete_task(task_id: str) -> str:
    """Mark a HyperFiler task as completed by its ID."""
    all_tasks = _get_all_tasks()
    found = False
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    for t in all_tasks:
        if str(t.get("id")) == task_id:
            t["status"] = "completed"
            t["updatedAt"] = now
            found = True
            break
    if not found:
        return f"Task {task_id} not found."
    if _sync_tasks(all_tasks):
        return f"Task {task_id} marked completed."
    return "Failed to update task."


@mcp.tool()
def hf_update_task(
    task_id: str,
    title: str = "",
    notes: str = "",
    due_date: str = "",
    due_time: str = "",
    status: str = "",
) -> str:
    """Update fields on a HyperFiler task. Only provided fields are changed."""
    all_tasks = _get_all_tasks()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    found = False
    for t in all_tasks:
        if str(t.get("id")) == task_id:
            if title:
                t["title"] = title
            if notes:
                t["notes"] = notes
            if due_date:
                t["dueDate"] = due_date
            if due_time:
                t["dueTime"] = due_time
            if status:
                t["status"] = status
            t["updatedAt"] = now
            found = True
            break
    if not found:
        return f"Task {task_id} not found."
    if _sync_tasks(all_tasks):
        return f"Task {task_id} updated."
    return "Failed to update task."


@mcp.tool()
def hf_list_templates() -> str:
    """List all HyperFiler templates/projects."""
    token, user_id = _ensure_auth()
    try:
        result = _api("GET", f"/templates/{user_id}", token=token)
        templates = result.get("templates", [])
        if not templates:
            return "No templates found."
        return "\n".join(f"- {t.get('name', t)}" for t in templates)
    except urllib.error.HTTPError:
        # Fallback: extract unique @project from task notes
        tasks = _get_all_tasks()
        projects = set()
        for t in tasks:
            notes = t.get("notes", "")
            if notes.startswith("@"):
                projects.add(notes)
        if not projects:
            return "No templates found."
        return "\n".join(f"- {p}" for p in sorted(projects))


@mcp.tool()
def hf_search_tasks(query: str) -> str:
    """Search HyperFiler tasks by text in title or notes."""
    tasks = _get_all_tasks()
    q = query.lower()
    matches = [t for t in tasks if not t.get("isDeleted") and (
        q in (t.get("title") or "").lower() or q in (t.get("notes") or "").lower()
    )]
    if not matches:
        return f"No tasks matching '{query}'."
    lines = []
    for t in matches:
        line = f"- [{t.get('status','?')}] {t.get('title','')}  (id: {t.get('id','')})"
        if t.get("dueDate"):
            line += f"  due: {t['dueDate']}"
        lines.append(line)
    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run(transport="stdio")
