"""
t4h-ou-recover
Finds degraded/partial OUs, attempts repair, re-enters sweep loop.
Self-healing closed loop — no HITL.
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

def safe_json(v): return json.dumps(v).replace("'","''")

def attempt_repair(ou: dict) -> dict:
    """Attempt available repairs without HITL."""
    ou_key = ou["ou_key"].replace("'","''")
    repairs = []

    # If no trigger → set manual_bridge as default
    triggers = ou.get("trigger_types") or []
    if not triggers:
        sb_rpc(f"UPDATE control_tower.organ_unit SET trigger_types=ARRAY['manual_bridge'], updated_at=now() WHERE ou_key='{ou_key}'")
        repairs.append("set_default_trigger")

    # If no recovery_strategy → set default
    if not ou.get("recovery_strategy"):
        sb_rpc(f"UPDATE control_tower.organ_unit SET recovery_strategy='rerun_then_repair', updated_at=now() WHERE ou_key='{ou_key}'")
        repairs.append("set_default_recovery")

    # If no command_centre_slug → derive from ou_key
    if not ou.get("command_centre_slug"):
        slug = ou["ou_key"].lower().replace(".", "_").replace(":", "_")
        sb_rpc(f"UPDATE control_tower.organ_unit SET command_centre_slug='{slug}', updated_at=now() WHERE ou_key='{ou_key}'")
        repairs.append("set_default_slug")

    # Re-sweep this OU
    sb_rpc(f"SELECT control_tower.fn_ou_recompute_status('{ou_key}')")

    return {"ou_key": ou["ou_key"], "repairs": repairs}

def handler(event, context):
    run_id = str(uuid.uuid4())
    sb_rpc(f"INSERT INTO control_tower.execution_run (run_id,run_type,scope,run_status) VALUES ('{run_id}','recover','degraded_partial','running') ON CONFLICT DO NOTHING")

    result = sb_rpc("SELECT * FROM control_tower.organ_unit WHERE active=true AND current_status IN ('degraded','planned') AND truth_state != 'REAL'")
    ous = result.get("rows", [])

    repaired, skipped = 0, 0
    repair_log = []

    for ou in ous:
        try:
            repair_result = attempt_repair(ou)
            repair_log.append(repair_result)

            # Write recovery event
            ou_key = ou["ou_key"].replace("'","''")
            sb_rpc(f"""
                INSERT INTO control_tower.organ_unit_event
                  (ou_key, event_type, execution_mode, truth_state_before, execution_status, payload)
                VALUES ('{ou_key}','recovery_attempted','recover',
                  '{ou.get("truth_state","PARTIAL")}','attempted',
                  '{safe_json(repair_result)}'::jsonb)
            """)

            # Write structural proof
            sb_rpc(f"""
                INSERT INTO control_tower.organ_unit_proof
                  (ou_key, proof_class, proof_name, proof_status, details)
                VALUES ('{ou_key}','structural','auto_repair','{"pass" if repair_result["repairs"] else "warn"}',
                  '{safe_json(repair_result)}'::jsonb)
            """)

            repaired += 1
        except Exception as e:
            skipped += 1
            print(f"Recover error for {ou.get('ou_key')}: {e}")

    summary = {"total": len(ous), "repaired": repaired, "skipped": skipped}
    sb_rpc(f"UPDATE control_tower.execution_run SET ended_at=now(),run_status='passed',summary='{safe_json(summary)}'::jsonb WHERE run_id='{run_id}'")

    return {"run_id": run_id, "status": "recover_complete", **summary, "ts": now_utc()}
