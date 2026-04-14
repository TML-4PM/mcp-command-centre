"""
bridge_canon_router.py — T4H Canon Injector Lambda
action: control_plane.canon.check | .inject | .rebind | .quarantine | .nightly_audit
autonomy: AUTONOMOUS (check/inject/rebind/sync/nightly) | GATED (quarantine)
rdti: is_rd=true, project_code=CP-CANON-001
"""
import json, os, requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE"]

def sb_headers():
    return {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

def sb_select(path, params=None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=sb_headers(), params=params or {})
    r.raise_for_status(); return r.json()

def sb_insert(path, payload):
    h = {**sb_headers(), "Prefer": "return=representation"}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, json=payload)
    r.raise_for_status(); return r.json()

def sb_upsert(path, payload, on_conflict):
    h = {**sb_headers(), "Prefer": "resolution=merge-duplicates,return=representation"}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{path}?on_conflict={on_conflict}", headers=h, json=payload)
    r.raise_for_status(); return r.json()

def sb_rpc(fn, payload):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{fn}", headers=sb_headers(), json=payload)
    r.raise_for_status(); return r.json()

def get_profile(profile_key, model_family):
    rows = sb_select("control_plane.prompt_profile", {
        "profile_key": f"eq.{profile_key}", "is_active": "eq.true"
    })
    exact = [r for r in rows if r["target_model_family"] in (model_family, "all")]
    return exact[0]["content"] if exact else ""

def detect_drift(input_text):
    try:
        return sb_rpc("control_plane.detect_drift", {"input_text": input_text or ""})
    except Exception:
        # fallback local scoring
        t = (input_text or "").lower()
        score = 0
        hits = []
        if "evidence" not in t: score += 3; hits.append("missing_evidence")
        if "runtime" not in t: score += 3; hits.append("missing_runtime")
        if "registry" not in t: score += 2; hits.append("missing_registry")
        if "done" in t and "evidence" not in t: score += 4; hits.append("false_completion")
        sev = "quarantine" if score>=9 else "rebind" if score>=6 else "soft" if score>=3 else "none"
        cmd = "/canon-quarantine" if score>=9 else "/canon-rebind" if score>=6 else "/canon" if score>=3 else None
        state = "QUARANTINED" if score>=9 else "REBOUND" if score>=6 else "DRIFTING" if score>=3 else "ALIGNED"
        return {"score": score, "hits": hits, "severity": sev, "command": cmd, "alignment_state": state}

def canon_check(body):
    sk = body["session_key"]; mf = body["model_family"]
    it = body.get("input_text", "")
    meta = body.get("metadata", {})
    bk = meta.get("biz_key"); tk = meta.get("thread_key"); tt = body.get("task_type")
    now = datetime.now(timezone.utc).isoformat()
    drift = detect_drift(it)
    canon = get_profile("universal_canon", mf)
    overlay = get_profile("gpt_operator_overlay", mf) if mf == "gpt" else ""
    sb_upsert("control_plane.session_state", [{
        "session_key": sk, "model_family": mf, "biz_key": bk, "thread_key": tk,
        "task_type": tt, "alignment_state": drift["alignment_state"],
        "last_checked_at": now,
        "last_injected_at": now if drift.get("command") else None,
        "last_command": drift.get("command"), "last_drift_score": drift["score"],
        "support_state": "MONITORED"
    }], "session_key,model_family")
    if drift.get("command"):
        sb_insert("control_plane.drift_event", [{
            "session_key": sk, "model_family": mf, "biz_key": bk, "thread_key": tk,
            "trigger_type": ",".join(drift.get("hits", [])),
            "severity": drift["severity"], "drift_score": drift["score"],
            "detected_from": "canon_check_handler", "action_taken": drift["command"],
            "post_state": drift["alignment_state"], "canon_version": "1.0",
            "classification": "PARTIAL", "evidence": json.dumps(drift)
        }])
    return {"inject": bool(drift.get("command")), "command": drift.get("command"),
            "canon": canon, "overlay": overlay, "drift": drift}

def nightly_audit(body):
    summary = sb_select("control_plane.v_nightly_integrity_summary")
    hotspots = sb_select("control_plane.v_drift_hotspots")
    return {"audit_date": datetime.now(timezone.utc).date().isoformat(),
            "summary": summary[0] if summary else {}, "hotspots": hotspots[:10]}

HANDLERS = {
    "control_plane.canon.check": canon_check,
    "control_plane.canon.inject": lambda b: {"inject": True, "canon": get_profile("universal_canon", b.get("model_family","all")), "command": "/canon"},
    "control_plane.canon.rebind": lambda b: {"inject": True, "canon": get_profile("universal_canon", b.get("model_family","all")), "command": "/canon-rebind"},
    "control_plane.canon.quarantine": lambda b: {"inject": True, "canon": get_profile("universal_canon", b.get("model_family","all")), "command": "/canon-quarantine"},
    "control_plane.canon.nightly_audit": nightly_audit,
}

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}")) if isinstance(event.get("body"), str) else event
        action = body.get("action")
        handler = HANDLERS.get(action)
        if not handler:
            return {"statusCode": 400, "body": json.dumps({"error": f"Unknown action: {action}"})}
        result = handler(body)
        return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(result)}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
