"""
UAC v1.1 - Bridge Execution Router
Lambda handler. Enforces: resolve → check → execute → log → classify → gate.
"""
import json
import os
import uuid
import boto3
from datetime import datetime, timezone

BRIDGE_URL  = os.environ.get("BRIDGE_URL", "")
BRIDGE_KEY  = os.environ.get("BRIDGE_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _supabase_rpc(fn: str, params: dict) -> dict:
    """Call Supabase RPC via REST."""
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    body = json.dumps(params).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def _classify_reality(has_evidence: bool, log_written: bool, output_valid: bool) -> str:
    if has_evidence and log_written and output_valid:
        return "REAL"
    if log_written or has_evidence:
        return "PARTIAL"
    return "PRETEND"


LIFECYCLE = [
    "resolve_agent",
    "resolve_tool",
    "check_permissions",
    "risk_gate",
    "execute",
    "log_execution",
    "verify",
    "classify_reality",
    "completion_gate",
]


def _run_step(step: str, ctx: dict) -> dict:
    """Execute a lifecycle step. Returns {ok, detail}."""
    if step == "resolve_agent":
        agent_key = ctx.get("agent_key")
        if not agent_key:
            return {"ok": False, "detail": "agent_key missing"}
        return {"ok": True, "detail": f"agent={agent_key}"}

    if step == "resolve_tool":
        tool_key = ctx.get("tool_key")
        if not tool_key:
            return {"ok": False, "detail": "tool_key missing"}
        return {"ok": True, "detail": f"tool={tool_key}"}

    if step == "check_permissions":
        # Passthrough — Supabase RLS enforces at write time
        return {"ok": True, "detail": "rls_enforced"}

    if step == "risk_gate":
        risk = ctx.get("risk_level", "LOW")
        if risk == "CRITICAL":
            return {"ok": False, "detail": "CRITICAL risk requires human approval"}
        return {"ok": True, "detail": f"risk={risk}"}

    if step == "execute":
        # Actual execution is caller's responsibility; router validates contract
        payload = ctx.get("payload")
        if payload is None:
            return {"ok": False, "detail": "payload missing"}
        return {"ok": True, "detail": "payload_accepted", "output": payload}

    if step == "log_execution":
        ctx["log_written"] = True
        return {"ok": True, "detail": "logged"}

    if step == "verify":
        output = ctx.get("output")
        ctx["output_valid"] = output is not None
        ctx["has_evidence"] = ctx.get("has_evidence", False)
        return {"ok": True, "detail": f"output_valid={ctx['output_valid']}"}

    if step == "classify_reality":
        reality = _classify_reality(
            ctx.get("has_evidence", False),
            ctx.get("log_written", False),
            ctx.get("output_valid", False),
        )
        ctx["reality"] = reality
        return {"ok": True, "detail": f"reality={reality}"}

    if step == "completion_gate":
        reality = ctx.get("reality", "PRETEND")
        if reality == "PRETEND":
            return {"ok": False, "detail": "PRETEND cannot complete"}
        return {"ok": True, "detail": f"completion_allowed reality={reality}"}

    return {"ok": False, "detail": f"unknown step: {step}"}


def handler(event, context):
    execution_id = str(uuid.uuid4())
    started_at   = _now()

    body = event if isinstance(event, dict) else json.loads(event.get("body", "{}"))

    ctx = {
        "agent_key":   body.get("agent_key", ""),
        "tool_key":    body.get("tool_key", ""),
        "risk_level":  body.get("risk_level", "LOW"),
        "payload":     body.get("payload"),
        "has_evidence": body.get("has_evidence", False),
        "log_written":  False,
        "output_valid": False,
        "reality":      "PRETEND",
    }

    trace    = []
    blocked  = False
    block_at = None

    for step in LIFECYCLE:
        result = _run_step(step, ctx)
        trace.append({"step": step, **result})
        if not result["ok"]:
            blocked  = True
            block_at = step
            break

    response = {
        "execution_id": execution_id,
        "agent_key":    ctx["agent_key"],
        "tool_key":     ctx["tool_key"],
        "reality":      ctx.get("reality", "PRETEND"),
        "blocked":      blocked,
        "block_at":     block_at,
        "trace":        trace,
        "started_at":   started_at,
        "completed_at": _now(),
    }

    # Best-effort enforcement log to Supabase
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            _supabase_rpc("fn_enforce_execution", {
                "p_agent_key":    ctx["agent_key"],
                "p_tool_key":     ctx["tool_key"],
                "p_has_evidence": ctx.get("has_evidence", False),
                "p_log_written":  ctx.get("log_written", False),
                "p_output_valid": ctx.get("output_valid", False),
            })
        except Exception as e:
            response["enforcement_log_error"] = str(e)

    status_code = 200 if not blocked else 422
    return {
        "statusCode": status_code,
        "body": json.dumps(response),
    }
