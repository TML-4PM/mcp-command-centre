from datetime import datetime
from typing import Any, Dict, List

REQUIRED_MAILBOXES = {"hello", "support", "sales", "noreply", "billing", "ops"}
REQUIRED_ALIASES = {"info", "accounts", "admin", "bookings"}


def detect_drift(domain_snapshot: Dict[str, Any]) -> Dict[str, Any]:
    domain = domain_snapshot.get("domain", "unknown")
    existing_mailboxes = set(domain_snapshot.get("mailboxes", []))
    existing_aliases = set(domain_snapshot.get("aliases", []))
    dns = domain_snapshot.get("dns", {}) or {}

    missing_mailboxes = sorted(list(REQUIRED_MAILBOXES - existing_mailboxes))
    missing_aliases = sorted(list(REQUIRED_ALIASES - existing_aliases))
    dns_failures: List[str] = []
    for key in ["mx", "spf", "dkim", "dmarc"]:
        if not dns.get(key):
            dns_failures.append(key)

    status = "PASS"
    if missing_mailboxes or missing_aliases or dns_failures:
        status = "FAIL"

    return {
        "domain": domain,
        "status": status,
        "missing_mailboxes": missing_mailboxes,
        "missing_aliases": missing_aliases,
        "dns_failures": dns_failures,
        "checked_at": datetime.utcnow().isoformat() + "Z"
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    snapshots = event.get("snapshots", [])
    results = [detect_drift(snapshot) for snapshot in snapshots]
    return {
        "status": "ok",
        "domains_checked": len(results),
        "results": results
    }
