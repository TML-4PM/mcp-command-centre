"""
troy-worker  v2
Execution modes:
  1. SQS trigger     — processes one message at a time (Records[])
  2. EventBridge drain — pulls queued execution_tasks from Supabase, processes batch
  3. Direct invoke   — {"action":"drain"} or {"action":"process_task","task":{...}}
"""
import json, os, base64
from typing import Any, Dict, List, Optional
import requests

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_POST_URL", "")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")
GITHUB_PAT   = os.environ.get("GITHUB_PAT", "")
DRAIN_BATCH  = int(os.environ.get("DRAIN_BATCH_SIZE", "10"))

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# ── Supabase helpers ──────────────────────────────────────────────────────────

def _get(path: str, params: Dict = None) -> Any:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status(); return r.json()

def _patch(path: str, payload: Any, params: Dict = None) -> None:
    h = {**HEADERS, "Prefer": "return=minimal"}
    requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, json=payload, timeout=30).raise_for_status()


# ── Task state helpers ────────────────────────────────────────────────────────

def _mark(task_id: str, status: str, result: Any = None, error: str = None, attempts: int = None) -> None:
    update = {"status": status}
    if result   is not None: update["result"]    = result
    if error    is not None: update["error_msg"] = error[:500]
    if attempts is not None: update["attempts"]  = attempts
    _patch("execution_tasks", update, {"id": f"eq.{task_id}"})


# ── Task handlers ─────────────────────────────────────────────────────────────

def run_bridge(task: Dict) -> Dict:
    if not BRIDGE_URL: raise RuntimeError("BRIDGE_POST_URL not set")
    r = requests.post(BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json=task["payload"], timeout=60)
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_signal_process(task: Dict) -> Dict:
    if not BRIDGE_URL: raise RuntimeError("BRIDGE_POST_URL not set")
    r = requests.post(BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json={"fn": "troy-signal-engine", "action": "ingest_signal", **task["payload"]}, timeout=60)
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_execute_decision(task: Dict) -> Dict:
    if not BRIDGE_URL: raise RuntimeError("BRIDGE_POST_URL not set")
    r = requests.post(BRIDGE_URL,
        headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
        json={"fn": "troy-signal-executor", "action": "execute_decision", **task["payload"]}, timeout=60)
    return {"status_code": r.status_code, "body": r.json() if r.text else {}}


def run_github_push(task: Dict) -> Dict:
    if not GITHUB_PAT: raise RuntimeError("GITHUB_PAT not set")
    p = task["payload"]
    repo, branch = p["repo"], p.get("branch", "main")
    msg = p.get("message", "chore: automated push [troy-worker]")
    gh  = {"Authorization": f"Bearer {GITHUB_PAT}", "Content-Type": "application/json"}
    results = []
    for f in p["files"]:
        path    = f["path"]
        content = base64.b64encode(f["content"].encode()).decode()
        api_url = f"https://api.github.com/repos/{repo}/contents/{path}"
        existing = requests.get(api_url, headers=gh, params={"ref": branch}, timeout=30)
        body = {"message": msg, "content": content, "branch": branch}
        if existing.status_code == 200:
            body["sha"] = existing.json().get("sha")
        r = requests.put(api_url, headers=gh, json=body, timeout=30)
        results.append({"path": path, "ok": r.status_code in (200, 201), "status_code": r.status_code})
    return {"files_pushed": results, "all_ok": all(f["ok"] for f in results)}


HANDLERS = {
    "bridge_invoke":    run_bridge,
    "signal_process":   run_signal_process,
    "execute_decision": run_execute_decision,
    "github_push":      run_github_push,
}


# ── Core process ──────────────────────────────────────────────────────────────

def process_task(task: Dict) -> Dict:
    task_id   = task.get("id", "unknown")
    task_type = task.get("task_type")
    attempts  = int(task.get("attempts", 0)) + 1
    _mark(task_id, "running", attempts=attempts)
    fn = HANDLERS.get(task_type)
    if not fn:
        _mark(task_id, "failed", error=f"unknown task_type: {task_type}", attempts=attempts)
        return {"ok": False, "error": f"unknown task_type: {task_type}"}
    try:
        result = fn(task)
        _mark(task_id, "completed", result=result, attempts=attempts)
        return {"ok": True, "result": result}
    except Exception as e:
        status = "failed" if attempts >= int(task.get("max_attempts", 3)) else "retrying"
        _mark(task_id, status, error=str(e), attempts=attempts)
        raise


def drain_tasks(task_types: List[str] = None, batch: int = None) -> Dict:
    """Pull queued execution_tasks and process them (EventBridge drain mode)."""
    batch = batch or DRAIN_BATCH
    params = {
        "select": "*",
        "status": "in.(queued,retrying)",
        "order": "created_at.asc",
        "limit": str(batch),
    }
    if task_types:
        params["task_type"] = f"in.({','.join(task_types)})"

    tasks = _get("execution_tasks", params)
    if not tasks:
        return {"ok": True, "drained": 0, "message": "queue empty"}

    processed, failed = 0, 0
    for task in tasks:
        try:
            process_task(task)
            processed += 1
        except Exception as e:
            failed += 1
            print(f"[WORKER] task {task.get('id')} failed: {e}")

    return {"ok": True, "drained": processed, "failed": failed, "total": len(tasks)}


# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event, context):
    try:
        # SQS trigger mode
        if event.get("Records"):
            processed = 0
            for record in event["Records"]:
                task = json.loads(record["body"])
                process_task(task)
                processed += 1
            return {"ok": True, "processed": processed}

        # Direct / EventBridge mode
        body = event.get("body") or event
        if isinstance(body, str):
            body = json.loads(body)

        action = body.get("action", "drain")

        if action == "drain":
            task_types = body.get("task_types")
            batch      = body.get("batch_size", DRAIN_BATCH)
            result     = drain_tasks(task_types, batch)
            return {"statusCode": 200, "body": json.dumps(result)}

        if action == "process_task":
            result = process_task(body["task"])
            return {"statusCode": 200, "body": json.dumps(result)}

        return {"statusCode": 400, "body": json.dumps({"ok": False, "error": f"unknown action: {action}"})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"ok": False, "error": str(e)})}
