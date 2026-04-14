-- 006_widgets.sql
-- UAC v1.1 - Command Centre views + t4h_ui_snippet inserts
-- Targets agent_ops. Idempotent.

-- ── View: enforcement summary ──────────────────────────────────────────────
create or replace view agent_ops.v_enforcement_summary as
select
  reality_status,
  count(*)                                        as event_count,
  count(*) filter (where blocked)                 as blocked_count,
  max(created_at)                                 as last_event,
  date_trunc('day', now())                        as as_of_day
from agent_ops.enforcement_event
where created_at >= now() - interval '24 hours'
group by reality_status;

-- ── View: open remediation jobs ────────────────────────────────────────────
create or replace view agent_ops.v_open_remediation_jobs as
select
  job_id,
  run_type,
  status,
  started_at,
  completed_at,
  result
from ops.auto_remediation_run
where status in ('pending','running','failed')
order by started_at desc
limit 50;

-- ── View: agent integrity gaps ─────────────────────────────────────────────
create or replace view agent_ops.v_agent_integrity_gaps as
select
  ar.agent_key,
  ar.agent_name,
  ar.status,
  ar.updated_at,
  case
    when ar.updated_at < now() - interval '7 days' then 'STALE'
    when ar.status = 'inactive' then 'INACTIVE'
    else 'OK'
  end as integrity_state,
  extract(days from (now() - ar.updated_at))::int as days_since_update
from agent_ops.agent_registry ar
where ar.updated_at < now() - interval '7 days'
   or ar.status = 'inactive'
order by ar.updated_at asc;

-- ── View: reality ledger 24h ───────────────────────────────────────────────
create or replace view agent_ops.v_reality_ledger_24h as
select
  coalesce(reality_status, 'UNKNOWN')             as reality_status,
  count(*)                                         as total,
  count(*) filter (where blocked)                  as blocked,
  round(100.0 * count(*) / nullif(sum(count(*)) over(), 0), 1) as pct
from agent_ops.enforcement_event
where created_at >= now() - interval '24 hours'
group by reality_status;

-- ── t4h_ui_snippet: enforcement widget ────────────────────────────────────
insert into public.t4h_ui_snippet (slug, page_key, title, html, is_active)
values (
  'uac-enforcement-summary',
  'command-centre',
  'UAC Enforcement (24h)',
  '<div class="widget-card">
    <h3>Enforcement · 24h</h3>
    <div data-source="agent_ops.v_reality_ledger_24h" data-render="table"></div>
    <div data-source="agent_ops.v_enforcement_summary" data-render="badges"></div>
  </div>',
  true
)
on conflict (slug) do update set
  html       = excluded.html,
  updated_at = now();

insert into public.t4h_ui_snippet (slug, page_key, title, html, is_active)
values (
  'uac-open-remediations',
  'command-centre',
  'Open Remediation Jobs',
  '<div class="widget-card">
    <h3>Remediation Queue</h3>
    <div data-source="agent_ops.v_open_remediation_jobs" data-render="table" data-limit="10"></div>
  </div>',
  true
)
on conflict (slug) do update set
  html       = excluded.html,
  updated_at = now();

insert into public.t4h_ui_snippet (slug, page_key, title, html, is_active)
values (
  'uac-integrity-gaps',
  'command-centre',
  'Agent Integrity Gaps',
  '<div class="widget-card widget-alert">
    <h3>Integrity Gaps</h3>
    <div data-source="agent_ops.v_agent_integrity_gaps" data-render="table" data-limit="20"></div>
  </div>',
  true
)
on conflict (slug) do update set
  html       = excluded.html,
  updated_at = now();
