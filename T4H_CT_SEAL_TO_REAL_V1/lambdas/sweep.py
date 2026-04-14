"""
t4h-ou-sweep
Inspects all Organ Units, evaluates gate conditions, marks PARTIAL/degraded,
writes events. Self-healing: re-runs fn_ou_recompute_status on every OU.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json
import os
import uuid
import requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def now_utc():
    return datetime.now(timezone.utc).isoformat()


def sb_rpc(query: str) -> dict:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        json={"query": query},
        timeout=30,
    )
    return r.json()


def evaluate_gate(ou: dict) -> dict:
    """Evaluate each gate field based on observable OU properties."""
    fn_name = ou.get("invoke_function_name")
    triggers = ou.get("trigger_types") or []
    schedule = ou.get("schedule_ref")
    recovery = ou.get("recovery_strategy")
    slug = ou.get("command_centre_slug")
    last_proved = ou.get("last_proved_at")
    truth = ou.get("truth_state", "PRETEND")

    return {
        "registry_bound": bool(ou.get("ou_key")),
        "bridge_invokable": bool(fn_name),
        "trigger_defined": len(triggers) > 0,
        "telemetry_visible": bool(fn_name),
        "command_centre_visible": bool(slug),
        "dry_run_passed": bool(fn_name) and truth in ("REAL", "PARTIAL"),
        "live_run_passed": truth == "REAL",
        "proof_captured": last_proved is not None,
        "recovery_verified": bool(recovery),
        "schedule_active": bool(schedule),
    }


def safe_json(v) -> str:
    return json.dumps(v).replace("'", "''")


def handler(event, context):
    run_id = str(uuid.uuid4())

    sb_rpc(f"""
        INSERT INTO control_tower.execution_run (run_id, run_type, scope, run_status)
        VALUES ('{run_id}', 'sweep', 'all_ou', 'running')
        ON CONFLICT DO NOTHING
    """)

    result = sb_rpc("SELECT * FROM control_tower.organ_unit WHERE active = true")
    ous = result.get("rows", [])

    partial_count = 0
    real_count = 0

    for ou in ous:
        ou_key = ou["ou_key"].replace("'", "''")
        gates = evaluate_gate(ou)
        all_pass = all(gates.values())

        gate_cols = list(gates.keys())
        gate_vals = [str(v).lower() for v in gates.values()]
        insert_cols = ", ".join(gate_cols)
        insert_vals = ", ".join(gate_vals)
        update_sets = ", ".join([f"{k} = {str(v).lower()}" for k, v in gates.items()])
        update_sets += ", updated_at = now()"

        sb_rpc(f"""
            INSERT INTO control_tower.organ_unit_gate (ou_key, {insert_cols})
            VALUES ('{ou_key}', {insert_vals})
            ON CONFLICT (ou_key) DO UPDATE SET {update_sets}
        """)

        sb_rpc(f"SELECT control_tower.fn_ou_recompute_status('{ou_key}')")

        event_type = "sweep_passed" if all_pass else "sweep_partial"
        gates_safe = safe_json(gates)
        sb_rpc(f"""
            INSERT INTO control_tower.organ_unit_event
              (ou_key, event_type, execution_mode, truth_state_before, execution_status, payload)
            VALUES (
              '{ou_key}', '{event_type}', 'sweep',
              '{ou.get("truth_state","PARTIAL")}',
              '{"passed" if all_pass else "partial"}',
              '{gates_safe}'::jsonb
            )
        """)

        if all_pass:
            real_count += 1
        else:
            partial_count += 1

    summary = {"total": len(ous), "passed": real_count, "partial": partial_count}
    sb_rpc(f"""
        UPDATE control_tower.execution_run
        SET ended_at = now(), run_status = 'passed',
            summary = '{safe_json(summary)}'::jsonb
        WHERE run_id = '{run_id}'
    """)

    return {"run_id": run_id, "status": "sweep_complete", **summary, "ts": now_utc()}
