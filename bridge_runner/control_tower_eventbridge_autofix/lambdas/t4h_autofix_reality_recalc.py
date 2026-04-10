"""t4h_autofix_reality_recalc.py — executes REALITY_DRIFT autofixes: forces reality recalc in DB."""
import json, uuid
from shared_events import sb_request, put_event, now_iso

def lambda_handler(event, context):
    detail  = event.get("detail", {})
    site_id = detail.get("site_id")
    slug    = detail.get("slug")
    # Touch the row — trigger recomputes reality_status
    sb_request("PATCH", f"ops_site_registry?id=eq.{site_id}", {"updated_at": now_iso()})
    rows = sb_request("GET", f"ops_site_registry?id=eq.{site_id}&select=reality_status")
    new_status = (rows or [{}])[0].get("reality_status", "UNKNOWN")
    log = {
        "id": str(uuid.uuid4()), "site_id": site_id, "slug": slug,
        "violation_code": "REALITY_DRIFT", "requested_fix": "reality_recalc",
        "action_status": "COMPLETE", "dry_run": False,
        "result_message": f"reality recomputed to {new_status}",
        "event_id": context.aws_request_id, "created_at": now_iso()
    }
    sb_request("POST", "ops_site_autofix_log", log)
    put_event("SiteAutofixCompleted", {"site_id": site_id, "slug": slug, "result": new_status})
    return {"slug": slug, "reality_status": new_status}
