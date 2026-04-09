# See README in bridge_runner_contract.md for required env vars
# This file performs live Gmail delta sync and writes to Supabase

from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

import requests

from common import now_utc_iso, require_env, supabase_upsert, write_json

DROP = 'intel_stack/bridge/dropoff/gmail_sync_status.json'


def _get_access_token() -> str:
    token = os.getenv('GMAIL_ACCESS_TOKEN')
    if token:
        return token
    client_id = require_env('GMAIL_CLIENT_ID')
    client_secret = require_env('GMAIL_CLIENT_SECRET')
    refresh_token = require_env('GMAIL_REFRESH_TOKEN')
    r = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }, timeout=60)
    r.raise_for_status()
    return r.json()['access_token']


def _gmail_get(url: str, access_token: str, params: dict | None = None) -> dict:
    r = requests.get(url, headers={'Authorization': f'Bearer {access_token}'}, params=params, timeout=60)
    r.raise_for_status()
    return r.json()


def _decode_body(payload: dict) -> str:
    if 'parts' in payload:
        for p in payload['parts']:
            if p.get('mimeType') == 'text/plain' and p.get('body', {}).get('data'):
                return base64.urlsafe_b64decode(p['body']['data']).decode('utf-8', errors='ignore')
    data = payload.get('body', {}).get('data')
    if data:
        return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
    return ''


def run_delta(hours: int = 24) -> dict:
    user = require_env('GMAIL_USER')
    access_token = _get_access_token()

    q = f'newer_than:{hours}h'
    msgs = _gmail_get(f'https://gmail.googleapis.com/gmail/v1/users/{user}/messages', access_token, params={'q': q, 'maxResults': 100})
    items = msgs.get('messages', [])

    rows: List[Dict[str, Any]] = []

    for m in items:
        full = _gmail_get(f'https://gmail.googleapis.com/gmail/v1/users/{user}/messages/{m['id']}', access_token, params={'format': 'full'})
        headers = {h['name'].lower(): h['value'] for h in full.get('payload', {}).get('headers', [])}
        body = _decode_body(full.get('payload', {}))
        direction = 'OUTBOUND' if 'SENT' in full.get('labelIds', []) else 'INBOUND'
        rows.append({
            'gmail_message_id': full.get('id'),
            'thread_id': full.get('threadId'),
            'direction': direction,
            'from_email': headers.get('from'),
            'to_emails': [headers.get('to')] if headers.get('to') else [],
            'cc_emails': [headers.get('cc')] if headers.get('cc') else [],
            'subject': headers.get('subject'),
            'snippet': full.get('snippet'),
            'body_text': body[:20000],
            'sent_at': datetime.fromtimestamp(int(full.get('internalDate', '0'))/1000, tz=timezone.utc).isoformat() if full.get('internalDate') else None,
            'labels': full.get('labelIds', []),
            'metadata': {'source': 'gmail_sync'}
        })

    written = supabase_upsert('email_events', rows, on_conflict='gmail_message_id') if rows else []

    result = {
        'status': 'SUCCESS',
        'synced_at': now_utc_iso(),
        'emails_fetched': len(rows),
        'emails_written': len(written)
    }

    write_json(DROP, result)
    print(json.dumps(result, indent=2))
    return result


if __name__ == '__main__':
    run_delta(24)
