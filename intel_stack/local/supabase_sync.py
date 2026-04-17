"""Supabase sync contract for Bridge Runner.

Runner should inject SUPABASE_URL and SUPABASE_KEY at runtime.
This script writes a minimal status file and demonstrates expected IO.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

OUT = Path("intel_stack/bridge/dropoff")
OUT.mkdir(parents=True, exist_ok=True)


def now_utc():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sync_supabase():
    result = {
        "status": "STUB",
        "message": "Replace with runtime Supabase upserts for raw_ingest, notes, email_events, campaign_activity.",
        "synced_at": now_utc(),
        "rows_written": 0,
        "tables": [
            "intel.raw_ingest",
            "intel.notes",
            "intel.email_events",
            "intel.campaign_activity"
        ]
    }
    out = OUT / "supabase_sync_status.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    sync_supabase()
