import os
import json
import requests
from typing import Any, Dict, List

MIGADU_BASE_URL = os.getenv("MIGADU_BASE_URL", "https://api.migadu.com/v1")
MIGADU_API_KEY = os.getenv("MIGADU_API_KEY", "")
TIMEOUT = int(os.getenv("MIGADU_TIMEOUT_SECONDS", "30"))

class MigaduExecutorError(Exception):
    pass


def _headers() -> Dict[str, str]:
    if not MIGADU_API_KEY:
        raise MigaduExecutorError("MIGADU_API_KEY is not set")
    return {
        "Authorization": f"Bearer {MIGADU_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _request(method: str, path: str, payload: Dict[str, Any] | None = None) -> Any:
    url = f"{MIGADU_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    response = requests.request(method=method, url=url, headers=_headers(), json=payload, timeout=TIMEOUT)
    if response.status_code >= 400:
        raise MigaduExecutorError(f"Migadu API error {response.status_code}: {response.text}")
    if not response.text:
        return {}
    return response.json()


def ensure_domain(domain: str) -> Dict[str, Any]:
    return _request("POST", "/domains", {"domain": domain})


def ensure_mailbox(email_address: str, mailbox_type: str, owner_email: str | None = None) -> Dict[str, Any]:
    payload = {
        "email_address": email_address,
        "mailbox_type": mailbox_type,
    }
    if owner_email:
        payload["owner_email"] = owner_email
    return _request("POST", "/mailboxes", payload)


def ensure_alias(alias_address: str, routes_to: str, purpose: str | None = None) -> Dict[str, Any]:
    payload = {
        "alias_address": alias_address,
        "routes_to": routes_to,
    }
    if purpose:
        payload["purpose"] = purpose
    return _request("POST", "/aliases", payload)


def build_default_resources_for_domain(domain: str) -> List[Dict[str, Any]]:
    mailboxes = ["hello", "support", "sales", "noreply", "billing", "ops"]
    aliases = [
        {"alias": "info", "routes_to": "hello", "purpose": "general inbound"},
        {"alias": "accounts", "routes_to": "billing", "purpose": "finance inbound"},
        {"alias": "admin", "routes_to": "ops", "purpose": "operations inbound"},
        {"alias": "bookings", "routes_to": "support", "purpose": "booking fallback"},
    ]
    results: List[Dict[str, Any]] = []
    results.append({"domain": domain, "result": ensure_domain(domain)})
    for mailbox in mailboxes:
        email_address = f"{mailbox}@{domain}"
        results.append({"mailbox": email_address, "result": ensure_mailbox(email_address, mailbox)})
    for alias in aliases:
        alias_address = f"{alias['alias']}@{domain}"
        routes_to = f"{alias['routes_to']}@{domain}"
        results.append({"alias": alias_address, "result": ensure_alias(alias_address, routes_to, alias['purpose'])})
    return results


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    domains = event.get("domains", [])
    if not domains:
        return {"status": "no-op", "message": "No domains supplied"}
    out: List[Dict[str, Any]] = []
    for domain in domains:
        out.append({"domain": domain, "operations": build_default_resources_for_domain(domain)})
    return {"status": "ok", "domains_processed": len(out), "results": out}
