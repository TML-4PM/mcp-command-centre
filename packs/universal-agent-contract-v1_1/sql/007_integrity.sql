-- 007_integrity.sql
-- UAC v1.1 - Integrity engine targeting agent_ops
-- Idempotent.

-- ── Integrity run log ──────────────────────────────────────────────────────
create table if not exists agent_ops.integrity_run (
  run_id          uuid primary key default gen_random_uuid(),
  run_type        text not null default 'scheduled',
  total_checked   int,
  issues_found    int,
  issues_blocked  int,
  remediation_created int,
  summary         jsonb,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

alter table agent_ops.integrity_run enable row level security;
create policy "service_role_only" on agent_ops.integrity_run
  using (auth.role() = 'service_role');

-- ── Integrity issue table ──────────────────────────────────────────────────
create table if not exists agent_ops.integrity_issue (
  issue_id        uuid primary key default gen_random_uuid(),
  run_id          uuid references agent_ops.integrity_run(run_id) on delete cascade,
  issue_type      text not null,
  entity_type     text,
  entity_key      text,
  severity        text check (severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  detail          jsonb,
  resolved        boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table agent_ops.integrity_issue enable row level security;
create policy "service_role_only" on agent_ops.integrity_issue
  using (auth.role() = 'service_role');

-- ── fn_run_integrity_check ─────────────────────────────────────────────────
create or replace function agent_ops.fn_run_integrity_check(
  p_run_type text default 'manual'
) returns jsonb
language plpgsql
as $$
declare
  v_run_id     uuid;
  v_issues     int := 0;
  v_checked    int := 0;
  v_remediated int := 0;
  v_stale_count int;
  v_pretend_count int;
  v_orphan_count  int;
begin
  -- Open run
  insert into agent_ops.integrity_run (run_type)
  values (p_run_type)
  returning run_id into v_run_id;

  -- Check 1: Stale agents (no update in 7d)
  select count(*) into v_stale_count
  from agent_ops.agent_registry
  where updated_at < now() - interval '7 days'
    and status != 'retired';

  if v_stale_count > 0 then
    insert into agent_ops.integrity_issue
      (run_id, issue_type, entity_type, severity, detail)
    values
      (v_run_id, 'STALE_AGENT', 'agent', 'MEDIUM',
       jsonb_build_object('count', v_stale_count, 'threshold_days', 7));
    v_issues := v_issues + 1;
  end if;
  v_checked := v_checked + v_stale_count;

  -- Check 2: PRETEND enforcement events in last 24h
  select count(*) into v_pretend_count
  from agent_ops.enforcement_event
  where reality_status = 'PRETEND'
    and created_at >= now() - interval '24 hours';

  if v_pretend_count > 0 then
    insert into agent_ops.integrity_issue
      (run_id, issue_type, entity_type, severity, detail)
    values
      (v_run_id, 'PRETEND_EXECUTIONS', 'enforcement_event', 'CRITICAL',
       jsonb_build_object('count', v_pretend_count, 'window_hours', 24));
    v_issues := v_issues + 1;
  end if;
  v_checked := v_checked + v_pretend_count;

  -- Check 3: Agents with no task runs ever
  select count(*) into v_orphan_count
  from agent_ops.agent_registry ar
  where not exists (
    select 1 from agent_ops.agent_task_run_log trl
    where trl.agent_key = ar.agent_key
  )
  and ar.status = 'active';

  if v_orphan_count > 0 then
    insert into agent_ops.integrity_issue
      (run_id, issue_type, entity_type, severity, detail)
    values
      (v_run_id, 'ORPHAN_AGENT', 'agent', 'LOW',
       jsonb_build_object('count', v_orphan_count));
    v_issues := v_issues + 1;
  end if;
  v_checked := v_checked + v_orphan_count;

  -- Close run
  update agent_ops.integrity_run set
    total_checked       = v_checked,
    issues_found        = v_issues,
    issues_blocked      = v_pretend_count,
    remediation_created = 0,
    completed_at        = now(),
    summary = jsonb_build_object(
      'stale_agents',      v_stale_count,
      'pretend_24h',       v_pretend_count,
      'orphan_agents',     v_orphan_count,
      'total_issues',      v_issues
    )
  where run_id = v_run_id;

  return jsonb_build_object(
    'run_id',       v_run_id,
    'issues_found', v_issues,
    'checked',      v_checked,
    'summary',      jsonb_build_object(
      'stale',   v_stale_count,
      'pretend', v_pretend_count,
      'orphan',  v_orphan_count
    )
  );
end;
$$;

-- ── View: latest integrity run ─────────────────────────────────────────────
create or replace view agent_ops.v_latest_integrity_run as
select
  run_id, run_type, total_checked, issues_found,
  issues_blocked, completed_at, summary
from agent_ops.integrity_run
order by started_at desc
limit 1;
