"""
t4h-ou-prove
Runs dry_run then live_run against each PARTIAL/REAL OU via bridge,
captures proof rows, updates truth_state to REAL on success.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json, os, uuid, requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_URL", "https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")

def now_utc(): return datetime.now(timezone.utc).isoformat()

def sb_rpc(query):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={"apikey": SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}","Content-Type":"application/json"},
        json={"query": query}, timeout=30)
    return r.json()

def invoke_bridge(fn_name, ou_key, mode):
    payload = {
        "fn": fn_name,
        "payload": {
            "ou_key": ou_key, "mode": mode,
            "operation": "execute", "inputs": {},
            "options": {"force": False, "repair_missing_bindings": False},
        },
        "metadata": {
            "request_id": str(uuid.uuid4()), "source": "t4h-ou-prove",
            "timestamp_utc": now_utc(), "auth_context": "system",
        }
    }
    try:
        r = requests.post(BRIDGE_URL,
            headers={"x-api-key": BRIDGE_KEY, "Content-Type": "application/json"},
            json=payload, timeout=30)
        return {"success": r.status_code < 400, "status_code": r.status_code, "body": r.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}

def safe_json(v): return json.dumps(v).replace("'","''")

def write_proof(ou_key, proof_class, proof_name, proof_status, evidence_ref, details):
    safe_key = ou_key.replace("'","''")
    safe_name = proof_name.replace("'","''")
    safe_ref = (evidence_ref or "").replace("'","''")
    sb_rpc(f"""
        INSERT INTO control_tower.organ_unit_proof
          (ou_key, proof_class, proof_name, proof_status, evidence_ref, details)
        VALUES ('{safe_key}','{proof_class}','{safe_name}','{proof_status}','{safe_ref}','{safe_json(details)}'::jsonb)
    """)

def handler(event, context):
    run_id = str(uuid.uuid4())
    sb_rpc(f"INSERT INTO control_tower.execution_run (run_id,run_type,scope,run_status) VALUES ('{run_id}','prove','partial_and_real','running') ON CONFLICT DO NOTHING")

    result = sb_rpc("SELECT ou_key, invoke_function_name, truth_state FROM control_tower.organ_unit WHERE active=true AND truth_state IN ('PARTIAL','REAL') AND invoke_function_name IS NOT NULL")
    ous = result.get("rows", [])

    proved, failed = 0, 0

    for ou in ous:
        ou_key = ou["ou_key"]
        fn = ou["invoke_function_name"]

        dry = invoke_bridge(fn, ou_key, "dry_run")
        write_proof(ou_key, "runtime", "dry_run", "pass" if dry["success"] else "fail", dry.get("body",{}).get("request_id",""), dry)

        if dry["success"]:
            live = invoke_bridge(fn, ou_key, "execute")
            write_proof(ou_key, "runtime", "live_run", "pass" if live["success"] else "fail", live.get("body",{}).get("request_id",""), live)

            if live["success"]:
                safe_key = ou_key.replace("'","''")
                sb_rpc(f"UPDATE control_tower.organ_unit SET truth_state='REAL', last_proved_at=now(), last_executed_at=now(), updated_at=now() WHERE ou_key='{safe_key}'")
                sb_rpc(f"UPDATE control_tower.organ_unit_gate SET live_run_passed=true, dry_run_passed=true, proof_captured=true, updated_at=now() WHERE ou_key='{safe_key}'")
                sb_rpc(f"SELECT control_tower.fn_ou_recompute_status('{safe_key}')")
                proved += 1
            else:
                failed += 1
        else:
            failed += 1

    summary = {"total": len(ous), "proved": proved, "failed": failed}
    sb_rpc(f"UPDATE control_tower.execution_run SET ended_at=now(),run_status='passed',summary='{safe_json(summary)}'::jsonb WHERE run_id='{run_id}'")
    return {"run_id": run_id, "status": "prove_complete", **summary, "ts": now_utc()}
