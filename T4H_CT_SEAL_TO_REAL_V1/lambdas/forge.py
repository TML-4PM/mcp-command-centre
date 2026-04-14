"""
t4h-ou-forge
Creates an Organ Unit record + gate row + initial event from a payload.
The canonical entry point for all new OU creation.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json, os, uuid, requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

def now_utc(): return datetime.now(timezone.utc).isoformat()

def sb_rpc(query):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={"apikey": SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}","Content-Type":"application/json"},
        json={"query": query}, timeout=30)
    return r.json()

def safe(v): return str(v).replace("'","''") if v else ""

def handler(event, context):
    p = event.get("payload", event)  # accept direct or wrapped payload

    ou_key   = safe(p.get("ou_key", f"OU_{uuid.uuid4().hex[:8].upper()}"))
    title    = safe(p.get("title", ou_key))
    biz_key  = safe(p.get("biz_key", "t4h.core"))
    purpose  = safe(p.get("purpose", "Pending definition"))
    owner    = safe(p.get("owner_layer", "autonomous"))
    arch_lvl = int(p.get("architecture_level", 35))
    auto_lvl = int(p.get("automation_level", 20))
    wave     = int(p.get("wave_target", 10))
    fn_name  = safe(p.get("invoke_function_name", ""))
    repo_url = safe(p.get("repo_url", ""))
    slug     = safe(p.get("command_centre_slug", ou_key.lower().replace(".","_")))
    recovery = safe(p.get("recovery_strategy", "rerun_then_repair"))
    triggers = p.get("trigger_types", ["manual_bridge"])
    trigger_arr = "{" + ",".join(triggers) + "}"
    schedule_type = safe(p.get("schedule_type", ""))
    schedule_ref  = safe(p.get("schedule_ref", ""))

    # Upsert organ_unit
    result = sb_rpc(f"""
        INSERT INTO control_tower.organ_unit
          (ou_key, title, biz_key, purpose, owner_layer,
           architecture_level, automation_level, wave_target,
           invoke_function_name, repo_url, command_centre_slug,
           trigger_types, recovery_strategy, schedule_type, schedule_ref)
        VALUES
          ('{ou_key}','{title}','{biz_key}','{purpose}','{owner}',
           {arch_lvl},{auto_lvl},{wave},
           {f"'{fn_name}'" if fn_name else "NULL"},
           {f"'{repo_url}'" if repo_url else "NULL"},
           '{slug}',
           ARRAY{trigger_arr}::text[],
           '{recovery}',
           {f"'{schedule_type}'" if schedule_type else "NULL"},
           {f"'{schedule_ref}'" if schedule_ref else "NULL"})
        ON CONFLICT (ou_key) DO UPDATE SET
          title=EXCLUDED.title, purpose=EXCLUDED.purpose,
          invoke_function_name=EXCLUDED.invoke_function_name,
          updated_at=now()
        RETURNING ou_key, truth_state, current_status
    """)
    row = (result.get("rows") or [{}])[0]

    # Ensure gate row exists
    sb_rpc(f"INSERT INTO control_tower.organ_unit_gate (ou_key) VALUES ('{ou_key}') ON CONFLICT DO NOTHING")

    # Initial event
    sb_rpc(f"""
        INSERT INTO control_tower.organ_unit_event
          (ou_key, event_type, execution_mode, truth_state_before, truth_state_after, execution_status, payload)
        VALUES ('{ou_key}','forged','forge','PRETEND','PARTIAL','created',
          '{json.dumps({"source": "t4h-ou-forge", "ts": now_utc()}).replace("'","''")}'::jsonb)
    """)

    return {"status": "forged", "ou_key": ou_key, "record": row, "ts": now_utc()}
