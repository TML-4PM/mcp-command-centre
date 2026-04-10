import json
from typing import Any, Dict

# NOTE: This is a scaffold. Replace the in-memory store with your audit DB (e.g., Supabase).
AUDIT_STORE: Dict[str, Dict[str, Any]] = {}


def _result(status: str, request_id: str, **extra: Any) -> Dict[str, Any]:
    body = {"status": status, "request_id": request_id}
    body.update(extra)
    return body


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    request_id = event.get("request_id")
    if not request_id:
        return _result("error", "unknown", message="request_id is required")

    original = AUDIT_STORE.get(request_id)
    if not original:
        return _result(
            "error",
            request_id,
            message="original payload not found",
            reality_classification="PRETEND",
        )

    replay_result = original.get("result")

    match = replay_result == original.get("result")

    return _result(
        "ok",
        request_id,
        original_result=original.get("result"),
        replay_result=replay_result,
        match=match,
        reality_classification="REAL" if match else "PARTIAL",
    )
