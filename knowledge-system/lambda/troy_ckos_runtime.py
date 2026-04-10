import os
import json
from typing import Any, Dict, List, Optional

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
DEFAULT_ENFORCEMENT_MODE = os.environ.get("CKOS_ENFORCEMENT_MODE", "STRICT_CRITICAL")
SQL_EXECUTOR_FUNCTION = os.environ.get("CKOS_SQL_EXECUTOR_FUNCTION", "troy-sql-executor")
BRIDGE_INVOKE_URL = os.environ.get("BRIDGE_INVOKE_URL", "")
BRIDGE_API_KEY = os.environ.get("T4H_BRIDGE_API_KEY", "")


class CKOSError(Exception):
    pass


def _supabase_headers() -> Dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise CKOSError("Missing Supabase runtime environment variables")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _select_knowledge(lookup_key: str) -> Optional[Dict[str, Any]]:
    url = (
        f"{SUPABASE_URL}/rest/v1/ckos_knowledge"
        f"?lookup_key=eq.{lookup_key}&select=*"
    )
    r = requests.get(url, headers=_supabase_headers(), timeout=20)
    r.raise_for_status()
    rows = r.json()
    return rows[0] if rows else None


def _select_alias(alias: str) -> Optional[str]:
    url = (
        f"{SUPABASE_URL}/rest/v1/ckos_aliases"
        f"?alias=eq.{alias}&select=lookup_key"
    )
    r = requests.get(url, headers=_supabase_headers(), timeout=20)
    r.raise_for_status()
    rows = r.json()
    return rows[0]["lookup_key"] if rows else None


def _insert_gap(lookup_key: str, context: str) -> None:
    existing_url = (
        f"{SUPABASE_URL}/rest/v1/ckos_gaps"
        f"?lookup_key=eq.{lookup_key}&select=id,count"
    )
    r = requests.get(existing_url, headers=_supabase_headers(), timeout=20)
    r.raise_for_status()
    rows = r.json()

    if rows:
        gap_id = rows[0]["id"]
        count = int(rows[0].get("count", 1)) + 1
        patch_url = f"{SUPABASE_URL}/rest/v1/ckos_gaps?id=eq.{gap_id}"
        requests.patch(
            patch_url,
            headers=_supabase_headers(),
            json={"count": count, "context": context},
            timeout=20,
        ).raise_for_status()
        return

    url = f"{SUPABASE_URL}/rest/v1/ckos_gaps"
    requests.post(
        url,
        headers=_supabase_headers(),
        json={
            "lookup_key": lookup_key,
            "context": context,
            "status": "OPEN",
        },
        timeout=20,
    ).raise_for_status()


def _insert_usage(lookup_key: str, used_by: str, outcome: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/ckos_usage"
    requests.post(
        url,
        headers=_supabase_headers(),
        json={
            "lookup_key": lookup_key,
            "used_by": used_by,
            "usage_count": 1,
            "outcome": outcome,
        },
        timeout=20,
    ).raise_for_status()


def _safe_for_automation(row: Dict[str, Any]) -> bool:
    return (
        row.get("stage") in {"STANDARD", "CRITICAL"}
        and row.get("confidence") in {"High", "Proven"}
        and bool(row.get("automation_eligible"))
    )


def resolve_lookup_key(raw_key: str) -> Dict[str, Any]:
    row = _select_knowledge(raw_key)
    if row:
        return {"status": "OK", "lookup_key": raw_key, "row": row, "via": "direct"}

    alias_lookup = _select_alias(raw_key)
    if alias_lookup:
        aliased = _select_knowledge(alias_lookup)
        if aliased:
            return {"status": "OK", "lookup_key": alias_lookup, "row": aliased, "via": "alias"}

    return {"status": "NOT_FOUND", "lookup_key": raw_key}


def guard(required_keys: List[str], used_by: str, mode: str = DEFAULT_ENFORCEMENT_MODE) -> Dict[str, Any]:
    resolved = []
    missing = []
    unsafe = []

    for key in required_keys:
        result = resolve_lookup_key(key)
        if result["status"] != "OK":
            _insert_gap(key, f"Missing during {used_by}")
            missing.append(key)
            continue

        row = result["row"]
        resolved.append(
            {
                "requested_key": key,
                "lookup_key": result["lookup_key"],
                "value": row.get("canonical_value"),
                "stage": row.get("stage"),
                "confidence": row.get("confidence"),
            }
        )

        if mode == "STRICT_ALL" and not _safe_for_automation(row):
            unsafe.append(key)
        elif mode == "STRICT_CRITICAL" and row.get("stage") == "CRITICAL" and not _safe_for_automation(row):
            unsafe.append(key)

        _insert_usage(result["lookup_key"], used_by, "resolved")

    status = "OK"
    if missing or unsafe:
        status = "WARN" if mode == "WARN" else "BLOCKED"

    return {
        "status": status,
        "resolved": resolved,
        "missing": missing,
        "unsafe": unsafe,
        "mode": mode,
    }


def invoke_bridge_function(function_name: str, payload: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not BRIDGE_INVOKE_URL or not BRIDGE_API_KEY:
        raise CKOSError("Missing bridge runtime environment variables")

    body = {
        "action": "invoke_function",
        "function_name": function_name,
        "invocation_type": "RequestResponse",
        "payload": payload,
        "metadata": metadata or {},
    }

    r = requests.post(
        BRIDGE_INVOKE_URL,
        headers={
            "Content-Type": "application/json",
            "x-api-key": BRIDGE_API_KEY,
        },
        json=body,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    action = event.get("action", "guarded_execute")

    if action == "resolve":
        return resolve_lookup_key(event["lookup_key"])

    if action == "guard":
        return guard(
            required_keys=event.get("required_keys", []),
            used_by=event.get("used_by", "unknown"),
            mode=event.get("mode", DEFAULT_ENFORCEMENT_MODE),
        )

    if action == "guarded_execute":
        required_keys = event.get("required_keys", [])
        used_by = event.get("used_by", "unknown")
        mode = event.get("mode", DEFAULT_ENFORCEMENT_MODE)
        target_function = event.get("target_function", SQL_EXECUTOR_FUNCTION)
        target_payload = event.get("target_payload", {})
        metadata = event.get("metadata", {})

        check = guard(required_keys=required_keys, used_by=used_by, mode=mode)
        if check["status"] == "BLOCKED":
            return check

        resolved_values = {item["requested_key"]: item["value"] for item in check["resolved"]}
        target_payload["_ckos"] = resolved_values
        execution = invoke_bridge_function(target_function, target_payload, metadata)
        return {"status": check["status"], "guard": check, "execution": execution}

    raise CKOSError(f"Unsupported action: {action}")
