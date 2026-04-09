from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
import requests

load_dotenv()


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def safe_slug(text: str) -> str:
    out = ''.join(c.lower() if c.isalnum() else '-' for c in text).strip('-')
    while '--' in out:
        out = out.replace('--', '-')
    return (out or 'untitled')[:120]


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


def write_json(path: str | Path, payload: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=2), encoding='utf-8')


def supabase_headers() -> dict[str, str]:
    key = require_env('SUPABASE_KEY')
    return {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }


def supabase_rest_url(table_name: str) -> str:
    base = require_env('SUPABASE_URL').rstrip('/')
    return f"{base}/rest/v1/{table_name}"


def supabase_upsert(table_name: str, rows: list[dict[str, Any]], on_conflict: str | None = None) -> Any:
    if not rows:
        return []
    url = supabase_rest_url(table_name)
    headers = supabase_headers()
    if on_conflict:
        headers['Prefer'] = f"resolution=merge-duplicates,return=representation"
        params = {'on_conflict': on_conflict}
    else:
        params = None
    r = requests.post(url, headers=headers, params=params, data=json.dumps(rows), timeout=60)
    r.raise_for_status()
    return r.json()


def bridge_post(payload: dict[str, Any]) -> Any:
    url = require_env('BRIDGE_API_URL')
    api_key = require_env('BRIDGE_API_KEY')
    r = requests.post(url, headers={'Content-Type': 'application/json', 'x-api-key': api_key}, data=json.dumps(payload), timeout=60)
    r.raise_for_status()
    return r.json()
