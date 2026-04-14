import json
import os
import boto3
import datetime
import hashlib


REQUIRED_REPO = "TML-4PM/mcp-command-centre"
REQUIRED_BRANCH = "main"
REQUIRED_TARGET_MODE = "github_repo_only"
EXECUTION_LOG_TABLE = "bridge_runner_execution_log"


def validate_guard(payload: dict) -> dict:
    """Enforce RUNTIME_GUARD.json policy at invocation time."""
    errors = []

    repo = payload.get("repository_full_name") or payload.get("metadata", {}).get("provenance", {}).get("repo", "")
    branch = payload.get("branch") or payload.get("metadata", {}).get("provenance", {}).get("branch", "")
    target_mode = payload.get("target_mode") or payload.get("execution_contract", {}).get("target", "")

    # Normalise
    if repo == REQUIRED_REPO and (not branch or not target_mode):
        # ACTIVE_PAYLOAD format - passes guard if repo pin is correct
        pass
    else:
        if repo and repo != REQUIRED_REPO:
            errors.append(f"repo_mismatch: expected {REQUIRED_REPO} got {repo}")
        if branch and branch != REQUIRED_BRANCH:
            errors.append(f"branch_mismatch: expected {REQUIRED_BRANCH} got {branch}")

    if errors:
        return {"allowed": False, "errors": errors}
    return {"allowed": True, "errors": []}


def validate_job(event: dict) -> dict:
    """Original job validation logic."""
    job = event.get("job", {})
    evidence = event.get("evidence", {})

    required_job_fields = ["job_id", "action", "function_name"]
    for f in required_job_fields:
        if f not in job:
            return {"classification": "PRETEND", "reason": f"missing {f}"}

    if not evidence:
        return {"classification": "PRETEND", "reason": "no evidence"}

    if not evidence.get("output_location") or not evidence.get("writeback_location"):
        return {"classification": "PARTIAL", "reason": "missing output/writeback"}

    return {"classification": "REAL"}


def emit_execution_log(payload_path: str, status: str, files_touched: list, error: str = None) -> None:
    """Write execution record via Supabase REST (best-effort, non-blocking)."""
    try:
        import urllib.request
        supabase_url = os.environ.get("SUPABASE_URL", "https://lzfgigiyqpuuxslsygjp.supabase.co")
        service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        if not service_key:
            return

        execution_hash = hashlib.sha256(
            f"{payload_path}:{status}:{datetime.datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        record = {
            "payload_path": payload_path,
            "repository": REQUIRED_REPO,
            "branch": REQUIRED_BRANCH,
            "status": status,
            "files_touched": json.dumps(files_touched),
            "execution_hash": execution_hash,
            "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z"
        }

        req = urllib.request.Request(
            f"{supabase_url}/rest/v1/{EXECUTION_LOG_TABLE}",
            data=json.dumps(record).encode(),
            headers={
                "Content-Type": "application/json",
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Prefer": "return=minimal"
            },
            method="POST"
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass  # Non-blocking - never fail the main path


def handler(event, context):
    payload_path = event.get(
        "payload_path",
        "bridge_runner/control_tower_eventbridge_autofix/ACTIVE_PAYLOAD.json"
    )

    # Guard check first
    guard_result = validate_guard(event)
    if not guard_result["allowed"]:
        emit_execution_log(payload_path, "failed", [], str(guard_result["errors"]))
        return {
            "statusCode": 403,
            "body": json.dumps({
                "classification": "BLOCKED",
                "reason": "RUNTIME_GUARD rejected payload",
                "errors": guard_result["errors"]
            })
        }

    # Job validation
    job_result = validate_job(event)

    status = "success" if job_result["classification"] == "REAL" else "failed"
    emit_execution_log(payload_path, status, event.get("files_touched", []))

    return {
        "statusCode": 200,
        "body": json.dumps({
            "guard": "PASSED",
            "classification": job_result["classification"],
            "reason": job_result.get("reason", ""),
            "repo_pin": REQUIRED_REPO,
            "branch": REQUIRED_BRANCH
        })
    }

