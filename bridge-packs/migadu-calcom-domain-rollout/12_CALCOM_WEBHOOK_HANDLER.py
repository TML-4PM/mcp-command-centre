import os
import json
from datetime import datetime
from typing import Any, Dict

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def classify_booking(payload: Dict[str, Any]) -> Dict[str, Any]:
    event_type = (payload.get("triggerEvent") or payload.get("event") or "").lower()
    booking = payload.get("payload", {}) if isinstance(payload.get("payload"), dict) else payload
    route = "support"
    finance_required = False
    if "paid" in json.dumps(booking).lower():
        finance_required = True
    title = str(booking.get("title") or booking.get("eventType") or "")
    if any(x in title.lower() for x in ["consult", "discovery", "intro", "sales"]):
        route = "sales"
    return {
        "event_name": event_type or "booking.unknown",
        "route": route,
        "finance_required": finance_required,
        "booking_uid": booking.get("uid") or booking.get("id"),
        "booker_email": booking.get("email") or booking.get("attendeeEmail"),
        "occurred_at": datetime.utcnow().isoformat() + "Z"
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    payload = event if isinstance(event, dict) else {}
    classified = classify_booking(payload)
    return {
        "status": "ok",
        "classification": classified,
        "actions": [
            "write scheduling.calcom_webhook_event",
            "create_or_update_crm_interaction",
            "route support_or_sales follow-up",
            "create finance record if paid",
            "emit digest evidence"
        ]
    }
