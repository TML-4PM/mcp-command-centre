"""
bridge_canon_router.py v1.2 — T4H Canon Injector Lambda
Uses public.v_cp_* views (control_plane data via public schema REST)
rdti: is_rd=true, project_code=CP-CANON-001
"""
import json, os, requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE"]

def sb_h():
    return {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

def sb_get(table, params=None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=sb_h(), params=params or {})
    r.raise_for_status(); return r.json()

def sb_post(table, payload, prefer="return=representation"):
    h = {**sb_h(), "Prefer": prefer}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=h, json=payload)
    r.raise_for_status(); return r.json()

def sb_patch(table, params, payload):
    h = {**sb_h(), "Prefer": "return=representation"}
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}", headers=h, params=params, json=payload)
    r.raise_for_status(); return r.json()

def get_profile(profile_key, model_family):
    try:
        rows = sb_get("v_cp_prompt_profile", {"profile_key": f"eq.{profile_key}", "is_active": "eq.true"})
        exact = [r for r in rows if r["target_model_family"] in (model_family, "all")]
        return exact[0]["content"] if exact else (rows[0]["content"] if rows else "")
    except Exception:
        return ""

def detect_drift(input_text):
    t = (input_text or "").lower()
    score, hits = 0, []
    for word, weight, key in [("evidence",3,"missing_evidence"),("runtime",3,"missing_runtime"),("registry",2,"missing_registry"),("recovery",2,"missing_recovery")]:
        if word not in t: score += weight; hits.append(key)
    if "done" in t and "evidence" not in t: score += 4; hits.append("false_completion")
    sev = "quarantine" if score>=9 else "rebind" if score>=6 else "soft" if score>=3 else "none"
    cmd = "/canon-quarantine" if score>=9 else "/canon-rebind" if score>=6 else "/canon" if score>=3 else None
    state = "QUARANTINED" if score>=9 else "REBOUND" if score>=6 else "DRIFTING" if score>=3 else "ALIGNED"
    return {"score": score, "hits": hits, "severity": sev, "command": cmd, "alignment_state": state}

def canon_check(body):
    sk = body.get("session_key","unknown"); mf = body.get("model_family","all")
    it = body.get("input_text",""); meta = body.get("metadata",{})
    bk = meta.get("biz_key"); tk = meta.get("thread_key"); tt = body.get("task_type")
    now = datetime.now(timezone.utc).isoformat()
    drift = detect_drift(it)
    canon = get_profile("universal_canon", mf)
    overlay = get_profile("gpt_operator_overlay", mf) if mf == "gpt" else ""
    try:
        # Upsert session state via public insert (using on_conflict)
        sb_post("v_cp_session_state", [{"session_key":sk,"model_family":mf,"biz_key":bk,"thread_key":tk,
            "task_type":tt,"alignment_state":drift["alignment_state"],"last_checked_at":now,
            "last_injected_at":now if drift.get("command") else None,"last_command":drift.get("command"),
            "last_drift_score":drift["score"],"support_state":"MONITORED"}],
            "resolution=merge-duplicates,return=representation")
    except Exception:
        pass
    try:
        if drift.get("command"):
            sb_post("control_plane.drift_event", [{"session_key":sk,"model_family":mf,"biz_key":bk,
                "trigger_type":",".join(drift.get("hits",[])),"severity":drift["severity"],
                "drift_score":drift["score"],"detected_from":"canon_check_handler",
                "action_taken":drift["command"],"post_state":drift["alignment_state"],
                "canon_version":"1.0","classification":"PARTIAL","evidence":json.dumps(drift)}])
    except Exception:
        pass
    return {"inject":bool(drift.get("command")),"command":drift.get("command"),"canon":canon,"overlay":overlay,"drift":drift}

def nightly_audit(body):
    try:
        rows = sb_get("v_cp_session_state", {"select": "alignment_state"})
        from collections import Counter
        c = Counter(r["alignment_state"] for r in rows)
        return {"audit_date":datetime.now(timezone.utc).date().isoformat(),"summary":dict(c)}
    except Exception as e:
        return {"error": str(e)}

HANDLERS = {
    "control_plane.canon.check": canon_check,
    "control_plane.canon.inject": lambda b: {"inject":True,"canon":get_profile("universal_canon",b.get("model_family","all")),"command":"/canon"},
    "control_plane.canon.rebind": lambda b: {"inject":True,"canon":get_profile("universal_canon",b.get("model_family","all")),"command":"/canon-rebind"},
    "control_plane.canon.quarantine": lambda b: {"inject":True,"canon":get_profile("universal_canon",b.get("model_family","all")),"command":"/canon-quarantine"},
    "control_plane.canon.nightly_audit": nightly_audit,
}

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body","{}")) if isinstance(event.get("body"),str) else event
        action = body.get("action")
        handler = HANDLERS.get(action)
        if not handler:
            return {"statusCode":400,"body":json.dumps({"error":f"Unknown action: {action}"})}
        return {"statusCode":200,"headers":{"Content-Type":"application/json"},"body":json.dumps(handler(body))}
    except Exception as e:
        return {"statusCode":500,"body":json.dumps({"error":str(e)})}
