import json
from typing import Dict, Any

FALLBACK_ORDER = [
    "troy-sql-executor-s2",
    "troy-sql-runner",
    "troy-sql-executor-fix",
    "troy-sql-executor",
]


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    original_target = event.get("function_name")
    failure_reason = event.get("failure_reason", "unknown")

    try:
        idx = FALLBACK_ORDER.index(original_target)
    except ValueError:
        idx = 0

    if idx + 1 >= len(FALLBACK_ORDER):
        return {
            "status": "failed",
            "message": "no further fallback available",
            "original_target": original_target,
            "failure_reason": failure_reason
        }

    next_target = FALLBACK_ORDER[idx + 1]

    return {
        "status": "fallback",
        "original_target": original_target,
        "next_target": next_target,
        "fallback_reason": failure_reason
    }
