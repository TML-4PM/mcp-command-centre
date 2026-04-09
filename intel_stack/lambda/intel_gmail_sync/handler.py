"""
intel-gmail-sync — Lambda
Triggered: EventBridge every 15 minutes
Purpose: Delta-sync Gmail → intel.email_events (S1 Supabase)
RDTI: is_rd=true, project_code=INTEL-01
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
from base64 import urlsafe_b64decode
from datetime import datetime, timezone
from typing import Any

import boto3
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

log = logging.getLogger()
log.setLevel(logging.INFO)

SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_KEY"]
SSM_PREFIX     = os.environ.get("SSM_PREFIX", "/t4h/intel")
GMAIL_USER     = os.environ.get("GMAIL_USER", "me")
MAX_RESULTS    = int(os.environ.get("MAX_RESULTS", "50"))

ssm = boto3.client("ssm", region_name="ap-southeast-2")


# ── helpers ───────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def supa_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }


def supa_upsert(table: str, rows: list[dict], on_conflict: str) -> list:
    if not rows:
        return []
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=supa_headers(),
        params={"on_conflict": on_conflict},
        json=rows,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def supa_select(table: str, params: dict) -> list:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=supa_headers(),
        params=params,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()


def get_ssm(name: str) -> str:
    r = ssm.get_parameter(Name=f"{SSM_PREFIX}/{name}", WithDecryption=True)
    return r["Parameter"]["Value"]


def gmail_creds() -> Credentials:
    token    = get_ssm("gmail_token")
    refresh  = get_ssm("gmail_refresh_token")
    cid      = get_ssm("gmail_client_id")
    csecret  = get_ssm("gmail_client_secret")
    return Credentials(
        token=token,
        refresh_token=refresh,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cid,
        client_secret=csecret,
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
    )


def decode_body(payload: dict) -> str:
    """Extract plain text body from Gmail message payload."""
    def _extract(part: dict) -> str:
        mime = part.get("mimeType", "")
        if mime == "text/plain":
            data = part.get("body", {}).get("data", "")
            if data:
                return urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        for sub in part.get("parts", []):
            result = _extract(sub)
            if result:
                return result
        return ""
    return _extract(payload)[:4000]  # cap at 4k chars


def get_header(headers: list, name: str) -> str:
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def get_last_history_id() -> str | None:
    rows = supa_select(
        "intel_run_log",
        {"action": "eq.gmail_sync", "select": "data", "order": "created_at.desc", "limit": "1"},
    )
    if rows:
        return rows[0].get("data", {}).get("history_id")
    return None


def save_run_log(run_id: str, status: str, data: dict, error: str | None = None, ms: int = 0):
    supa_upsert(
        "intel_run_log",
        [{
            "run_id": run_id,
            "fn": "intel-gmail-sync",
            "action": "gmail_sync",
            "status": status,
            "notes_processed": 0,
            "emails_processed": data.get("emails_processed", 0),
            "challenges_gen": 0,
            "rows_written": data.get("rows_written", 0),
            "error": error,
            "execution_ms": ms,
            "data": json.dumps(data),
            "is_rd": True,
            "project_code": "INTEL-01",
        }],
        on_conflict="run_id",
    )


# ── main ──────────────────────────────────────────────────────────────────────

def handler(event: dict, context: Any) -> dict:
    t0 = datetime.now(timezone.utc)
    run_id = f"intel-gmail-{t0.strftime('%Y%m%d-%H%M%S')}"
    log.info("START run_id=%s", run_id)

    try:
        creds   = gmail_creds()
        service = build("gmail", "v1", credentials=creds, cache_discovery=False)

        # Delta sync via history API if we have a previous history_id
        last_history_id = get_last_history_id()
        msgs = []

        if last_history_id:
            try:
                history = service.users().history().list(
                    userId=GMAIL_USER,
                    startHistoryId=last_history_id,
                    historyTypes=["messageAdded"],
                ).execute()
                for record in history.get("history", []):
                    for m in record.get("messagesAdded", []):
                        msgs.append(m["message"]["id"])
                log.info("History delta: %d new message IDs", len(msgs))
            except Exception as e:
                log.warning("History API failed (%s), falling back to list", e)
                msgs = []

        if not msgs:
            result = service.users().messages().list(
                userId=GMAIL_USER, maxResults=MAX_RESULTS, labelIds=["INBOX"]
            ).execute()
            msgs = [m["id"] for m in result.get("messages", [])]
            log.info("List fallback: %d messages", len(msgs))

        # Get current profile history_id for next run
        profile = service.users().getProfile(userId=GMAIL_USER).execute()
        new_history_id = profile.get("historyId")

        # Fetch + normalise
        rows = []
        for msg_id in msgs:
            try:
                msg = service.users().messages().get(
                    userId=GMAIL_USER, id=msg_id, format="full"
                ).execute()
                headers = msg.get("payload", {}).get("headers", [])
                body    = decode_body(msg.get("payload", {}))
                sender  = get_header(headers, "From")
                subject = get_header(headers, "Subject")
                rows.append({
                    "message_id": msg_id,
                    "sender": sender[:500],
                    "subject": subject[:500],
                    "body": body,
                    "processed": False,
                    "is_rd": True,
                    "project_code": "INTEL-01",
                })
            except Exception as e:
                log.warning("Skipping message %s: %s", msg_id, e)

        written = supa_upsert("intel_email_events", rows, on_conflict="message_id")
        ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)

        data = {
            "emails_processed": len(msgs),
            "rows_written": len(written),
            "history_id": new_history_id,
        }
        save_run_log(run_id, "success", data, ms=ms)
        log.info("DONE %s | rows=%d ms=%d", run_id, len(written), ms)

        return {"statusCode": 200, "body": json.dumps({"run_id": run_id, **data})}

    except Exception as e:
        ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        log.exception("FAILED run_id=%s", run_id)
        save_run_log(run_id, "failed", {}, error=str(e), ms=ms)
        return {"statusCode": 500, "body": json.dumps({"run_id": run_id, "error": str(e)})}
