import re
from datetime import datetime
from typing import Dict, Any

FINANCE_REGEX = re.compile(r"invoice|bill|receipt|payment", re.IGNORECASE)
BOOKING_REGEX = re.compile(r"book|appointment|schedule", re.IGNORECASE)
SUPPORT_REGEX = re.compile(r"support|help|issue", re.IGNORECASE)
SALES_REGEX = re.compile(r"quote|proposal|partnership|sales", re.IGNORECASE)


def classify_email(subject: str, body: str) -> Dict[str, Any]:
    text = f"{subject} {body}".lower()
    if FINANCE_REGEX.search(text):
        return {"route": "billing", "automation": "FACTORS_INGEST"}
    if BOOKING_REGEX.search(text):
        return {"route": "support", "automation": "CALCOM_SYNC"}
    if SALES_REGEX.search(text):
        return {"route": "sales", "automation": "CRM_LEAD_CREATE"}
    if SUPPORT_REGEX.search(text):
        return {"route": "support", "automation": "CRM_CASE_CREATE"}
    return {"route": "hello", "automation": "MANUAL_REVIEW"}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    subject = event.get("subject", "")
    body = event.get("body", "")
    sender = event.get("from", "")
    classification = classify_email(subject, body)
    return {
        "status": "ok",
        "classification": classification,
        "sender": sender,
        "received_at": datetime.utcnow().isoformat() + "Z"
    }
