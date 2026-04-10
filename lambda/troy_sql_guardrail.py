import json
import re
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

ALLOWED_FUNCTIONS = {
    "troy-sql-executor-s2",
    "troy-sql-runner",
    "troy-sql-executor-fix",
    "troy-sql-executor",
}

DESTRUCTIVE_SQL = re.compile(r"\b(drop|truncate)\b|\bdelete\b(?!\s+from\s+[\w\.]+\s+where\b)", re.IGNORECASE)
ISO_8601 = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$")


def _response(status: str, request_id: str, **extra: Any) -> Dict[str, Any]:
    body = {"status": status, "request_id": request_id}
    body.update(extra)
    return body


def _sql_hash(sql: str) -> str:
    return hashlib.sha256(sql.encode("utf-8")).hexdigest()


def _validate(event: Dict[str, Any]) -> Tuple[List[str], List[Dict[str, str]], Dict[str, Any], Dict[str, Any]]:
    checks_passed: List[str] = []
    errors: List[Dict[str, str]] = []
    payload = event.get("payload") or {}
    metadata = event.get("metadata") or {}

    if event.get("action") == "invoke_function":
        checks_passed.append("action")
    else:
        errors.append({"reason_code": "INVALID_ACTION", "message": "action must equal invoke_function"})

    function_name = event.get("function_name")
    if function_name in ALLOWED_FUNCTIONS:
        checks_passed.append("function_name")
    else:
        errors.append({"reason_code": "INVALID_FUNCTION", "message": "function_name is not an approved SQL executor"})

    sql = payload.get("sql")
    if isinstance(sql, str) and sql.strip():
        if sql.rstrip().endswith(";"):
            errors.append({"reason_code": "TRAILING_SEMICOLON", "message": "sql must not end with a trailing semicolon"})
        else:
            checks_passed.append("sql")
    else:
        errors.append({"reason_code": "MISSING_SQL", "message": "payload.sql is required"})

    params = payload.get("params")
    if isinstance(params, list):
        checks_passed.append("params")
    else:
        errors.append({"reason_code": "INVALID_PARAMS", "message": "payload.params must be an array"})

    request_id = payload.get("request_id")
    source = payload.get("source")
    timestamp_utc = payload.get("timestamp_utc")
    if request_id and metadata.get("request_id") == request_id:
        checks_passed.append("request_id")
    else:
        errors.append({"reason_code": "MISMATCH_REQUEST_ID", "message": "payload.request_id must match metadata.request_id"})

    if source and metadata.get("source") == source:
        checks_passed.append("source")
    else:
        errors.append({"reason_code": "MISMATCH_SOURCE", "message": "payload.source must match metadata.source"})

    if isinstance(timestamp_utc, str) and ISO_8601.match(timestamp_utc) and metadata.get("timestamp_utc") == timestamp_utc:
        checks_passed.append("timestamp_utc")
    else:
        errors.append({"reason_code": "INVALID_TIMESTAMP", "message": "payload.timestamp_utc must be valid ISO8601 UTC and match metadata.timestamp_utc"})

    if metadata.get("auth_context"):
        checks_passed.append("auth_context")
    else:
        errors.append({"reason_code": "MISSING_AUTH_CONTEXT", "message": "metadata.auth_context is required"})

    if payload.get("mode") == "execute":
        checks_passed.append("mode")
    else:
        errors.append({"reason_code": "INVALID_MODE", "message": "payload.mode must equal execute"})

    if isinstance(payload.get("dry_run"), bool):
        checks_passed.append("dry_run")
    else:
        errors.append({"reason_code": "MISSING_DRY_RUN", "message": "payload.dry_run must exist explicitly"})

    if isinstance(payload.get("approval_required"), bool):
        checks_passed.append("approval_required")
    else:
        errors.append({"reason_code": "MISSING_APPROVAL_REQUIRED", "message": "payload.approval_required must exist explicitly"})

    if isinstance(sql, str) and sql.strip() and payload.get("approval_required") is False and DESTRUCTIVE_SQL.search(sql):
        errors.append({"reason_code": "DESTRUCTIVE_SQL_BLOCKED", "message": "destructive SQL requires approval_required=true"})
    elif isinstance(sql, str) and sql.strip():
        checks_passed.append("sql_safety")

    return checks_passed, errors, payload, metadata


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    checks_passed, errors, payload, metadata = _validate(event)
    request_id = (payload or {}).get("request_id") or (metadata or {}).get("request_id") or "unknown"
    sql = (payload or {}).get("sql", "")
    base_audit = {
        "request_id": request_id,
        "source": (payload or {}).get("source"),
        "function_name": event.get("function_name"),
        "sql_hash": _sql_hash(sql) if isinstance(sql, str) and sql else None,
        "timestamp_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    if errors:
        return _response(
            "rejected",
            request_id,
            reason_code=errors[0]["reason_code"],
            message=errors[0]["message"],
            checks_passed=checks_passed,
            errors=errors,
            reality_classification="PRETEND",
            audit={**base_audit, "approval_decision": "rejected", "reality_classification": "PRETEND"},
        )

    return _response(
        "approved",
        request_id,
        forward_to=event.get("function_name"),
        checks_passed=checks_passed,
        reality_classification="REAL",
        audit={**base_audit, "approval_decision": "approved", "reality_classification": "REAL"},
        forwarded_event=event,
    )
