"""
troy-worker
SQS-Triggered Cloud Worker
Triggered by: EventBridge → SQS → Lambda (1 message at a time)
Handles: github_push / bridge_invoke / signal_process / execute_decision / lambda_deploy
Writes results back to execution_tasks in Supabase.
"""
import json
import os
import base64
from typing import Any, Dict, Optional

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_POST_URL", "")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")
GITHUB_PAT   = os.environ.get("GITHUB_PAT", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# ─── Supabase helpers ─────────────────────────────────────────────────────────

def _patch_task(task_id: str, update: Dict) -> None:
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/execution_tasks",
        headers={**HEADERS, "Prefer": "return=minimal"},
        params={"id": f"eq.{task_id}"},
        json=update,
        timeout=30,
    ).raise_for_status()


def _mark_complete(task_id: str, result: Any) -> None:
    _patch_task(task_id, {"status": "completed", "result": result})


def _mark_failed(task_id: str, error: str, attempts: int) -> None:
    status = "failed" if attempts >= 3 else "retrying"
    _patch_task(task_id, {"status": status, "error_msg": error[:500], "attempts": attempts})


def _mark_running(task_id: str) -> None:
    _patch_task(task_id, {"status": "running"})


# ─── Task handlers ────────────────────────────────────────────────────────────

def run_bridge(task: Dict) -> Dict:
    """Forward payload to bridge endpoint."""
    if not BRIDGE_URL or not BRIDGE_KEY:
        raise RuntimeError("BRIDGE_POST_URL / BRIDGE_API_KEY not configured")
    r = requests.post(
        BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json=task["payload"],
        timeout=60,
    )
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_signal_process(task: Dict) -> Dict:
    """Ingest a signal through the signal engine."""
    if not BRIDGE_URL or not BRIDGE_KEY:
        raise RuntimeError("Bridge not configured")
    payload = {**task["payload"], "fn": "troy-signal-engine", "action": "ingest_signal"}
    r = requests.post(
        BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json=payload,
        timeout=60,
    )
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_execute_decision(task: Dict) -> Dict:
    """Execute a decision through the signal executor."""
    if not BRIDGE_URL or not BRIDGE_KEY:
        raise RuntimeError("Bridge not configured")
    r = requests.post(
        BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json={"fn": "troy-signal-executor", "action": "execute_decision", **task["payload"]},
        timeout=60,
    )
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_github_push(task: Dict) -> Dict:
    """Push one or more files to a GitHub repo."""
    if not GITHUB_PAT:
        raise RuntimeError("GITHUB_PAT not configured")

    payload = task["payload"]
    repo    = payload["repo"]          # e.g. "TML-4PM/tech-for-humanity"
    branch  = payload.get("branch", "main")
    files   = payload["files"]         # [{"path": "...", "content": "..."}]
    message = payload.get("message", "chore: automated push from troy-worker")

    gh_headers = {
        "Authorization": f"Bearer {GITHUB_PAT}",
        "Content-Type": "application/json",
    }

    results = []
    for f in files:
        path    = f["path"]
        content = base64.b64encode(f["content"].encode()).decode()
        api_url = f"https://api.github.com/repos/{repo}/contents/{path}"

        # Check existing SHA
        existing = requests.get(api_url, headers=gh_headers, params={"ref": branch}, timeout=30)
        sha = existing.json().get("sha") if existing.status_code == 200 else None

        body = {"message": message, "content": content, "branch": branch}
        if sha:
            body["sha"] = sha

        r = requests.put(api_url, headers=gh_headers, json=body, timeout=30)
        results.append({"path": path, "status_code": r.status_code, "ok": r.status_code in (200, 201)})

    return {"files_pushed": results, "all_ok": all(f["ok"] for f in results)}


# ─── Dispatcher ──────────────────────────────────────────────────────────────

HANDLERS = {
    "bridge_invoke":     run_bridge,
    "signal_process":    run_signal_process,
    "execute_decision":  run_execute_decision,
    "github_push":       run_github_push,
}


def process_task(task: Dict) -> None:
    task_id  = task.get("id", "unknown")
    task_type = task.get("task_type")
    attempts  = int(task.get("attempts", 0)) + 1

    _mark_running(task_id)

    fn = HANDLERS.get(task_type)
    if not fn:
        _mark_failed(task_id, f"unknown task_type: {task_type}", attempts)
        return

    try:
        result = fn(task)
        _mark_complete(task_id, result)
    except Exception as e:
        _mark_failed(task_id, str(e), attempts)
        raise  # let SQS retry


# ─── Handler ─────────────────────────────────────────────────────────────────

def handler(event, context):
    """SQS trigger — processes one message at a time (batch_size=1)."""
    for record in event.get("Records", []):
        try:
            body = json.loads(record["body"])
            process_task(body)
        except json.JSONDecodeError as e:
            print(f"[WORKER] JSON parse error: {e} | body: {record.get('body','')[:200]}")
            raise  # DLQ
        except Exception as e:
            print(f"[WORKER] task failed: {e}")
            raise  # SQS retry → DLQ after max attempts

    return {"ok": True, "processed": len(event.get("Records", []))}
