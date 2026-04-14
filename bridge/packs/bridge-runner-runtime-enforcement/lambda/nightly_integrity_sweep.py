import json
from datetime import datetime, timezone

STALE_STATES = {"CLAIMED", "RUNNING", "RETRYING"}


def classify_job(job):
    evidence = job.get("evidence", {})
    if not evidence:
        return "PRETEND", ["missing_evidence"]
    missing = []
    for field in ["pickup_timestamp", "executor", "output_location", "writeback_location"]:
        if not evidence.get(field):
            missing.append(field)
    if missing:
        return "PARTIAL", missing
    return "REAL", []


def handler(event, context):
    jobs = event.get("jobs", [])
    results = []
    now = datetime.now(timezone.utc).isoformat()

    for job in jobs:
        classification, missing = classify_job(job)
        state = job.get("state")
        action = "none"
        if state in STALE_STATES and missing:
            action = "flag_stale"
        elif classification == "PRETEND":
            action = "downgrade_and_alert"
        elif classification == "PARTIAL":
            action = "retry_or_block"
        results.append({
            "job_id": job.get("job_id"),
            "checked_at": now,
            "state": state,
            "classification": classification,
            "missing": missing,
            "action": action,
        })

    return {"statusCode": 200, "body": json.dumps({"results": results})}
