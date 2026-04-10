"""t4h_autofix_router.py — EventBridge target: routes SiteViolationDetected to fix queue."""
import json, uuid
from shared_events import sb_request, now_iso

AUTOFIXABLE = {"HEALTH_DOWN", "HEALTH_DEGRADED", "REALITY_DRIFT"}

def lambda_handler(event, context):
    detail = event.get("detail", {})
    site_id      = detail.get("site_id")
    slug         = detail.get("slug")
    violation    = detail.get("violation_code")
    autofixable  = violation in AUTOFIXABLE
    record = {
        "id":           str(uuid.uuid4()),
        "site_id":      site_id,
        "slug":         slug,
        "action_type":  f"AUTOFIX_{violation}",
        "severity":     "HIGH" if violation in ("HEALTH_DOWN",) else "MEDIUM",
        "title":        f"Auto-fix: {violation} on {slug}",
        "detail":       json.dumps(detail),
        "status":       "OPEN",
        "autofixable":  autofixable,
        "source_event_id": context.aws_request_id,
        "created_at":   now_iso()
    }
    sb_request("POST", "ops_site_action_queue", record)
    return {"queued": 1, "slug": slug, "violation": violation, "autofixable": autofixable}
