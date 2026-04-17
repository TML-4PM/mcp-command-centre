from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from common import require_env, supabase_headers, supabase_rest_url, write_json
import requests

DROP_DIR = Path('intel_stack/bridge/dropoff')
EXPORT_DIR = Path('intel_stack/exports')
DROP_DIR.mkdir(parents=True, exist_ok=True)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def _fetch(table: str, query: str = 'select=*') -> list[dict[str, Any]]:
    url = supabase_rest_url(table)
    r = requests.get(url, headers=supabase_headers(), params={'select': '*'}, timeout=60)
    r.raise_for_status()
    return r.json()


def _safe_email(value: Any) -> str:
    if not value:
        return ''
    if isinstance(value, list) and value:
        return str(value[0]).strip()
    return str(value).strip()


def build_scores() -> dict[str, Any]:
    email_events = _fetch('email_events')
    contacts = _fetch('campaign_contacts')

    by_email: dict[str, dict[str, Any]] = {}

    for c in contacts:
        email = (c.get('email') or '').strip().lower()
        if not email:
            continue
        by_email[email] = {
            'email': email,
            'contact_name': c.get('contact_name') or '',
            'organisation_name': c.get('organisation_name') or '',
            'segment': (c.get('segment') or '').lower(),
            'score': 0,
            'outbound_count': 0,
            'inbound_count': 0,
            'last_subject': '',
            'last_activity_at': ''
        }

    for e in email_events:
        direction = e.get('direction') or ''
        to_email = _safe_email(e.get('to_emails')).lower()
        from_email = (e.get('from_email') or '').lower()
        subject = e.get('subject') or ''
        sent_at = e.get('sent_at') or e.get('created_at') or ''

        target = ''
        if direction == 'OUTBOUND':
            target = to_email
        elif direction == 'INBOUND':
            target = from_email

        if not target:
            continue

        if target not in by_email:
            by_email[target] = {
                'email': target,
                'contact_name': '',
                'organisation_name': '',
                'segment': 'unknown',
                'score': 0,
                'outbound_count': 0,
                'inbound_count': 0,
                'last_subject': '',
                'last_activity_at': ''
            }

        row = by_email[target]
        row['last_subject'] = subject
        row['last_activity_at'] = sent_at

        if direction == 'OUTBOUND':
            row['outbound_count'] += 1
            row['score'] += 2
        elif direction == 'INBOUND':
            row['inbound_count'] += 1
            row['score'] += 5

    for row in by_email.values():
        seg = row['segment']
        if seg == 'provider':
            row['score'] += 4
        elif seg == 'supplier':
            row['score'] += 2
        elif seg == 'participant':
            row['score'] += 1

        if row['outbound_count'] > 0 and row['inbound_count'] == 0:
            row['score'] -= 2

    ranked = sorted(by_email.values(), key=lambda x: (-x['score'], x['email']))

    csv_path = EXPORT_DIR / 'ranked_targets.csv'
    with csv_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['email', 'contact_name', 'organisation_name', 'segment', 'score', 'outbound_count', 'inbound_count', 'last_subject', 'last_activity_at'])
        writer.writeheader()
        writer.writerows(ranked)

    result = {
        'status': 'SUCCESS',
        'ranked_count': len(ranked),
        'top_10': ranked[:10],
        'csv_path': str(csv_path)
    }
    write_json(DROP_DIR / 'scoring_status.json', result)
    print(json.dumps(result, indent=2))
    return result


if __name__ == '__main__':
    build_scores()
