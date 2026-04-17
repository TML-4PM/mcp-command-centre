"""Gmail sync contract for Bridge Runner.

This file is intentionally secret-free.
Bridge Runner should inject credentials at runtime and replace the stub fetch.
"""

from datetime import datetime, timezone
import json
from pathlib import Path

OUT = Path("intel_stack/bridge/dropoff")
OUT.mkdir(parents=True, exist_ok=True)


def now_utc():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sync_gmail_delta():
    result = {
        "status": "STUB",
        "message": "Replace with runtime Gmail API delta sync using injected credentials.",
        "synced_at": now_utc(),
        "emails_processed": 0,
        "notes": [
            "Expected outputs: normalised email events, campaign activity rows, reply classification"
        ]
    }
    out = OUT / "gmail_sync_status.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    sync_gmail_delta()
