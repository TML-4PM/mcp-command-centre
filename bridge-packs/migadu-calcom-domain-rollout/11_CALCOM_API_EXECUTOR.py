import os
import requests
from typing import Dict, Any, List

CALCOM_API_KEY = os.getenv("CALCOM_API_KEY", "")
CALCOM_BASE_URL = os.getenv("CALCOM_BASE_URL", "https://api.cal.com/v2")

class CalcomExecutorError(Exception):
    pass


def _headers():
    if not CALCOM_API_KEY:
        raise CalcomExecutorError("CALCOM_API_KEY missing")
    return {
        "Authorization": f"Bearer {CALCOM_API_KEY}",
        "Content-Type": "application/json",
    }


def create_event_type(domain: str, name: str, duration: int):
    payload = {
        "name": name,
        "slug": f"{name.lower().replace(' ', '-')}-{domain.replace('.', '-')}",
        "length": duration
    }
    r = requests.post(f"{CALCOM_BASE_URL}/event-types", json=payload, headers=_headers())
    if r.status_code >= 400:
        raise CalcomExecutorError(r.text)
    return r.json()


def build_default_events(domain: str) -> List[Dict[str, Any]]:
    events = [
        ("Intro Call", 15),
        ("Consultation", 30),
        ("Support Session", 30),
        ("Deep Session", 60)
    ]
    results = []
    for name, duration in events:
        results.append(create_event_type(domain, name, duration))
    return results


def handler(event, context):
    domains = event.get("domains", [])
    output = []
    for d in domains:
        output.append({"domain": d, "events": build_default_events(d)})
    return {"status": "ok", "results": output}
