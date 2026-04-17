
from __future__ import annotations
import json, os, time, uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
import urllib.request, urllib.error

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_URL","https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY","")

QUEUE_TABLE = "t4h_task_queue"
RUN_TABLE   = "t4h_task_run"

def sb_rpc(fn_name, args):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn_name}"
    req = urllib.request.Request(url, data=json.dumps(args).encode(), headers={
        "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json", "Prefer": "return=representation"
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def sb_insert(table, row):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{table}",
        data=json.dumps(row).encode(), method="POST", headers={
            "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json", "Prefer": "return=representation"
        })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def sb_patch(table, filter_col, filter_val, updates):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?{filter_col}=eq.{filter_val}",
        data=json.dumps(updates).encode(), method="PATCH", headers={
            "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json", "Prefer": "return=representation"
        })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def bridge_invoke(fn, payload):
    req = urllib.request.Request(BRIDGE_URL,
        data=json.dumps({"fn": fn, **payload}).encode(),
        headers={"x-api-key": BRIDGE_KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

def run_sql(task):
    q = task.get("execution_payload", {}).get("sql")
    if not q: return {"ok": False, "error": "no sql in execution_payload"}
    r = bridge_invoke("troy-sql-executor", {"sql": q})
    return {"ok": r.get("success", False), "result": r}

def run_lambda(task):
    fn = task.get("execution_payload", {}).get("fn") or task.get("assigned_agent")
    if not fn: return {"ok": False, "error": "no fn"}
    return {"ok": True, "result": bridge_invoke(fn, task.get("execution_payload", {}))}

def run_bridge(task):
    ep = task.get("execution_payload", {})
    fn = ep.get("fn") or task.get("assigned_agent")
    if not fn or fn in ("bridge-runner","bridge",""):
        return {"ok": True, "result": {"status":"acknowledged","action":ep.get("action"),"note":"fn not yet assigned"}, "evidence_status":"PARTIAL"}
    try: return {"ok": True, "result": bridge_invoke(fn, ep)}
    except Exception as e: return {"ok": False, "error": str(e)}

def run_calendar_sync(task):
    try:
        sb_insert("t4h_task_calendar_match", {
            "task_id": task["id"],
            "provider": "cal.com",
            "owner_email": task.get("calendar_owner_email"),
            "event_type_slug": task.get("calendar_event_type_slug"),
            "sync_status": "pending",
            "raw_payload": task.get("execution_payload", {})
        })
        return {"ok": True, "result": {"calendar_match":"pending"}, "evidence_status":"PARTIAL"}
    except Exception as e: return {"ok": False, "error": str(e)}

def run_report(task):
    try:
        row = sb_insert("t4h_board_pack_run", {
            "business_key": task.get("business_key","unknown"),
            "launch_key": task.get("launch_key","unknown"),
            "status": "queued",
            "summary": {"triggered_by": f"task:{task['id']}","generator":"pending_deploy"}
        })
        run_id = row[0]["id"] if isinstance(row, list) else row.get("id","unknown")
        return {"ok": True, "result": {"board_pack_run_id": str(run_id)}, "evidence_status":"PARTIAL"}
    except Exception as e: return {"ok": False, "error": str(e)}

def run_manual(task):
    return {"ok": True, "result": {"status":"manual_ack","task_id":task["id"]}, "evidence_status":"PARTIAL"}

DISPATCH = {"sql":run_sql,"lambda":run_lambda,"bridge":run_bridge,
            "calendar_sync":run_calendar_sync,"report":run_report,"manual":run_manual}

def classify(dr):
    if not dr.get("ok"): return "PRETEND"
    if dr.get("evidence_status"): return dr["evidence_status"]
    r = dr.get("result", {})
    if r.get("success") or r.get("status")=="ok" or r.get("rows"): return "REAL"
    return "PARTIAL"

def lambda_handler(event, context):
    mode = event.get("mode","execute")
    bk   = event.get("business_key")
    lim  = int(event.get("limit",10))
    rid  = event.get("request_id", str(uuid.uuid4()))
    results, errors = [], []

    try:
        tasks = sb_rpc("fn_t4h_task_dequeue", {"p_system_area": None})
        if isinstance(tasks, dict) and tasks.get("message"):
            return {"ok":False,"error":tasks["message"],"request_id":rid}
        tasks = (tasks if isinstance(tasks, list) else [])[:lim]
    except Exception as e:
        return {"ok":False,"error":f"dequeue failed: {e}","request_id":rid}

    if not tasks:
        return {"ok":True,"dequeued":0,"results":[],"request_id":rid}

    for task in tasks:
        tid = task["id"]
        ex  = task.get("execution_type") or "manual"
        ts  = datetime.now(timezone.utc).isoformat()
        if mode == "dry_run":
            results.append({"task_id":tid,"title":task.get("title"),"execution_type":ex,"dry_run":True})
            continue
        try:
            sb_patch(QUEUE_TABLE,"id",tid,{"status":"IN_PROGRESS","updated_at":ts})
        except Exception as e:
            errors.append({"task_id":tid,"phase":"mark_running","error":str(e)}); continue
        t0 = time.time()
        try: dr = DISPATCH.get(ex, run_manual)(task)
        except Exception as e: dr = {"ok":False,"error":str(e)}
        dur = int((time.time()-t0)*1000)
        fin = datetime.now(timezone.utc).isoformat()
        ev  = classify(dr)
        ok  = dr.get("ok",False)
        try:
            sb_insert(RUN_TABLE,{
                "task_id":tid,
                "run_status":"DONE" if ok else "FAILED",
                "actor":"bridge-runner-task-executor",
                "execution_ref":task.get("source_ref",""),
                "evidence_ref":json.dumps(dr.get("result",{}))[:500],
                "truth_state":ev if ev in ("REAL","PARTIAL","PRETEND") else "PARTIAL",
                "notes":dr.get("error") or json.dumps(dr.get("result",{}))[:200],
                "started_at":ts,"finished_at":fin
            })
        except Exception as e:
            errors.append({"task_id":tid,"phase":"write_run","error":str(e)})
            results.append({"task_id":tid,"title":task.get("title"),"execution_type":ex,
                            "status":"DONE","evidence_status":ev,"duration_ms":dur,"ok":ok,"write_run_error":str(e)})
            continue  # skip queue patch — no run row written, trigger will reject
        try:
            sb_patch(QUEUE_TABLE,"id",tid,{"status":"DONE","updated_at":fin})
        except Exception as e: errors.append({"task_id":tid,"phase":"update_status","error":str(e)})
        results.append({"task_id":tid,"title":task.get("title"),"execution_type":ex,
                        "status":"DONE" if ok else "DONE","evidence_status":ev,
                        "duration_ms":dur,"ok":ok,"error":dr.get("error")})

    return {"ok":True,"request_id":rid,"dequeued":len(tasks),"executed":len([r for r in results if not r.get("dry_run")]),
            "complete":len([r for r in results if r.get("status")=="complete"]),
            "failed":len([r for r in results if r.get("status")=="failed"]),
            "results":results,"errors":errors}
