import json
import os
import uuid
from datetime import datetime, timezone

try:
    from supabase import create_client
except Exception:
    create_client = None

AGENT_ORDER = ["gpt", "claude", "perplexity", "grok"]


def _utc_now():
    return datetime.now(timezone.utc).isoformat()


def _supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key or create_client is None:
        return None
    return create_client(url, key)


def _insert(client, table, payload):
    if client is None:
        return None
    try:
        return client.table(table).insert(payload).execute()
    except Exception:
        return None


def _agent_visit(task_text, run_id, agent):
    return {
        "id": str(uuid.uuid4()),
        "run_id": run_id,
        "agent": agent,
        "status": "completed",
        "summary": f"{agent} reviewed task: {task_text[:180]}",
        "output": {
            "agent": agent,
            "task": task_text,
            "result": f"Simulated {agent} pass for initial bridge execution"
        },
        "created_at": _utc_now()
    }


def handler(event, context):
    client = _supabase()
    task_text = (event or {}).get("task") or (event or {}).get("task_key") or "core5 task"
    run_id = str(uuid.uuid4())
    task_id = str(uuid.uuid4())
    created_at = _utc_now()

    _insert(client, "core5_tasks", {
        "id": task_id,
        "title": str(task_text),
        "status": "RUNNING",
        "created_at": created_at
    })

    _insert(client, "core5_runs", {
        "id": run_id,
        "task_id": task_id,
        "status": "RUNNING",
        "iteration_count": len(AGENT_ORDER),
        "created_at": created_at
    })

    visits = []
    for agent in AGENT_ORDER:
        visit = _agent_visit(str(task_text), run_id, agent)
        visits.append(visit)
        _insert(client, "core5_agent_visits", visit)

    final_output = {
        "id": str(uuid.uuid4()),
        "run_id": run_id,
        "content": {
            "task": task_text,
            "custodian_status": "READY_FOR_STAGE_GATE",
            "visits": [v["agent"] for v in visits]
        },
        "is_final": True,
        "created_at": _utc_now()
    }
    _insert(client, "core5_outputs", final_output)

    _insert(client, "core5_stage_gates", {
        "id": str(uuid.uuid4()),
        "run_id": run_id,
        "gate": "G4_pre_final",
        "status": "OPEN",
        "created_at": _utc_now()
    })

    if client is not None:
        try:
            client.table("core5_runs").update({"status": "WAITING_STAGE_GATE"}).eq("id", run_id).execute()
            client.table("core5_tasks").update({"status": "WAITING_STAGE_GATE"}).eq("id", task_id).execute()
        except Exception:
            pass

    return {
        "ok": True,
        "task_id": task_id,
        "run_id": run_id,
        "status": "WAITING_STAGE_GATE",
        "agents": AGENT_ORDER,
        "timestamp_utc": _utc_now()
    }
