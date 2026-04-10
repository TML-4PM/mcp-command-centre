"""t4h_autofix_health_refresh.py — executes HEALTH_DOWN autofixes: re-checks and updates Supabase."""
import json, uuid, urllib.request
from shared_events import sb_request, put_event, now_iso

def lambda_handler(event, context):
    detail = event.get("detail", {})
    site_id = detail.get("site_id")
    slug    = detail.get("slug")
    # Fetch site
    rows = sb_request("GET", f"ops_site_registry?id=eq.{site_id}&select=*")
    if not rows: return {"error": "site not found", "site_id": site_id}
    site = rows[0]
    # Re-probe
    url = site.get("canonical_url") or site.get("vercel_url")
    health = "UNKNOWN"
    if url:
        try:
            req = urllib.request.Request(url, method="HEAD")
            req.add_header("User-Agent", "t4h-autofix/1.0")
            with urllib.request.urlopen(req, timeout=10) as r:
                health = "UP" if r.status < 400 else "DOWN"
        except Exception:
            health = "DOWN"
    sb_request("PATCH", f"ops_site_registry?id=eq.{site_id}",
               {"health_status": health, "last_checked": now_iso()})
    log = {
        "id": str(uuid.uuid4()), "site_id": site_id, "slug": slug,
        "violation_code": "HEALTH_DOWN", "requested_fix": "health_refresh",
        "action_status": "COMPLETE" if health == "UP" else "FAILED",
        "dry_run": False, "result_message": f"health re-checked: {health}",
        "event_id": context.aws_request_id, "created_at": now_iso()
    }
    sb_request("POST", "ops_site_autofix_log", log)
    if health == "UP":
        put_event("SiteAutofixCompleted", {"site_id": site_id, "slug": slug, "result": "RESOLVED"})
    return {"slug": slug, "health": health, "status": log["action_status"]}
