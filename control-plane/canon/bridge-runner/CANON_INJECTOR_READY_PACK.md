# Canon Injector Ready Pack

This file is the full Bridge Runner intake artifact for replacing the current canon stubs with live runtime content.

## Replace these repo files in-place

- `control-plane/canon/sql/control_plane_canon.sql`
- `control-plane/canon/lambda/bridge_canon_router.py`
- `control-plane/canon/ui/control_plane_canon_monitor.html`

---

## 1) control_plane_canon.sql

```sql
create schema if not exists control_plane;

create table if not exists control_plane.prompt_profile (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null,
  version text not null default '1.0',
  target_model_family text not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists prompt_profile_uq
on control_plane.prompt_profile(profile_key, version, target_model_family);

create table if not exists control_plane.injection_rule (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  trigger_type text not null,
  severity text not null,
  command_to_inject text not null,
  applies_to_model_family text default 'all',
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists control_plane.session_state (
  id uuid primary key default gen_random_uuid(),
  session_key text not null,
  model_family text not null,
  canon_version text default '1.0',
  alignment_state text default 'ALIGNED',
  last_injected_at timestamptz,
  last_checked_at timestamptz default now(),
  created_at timestamptz default now(),
  biz_key text,
  thread_key text,
  task_type text,
  last_command text,
  last_drift_score int default 0,
  last_classification text,
  support_state text default 'MONITORED'
);

create unique index if not exists session_state_uq
on control_plane.session_state(session_key, model_family);

create table if not exists control_plane.drift_event (
  id uuid primary key default gen_random_uuid(),
  session_key text,
  model_family text,
  trigger_type text,
  severity text,
  detected_from text,
  action_taken text,
  pre_state text,
  post_state text,
  evidence jsonb,
  created_at timestamptz default now(),
  biz_key text,
  thread_key text,
  canon_version text,
  drift_score int default 0,
  classification text,
  resolved boolean default false,
  resolved_at timestamptz
);

create table if not exists control_plane.command_registry (
  id uuid primary key default gen_random_uuid(),
  command text not null unique,
  action_key text not null,
  handler_name text not null,
  autonomy_tier text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into control_plane.prompt_profile (profile_key, version, target_model_family, content)
values
(
  'universal_canon','1.0','all',
$$You are operating inside a portfolio-scale autonomous control plane.
Core rules:
- Registry-first
- Reality Ledger: REAL / PARTIAL / PRETEND
- Closure-first
- Bridge-first
- Autonomy tiers: AUTONOMOUS / LOG-ONLY / GATED / BLOCKED
- Support-state mandatory
- Wave 10 minimum
All outputs must be executable, observable, recoverable, and evidenced.$$ 
),
(
  'gpt_operator_overlay','1.0','gpt',
$$Do not assume completion without evidence.
Prefer correctness over helpfulness.
Surface gaps explicitly.
Treat uncertainty as PARTIAL.
Treat unverified claims as PRETEND.$$ 
)
on conflict (profile_key, version, target_model_family) do update set
  content = excluded.content,
  is_active = true,
  updated_at = now();

insert into control_plane.injection_rule (rule_key, trigger_type, severity, command_to_inject)
values
('missing_evidence', 'no_evidence_logic', 'rebind', '/canon-rebind'),
('false_done', 'false_completion', 'quarantine', '/canon-quarantine'),
('no_registry', 'missing_registry', 'rebind', '/canon-rebind'),
('model_switch', 'session_change', 'soft', '/canon'),
('new_thread', 'new_context', 'soft', '/canon')
on conflict do nothing;

insert into control_plane.command_registry (command, action_key, handler_name, autonomy_tier)
values
('/canon', 'control_plane.canon.inject', 'canon_inject_handler', 'AUTONOMOUS'),
('/canon-rebind', 'control_plane.canon.rebind', 'canon_rebind_handler', 'AUTONOMOUS'),
('/canon-quarantine', 'control_plane.canon.quarantine', 'canon_quarantine_handler', 'GATED'),
('/canon-check', 'control_plane.canon.check', 'canon_check_handler', 'AUTONOMOUS'),
('/canon-sync', 'control_plane.canon.sync_profiles', 'canon_sync_profiles_handler', 'AUTONOMOUS'),
('/canon-nightly', 'control_plane.canon.nightly_audit', 'canon_nightly_audit_handler', 'AUTONOMOUS')
on conflict (command) do update set
  action_key = excluded.action_key,
  handler_name = excluded.handler_name,
  autonomy_tier = excluded.autonomy_tier,
  updated_at = now();

create or replace view control_plane.v_session_alignment as
select
  session_key,
  model_family,
  biz_key,
  thread_key,
  alignment_state,
  last_command,
  last_drift_score,
  last_classification,
  last_checked_at,
  support_state
from control_plane.session_state
order by last_checked_at desc;

create or replace view control_plane.v_drift_hotspots as
select
  model_family,
  biz_key,
  trigger_type,
  severity,
  count(*) as event_count,
  max(created_at) as last_seen
from control_plane.drift_event
group by 1,2,3,4
order by event_count desc, last_seen desc;

create or replace view control_plane.v_canon_compliance as
select
  model_family,
  count(*) filter (where alignment_state = 'ALIGNED') as aligned_sessions,
  count(*) filter (where alignment_state = 'DRIFTING') as drifting_sessions,
  count(*) filter (where alignment_state = 'REBOUND') as rebound_sessions,
  count(*) filter (where alignment_state = 'QUARANTINED') as quarantined_sessions
from control_plane.session_state
group by 1;

create or replace view control_plane.v_canon_monitor as
select
  session_key,
  model_family,
  alignment_state,
  last_drift_score,
  last_command,
  last_checked_at
from control_plane.session_state
order by last_checked_at desc
limit 100;

create or replace view control_plane.v_nightly_integrity_summary as
select
  current_date as audit_date,
  count(*) filter (where alignment_state = 'ALIGNED') as aligned_count,
  count(*) filter (where alignment_state = 'DRIFTING') as drifting_count,
  count(*) filter (where alignment_state = 'REBOUND') as rebound_count,
  count(*) filter (where alignment_state = 'QUARANTINED') as quarantined_count,
  avg(last_drift_score)::numeric(10,2) as avg_drift_score
from control_plane.session_state;
```

---

## 2) bridge_canon_router.py

```python
import json
import os
from datetime import datetime, timezone

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE"]


def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def supabase_select(path, params=None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=sb_headers(), params=params or {})
    r.raise_for_status()
    return r.json()


def supabase_insert(path, payload):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={**sb_headers(), "Prefer": "return=representation"},
        json=payload,
    )
    r.raise_for_status()
    return r.json()


def supabase_upsert(path, payload, on_conflict):
    headers = {**sb_headers(), "Prefer": "resolution=merge-duplicates,return=representation"}
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{path}?on_conflict={on_conflict}",
        headers=headers,
        json=payload,
    )
    r.raise_for_status()
    return r.json()


def get_profile(profile_key, model_family):
    rows = supabase_select(
        "control_plane.prompt_profile",
        {
            "profile_key": f"eq.{profile_key}",
            "is_active": "eq.true",
            "or": f"(target_model_family.eq.{model_family},target_model_family.eq.all)",
        },
    )
    exact = [r for r in rows if r["target_model_family"] == model_family]
    return (exact[0] if exact else rows[0])["content"] if rows else ""


def detect_drift_score(input_text: str) -> dict:
    t = (input_text or "").lower()
    score = 0
    hits = []

    checks = [
        (2, "missing_registry_reference", "registry" not in t),
        (3, "missing_evidence_logic", "evidence" not in t),
        (3, "missing_runtime_path", "runtime" not in t),
        (2, "missing_recovery_path", "recovery" not in t and "rollback" not in t),
        (2, "missing_telemetry", "telemetry" not in t and "logs" not in t),
        (3, "missing_closure_logic", "closure" not in t and "done" not in t),
    ]

    for weight, key, flag in checks:
        if flag:
            score += weight
            hits.append(key)

    if "done" in t and "evidence" not in t:
        score += 4
        hits.append("false_completion_claim")

    if score >= 9:
        severity = "quarantine"
        command = "/canon-quarantine"
        state = "QUARANTINED"
    elif score >= 6:
        severity = "rebind"
        command = "/canon-rebind"
        state = "REBOUND"
    elif score >= 3:
        severity = "soft"
        command = "/canon"
        state = "DRIFTING"
    else:
        severity = "none"
        command = None
        state = "ALIGNED"

    return {
        "score": score,
        "hits": hits,
        "severity": severity,
        "command": command,
        "alignment_state": state,
    }


def canon_check_handler(body):
    session_key = body["session_key"]
    model_family = body["model_family"]
    input_text = body.get("input_text", "")
    biz_key = body.get("metadata", {}).get("biz_key")
    thread_key = body.get("metadata", {}).get("thread_key")
    task_type = body.get("task_type")

    drift = detect_drift_score(input_text)

    canon = get_profile("universal_canon", model_family)
    overlay = get_profile("gpt_operator_overlay", model_family) if model_family == "gpt" else ""

    supabase_upsert(
        "control_plane.session_state",
        [{
            "session_key": session_key,
            "model_family": model_family,
            "biz_key": biz_key,
            "thread_key": thread_key,
            "task_type": task_type,
            "alignment_state": drift["alignment_state"],
            "last_checked_at": datetime.now(timezone.utc).isoformat(),
            "last_injected_at": datetime.now(timezone.utc).isoformat() if drift["command"] else None,
            "last_command": drift["command"],
            "last_drift_score": drift["score"],
            "support_state": "MONITORED",
        }],
        "session_key,model_family",
    )

    if drift["command"]:
        supabase_insert(
            "control_plane.drift_event",
            [{
                "session_key": session_key,
                "model_family": model_family,
                "biz_key": biz_key,
                "thread_key": thread_key,
                "trigger_type": ",".join(drift["hits"]),
                "severity": drift["severity"],
                "drift_score": drift["score"],
                "detected_from": "canon_check_handler",
                "action_taken": drift["command"],
                "pre_state": "UNKNOWN",
                "post_state": drift["alignment_state"],
                "canon_version": "1.0",
                "classification": "PARTIAL",
                "evidence": drift,
            }]
        )

    return {
        "inject": bool(drift["command"]),
        "command": drift["command"],
        "canon": canon,
        "overlay": overlay,
        "drift": drift,
    }


def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    action = body.get("action")

    if action == "control_plane.canon.check":
        result = canon_check_handler(body)
    else:
        result = {"error": f"Unsupported action: {action}"}

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result),
    }
```

---

## 3) control_plane_canon_monitor.html

```html
<div class="p-4 rounded-2xl shadow bg-white">
  <div class="text-xl font-semibold mb-3">Control Plane Canon Monitor</div>
  <div id="canon-summary" class="mb-4 text-sm">Loading…</div>
  <table class="w-full text-sm border-collapse">
    <thead>
      <tr>
        <th class="text-left p-2 border-b">Session</th>
        <th class="text-left p-2 border-b">Model</th>
        <th class="text-left p-2 border-b">State</th>
        <th class="text-left p-2 border-b">Drift</th>
        <th class="text-left p-2 border-b">Last Command</th>
        <th class="text-left p-2 border-b">Checked</th>
      </tr>
    </thead>
    <tbody id="canon-rows"></tbody>
  </table>
</div>

<script>
async function loadCanonMonitor() {
  const res = await fetch('/api/control-plane/canon-monitor');
  const data = await res.json();

  document.getElementById('canon-summary').innerText =
    `Aligned: ${data.summary.aligned} | Drifting: ${data.summary.drifting} | Rebound: ${data.summary.rebound} | Quarantined: ${data.summary.quarantined}`;

  document.getElementById('canon-rows').innerHTML = data.rows.map(r => `
    <tr>
      <td class="p-2 border-b">${r.session_key}</td>
      <td class="p-2 border-b">${r.model_family}</td>
      <td class="p-2 border-b">${r.alignment_state}</td>
      <td class="p-2 border-b">${r.last_drift_score ?? 0}</td>
      <td class="p-2 border-b">${r.last_command ?? ''}</td>
      <td class="p-2 border-b">${r.last_checked_at}</td>
    </tr>
  `).join('');
}
loadCanonMonitor();
</script>
```

---

## Bridge Runner execution notes

1. Replace the current SQL and Lambda stubs with the code above.
2. Deploy Lambda into the existing bridge execution path.
3. Run SQL in Supabase.
4. Add the monitor widget to `t4h_ui_snippet` with slug `control-plane-canon-monitor`.
5. Schedule nightly audit through your existing cron path.

## Reality classification

- Repo intake pack: REAL
- Runtime live deployment: PARTIAL until Bridge Runner applies it
- Existing stub files: PRETEND until replaced
