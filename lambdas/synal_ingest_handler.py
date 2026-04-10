import json
import os
from datetime import datetime, timezone

import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


def _headers():
    return {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }


def _post(path, payload):
    res = requests.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers(), data=json.dumps(payload), timeout=30)
    res.raise_for_status()
    return res.json() if res.text else None


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def handler(event, context):
    payload = event.get('payload', {})
    asset_key = payload.get('asset_key', 'synal-ingest')
    source = payload.get('source', 'api')
    signal_payload = payload.get('signal', payload)

    asset_lookup = requests.get(
        f"{SUPABASE_URL}/rest/v1/synal.asset_registry?asset_key=eq.{asset_key}&select=id,asset_key",
        headers=_headers(),
        timeout=30,
    )
    asset_lookup.raise_for_status()
    rows = asset_lookup.json()
    if not rows:
        raise RuntimeError(f'asset not found: {asset_key}')
    asset_id = rows[0]['id']

    signal = _post('synal.signal', {
        'asset_id': asset_id,
        'source': source,
        'payload': signal_payload,
        'received_at': _now_iso(),
    })

    return {
        'status': 'ok',
        'asset_key': asset_key,
        'asset_id': asset_id,
        'signal': signal,
    }
