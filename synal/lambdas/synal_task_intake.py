"""
synal-task-intake
T4H Lambda — Synal signal ingestion endpoint
Routes: /task-intake  /task-run  /task-refresh  /task-status
Supabase: S1 lzfgigiyqpuuxslsygjt
RDTI: is_rd=True, project_code=SYNAL
"""
import json
import os
import uuid
from datetime import datetime, timezone
import urllib.request
import urllib.error

SUPABASE_URL = os.environ["SUPABASE_URL"]          # https://lzfgigiyqpuuxslsygjt.supabase.co
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def sb_rpc(fn, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    req = urllib.request.Request(url, json.dumps(params).encode(), HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.read().decode()}"
    except Exception as e:
        return None, str(e)

def sb_patch(table, match_col, match_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}"
    req = urllib.request.Request(url, json.dumps(data).encode(), {**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    try:
        with urllib.request.urlopen(req, timeout=10):
            return True, None
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()}"

def sb_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(url, json.dumps(data).encode(), HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.read().decode()}"

def handler(event, context):
    path = event.get("rawPath", event.get("path", ""))
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return resp(400, {"error": "invalid json"})

    if path.endswith("/task-intake") and method == "POST":
        return intake(body)
    elif path.endswith("/task-run") and method == "POST":
        return run_task(body)
    elif path.endswith("/task-refresh") and method == "POST":
        return refresh()
    elif path.endswith("/task-status") and method == "GET":
        tid = event.get("queryStringParameters", {}).get("task_id")
        return status(tid)
    else:
        return resp(404, {"error": "unknown route", "path": path})

def intake(body):
    task_key = body.get("task_key") or f"snap:{uuid.uuid4()}"
    source_type = body.get("source_type", "snap")
    title = body.get("title") or body.get("page_title") or "Browser signal"
    summary = body.get("summary") or ""
    context = body.get("context") or {}
    domain = body.get("domain") or ""
    if not domain and body.get("page_url"):
        try:
            domain = body["page_url"].split("/")[2]
        except Exception:
            pass

    task_id, err = sb_rpc("synal_create_task", {
        "p_task_key": task_key,
        "p_source_type": source_type,
        "p_source_id": body.get("source_id") or task_key,
        "p_title": title,
        "p_summary": summary,
        "p_user_id": body.get("user_id"),
        "p_org_id": body.get("org_id"),
        "p_intent": body.get("intent"),
        "p_impact_area": body.get("impact_area"),
        "p_priority": body.get("priority", "medium"),
        "p_surface": body.get("surface", "browser"),
        "p_source_app": body.get("source_app", "synal-snaps"),
        "p_page_url": body.get("page_url"),
        "p_domain": domain,
        "p_page_title": body.get("page_title"),
        "p_context": context,
        "p_evidence": body.get("evidence") or {},
    })
    if err:
        return resp(500, {"error": err})

    # also log to ai_events for telemetry
    sb_insert("ai_events", {
        "user_id": body.get("user_id"),
        "org_id": body.get("org_id"),
        "surface": body.get("surface", "browser"),
        "source_app": body.get("source_app", "synal-snaps"),
        "event_type": "snap_created",
        "page_url": body.get("page_url"),
        "domain": domain,
        "title": title,
        "tab_count": context.get("tab_count"),
        "window_count": context.get("window_count"),
        "active_selection_chars": (body.get("evidence") or {}).get("selection_chars"),
        "intent": body.get("intent"),
        "impact_area": body.get("impact_area"),
        "value_score": body.get("value_score"),
        "success": True,
        "raw": body,
    })

    return resp(200, {
        "ok": True,
        "task_id": task_id,
        "task_key": task_key,
        "source_type": source_type,
    })

def run_task(body):
    task_id = body.get("task_id")
    if not task_id:
        return resp(400, {"error": "task_id required"})

    ok, err = sb_patch("synal_tasks", "id", task_id, {
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    })
    if err:
        return resp(500, {"error": err})

    # seed chain
    sb_rpc("synal_seed_chain_for_task", {"p_task_id": task_id})

    # write proof and complete
    proof, err2 = sb_rpc("synal_write_proof", {
        "p_task_id": task_id,
        "p_proof_type": "task_execution",
        "p_evidence": {
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "source": "task-run-api",
        },
    })
    if err2:
        return resp(500, {"error": err2})

    return resp(200, {"ok": True, "task_id": task_id, "proof_id": proof, "status": "completed"})

def refresh():
    result, err = sb_rpc("synal_refresh_task_state", {})
    if err:
        return resp(500, {"error": err})
    return resp(200, {"ok": True, "result": result})

def status(task_id):
    if not task_id:
        return resp(400, {"error": "task_id required"})
    url = f"{SUPABASE_URL}/rest/v1/synal_tasks?id=eq.{task_id}&select=id,status,title,completed_at"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            rows = json.loads(r.read())
            if not rows:
                return resp(404, {"error": "not found"})
            return resp(200, rows[0])
    except Exception as e:
        return resp(500, {"error": str(e)})

def resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }
