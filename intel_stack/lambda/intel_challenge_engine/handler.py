"""
intel-challenge-engine — Lambda
Triggered: EventBridge daily 06:00 AEST (20:00 UTC prev day)
Purpose: Generate assumption challenges from recent intel.notes → intel.assumptions
RDTI: is_rd=true, project_code=INTEL-01
"""
from __future__ import annotations

import json
import logging
import os
import random
from datetime import datetime, timezone, timedelta
from typing import Any

import boto3
import requests

log = logging.getLogger()
log.setLevel(logging.INFO)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

# Fallback challenges if no notes available
STANDING_CHALLENGES = [
    "You say automation-first but still operate manually in at least one critical flow.",
    "You are collecting signals but not acting on them within 24 hours.",
    "You are sending messages without tracking outcomes against a baseline.",
    "At least one of your 30 businesses has not had a revenue event this week.",
    "Your evidence tier for one REAL business is actually PARTIAL.",
    "You have a blocker open for more than 72 hours with no next action committed.",
    "Your BAS is overdue. Today is the day you schedule it.",
    "At least one Lambda in your fleet is active but has zero invocations this month.",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def supa_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }


def supa_select(table: str, params: dict) -> list:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=supa_headers(),
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def supa_upsert(table: str, rows: list[dict], on_conflict: str) -> list:
    if not rows:
        return []
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={**supa_headers(), "Prefer": f"resolution=merge-duplicates,return=representation"},
        params={"on_conflict": on_conflict},
        json=rows,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def generate_challenge_from_note(note: dict) -> str:
    summary = note.get("summary") or note.get("raw_text", "")[:200]
    tags    = note.get("tags") or []
    if summary:
        return f"From recent intel: '{summary[:120]}' — what is the next committed action before EOD?"
    if tags:
        return f"You captured signal tagged {tags} — have you acted on it or scheduled it?"
    return random.choice(STANDING_CHALLENGES)


def save_run_log(run_id: str, status: str, data: dict, error: str | None = None, ms: int = 0):
    supa_upsert(
        "intel_run_log",
        [{
            "run_id": run_id,
            "fn": "intel-challenge-engine",
            "action": "challenge_run",
            "status": status,
            "notes_processed": data.get("notes_processed", 0),
            "emails_processed": 0,
            "challenges_gen": data.get("challenges_gen", 0),
            "rows_written": data.get("challenges_gen", 0),
            "error": error,
            "execution_ms": ms,
            "is_rd": True,
            "project_code": "INTEL-01",
        }],
        on_conflict="run_id",
    )


def handler(event: dict, context: Any) -> dict:
    t0     = datetime.now(timezone.utc)
    run_id = f"intel-challenge-{t0.strftime('%Y%m%d-%H%M%S')}"
    log.info("START run_id=%s", run_id)

    try:
        # Pull notes from last 24h
        since = (t0 - timedelta(hours=24)).isoformat()
        notes = supa_select(
            "intel_notes",
            {"created_at": f"gte.{since}", "select": "id,summary,raw_text,tags", "limit": "20"},
        )
        log.info("Notes fetched: %d", len(notes))

        # Generate challenges
        challenges = []
        if notes:
            for note in notes[:5]:  # max 5 note-derived challenges
                challenges.append({
                    "note_id": note.get("id"),
                    "assumption": f"Signal captured at {t0.strftime('%Y-%m-%d')}",
                    "challenge": generate_challenge_from_note(note),
                    "status": "open",
                    "is_rd": True,
                    "project_code": "INTEL-01",
                })
        else:
            # Standing daily challenge
            challenges.append({
                "note_id": None,
                "assumption": f"Daily standing challenge {t0.strftime('%Y-%m-%d')}",
                "challenge": random.choice(STANDING_CHALLENGES),
                "status": "open",
                "is_rd": True,
                "project_code": "INTEL-01",
            })

        written = supa_upsert("intel_assumptions", challenges, on_conflict="id")
        ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)

        data = {"notes_processed": len(notes), "challenges_gen": len(written)}
        save_run_log(run_id, "success", data, ms=ms)
        log.info("DONE %s | challenges=%d ms=%d", run_id, len(written), ms)

        return {"statusCode": 200, "body": json.dumps({"run_id": run_id, **data})}

    except Exception as e:
        ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        log.exception("FAILED run_id=%s", run_id)
        save_run_log(run_id, "failed", {}, error=str(e), ms=ms)
        return {"statusCode": 500, "body": json.dumps({"run_id": run_id, "error": str(e)})}
