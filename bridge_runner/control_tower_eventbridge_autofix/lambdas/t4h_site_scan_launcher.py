"""t4h_site_scan_launcher.py — hourly cron: health-check all sites, emit violations to EventBridge."""
import json, os, urllib.request, urllib.error
from shared_events import sb_request, put_event, now_iso

def lambda_handler(event, context):
    sites = sb_request("GET", "ops_site_registry?select=id,slug,canonical_url,vercel_url,github_repo,health_status,reality_status&status=eq.LIVE")
    violations = []
    for site in (sites or []):
        slug = site.get("slug","?")
        # Health check canonical URL
        health = "UNKNOWN"
        url = site.get("canonical_url") or site.get("vercel_url")
        if url:
            try:
                req = urllib.request.Request(url, method="HEAD")
                req.add_header("User-Agent", "t4h-control-tower/1.0")
                with urllib.request.urlopen(req, timeout=10) as r:
                    health = "UP" if r.status < 400 else "DOWN"
            except Exception as e:
                health = "DOWN"
        # Update health in Supabase
        sb_request("PATCH", f"ops_site_registry?id=eq.{site['id']}",
                   {"health_status": health, "last_checked": now_iso()})
        # Emit violation event if needed
        codes = []
        if not site.get("github_repo"): codes.append("NO_GITHUB")
        if not site.get("canonical_url"): codes.append("NO_PUBLIC")
        if not site.get("vercel_url"): codes.append("NO_DEPLOY")
        if health in ("DOWN","DEGRADED"): codes.append(f"HEALTH_{health}")
        for code in codes:
            put_event("SiteViolationDetected", {"site_id": site["id"], "slug": slug, "violation_code": code})
            violations.append({"slug": slug, "code": code})
    return {"scanned": len(sites or []), "violations": len(violations), "detail": violations}
