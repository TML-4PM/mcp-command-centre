-- 005_enforcement.sql
-- UAC v1.1 - Enforcement layer targeting agent_ops + ops schemas
-- Idempotent. RLS-safe. No schema creation (agent_ops already exists).

-- ── Enforcement rules table ────────────────────────────────────────────────
create table if not exists agent_ops.enforcement_rule (
  rule_id        uuid primary key default gen_random_uuid(),
  rule_key       text not null unique,
  description    text,
  schema_target  text not null,
  table_target   text,
  condition_sql  text not null,
  action         text not null check (action in ('BLOCK','LOG','ALERT','REMEDIATE')),
  severity       text not null check (severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table agent_ops.enforcement_rule enable row level security;
create policy "service_role_only" on agent_ops.enforcement_rule
  using (auth.role() = 'service_role');

-- ── Policy gate table ──────────────────────────────────────────────────────
create table if not exists agent_ops.policy_gate (
  gate_id        uuid primary key default gen_random_uuid(),
  gate_key       text not null unique,
  agent_key      text,
  tool_key       text,
  risk_level     text not null check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  requires_human boolean not null default false,
  auto_block     boolean not null default false,
  block_reason   text,
  created_at     timestamptz not null default now()
);

alter table agent_ops.policy_gate enable row level security;
create policy "service_role_only" on agent_ops.policy_gate
  using (auth.role() = 'service_role');

-- ── Execution enforcement log ──────────────────────────────────────────────
create table if not exists agent_ops.enforcement_event (
  event_id         uuid primary key default gen_random_uuid(),
  rule_key         text references agent_ops.enforcement_rule(rule_key),
  agent_key        text,
  tool_key         text,
  action_taken     text not null,
  reality_status   text check (reality_status in ('REAL','PARTIAL','PRETEND')),
  blocked          boolean not null default false,
  detail           jsonb,
  created_at       timestamptz not null default now()
);

alter table agent_ops.enforcement_event enable row level security;
create policy "service_role_only" on agent_ops.enforcement_event
  using (auth.role() = 'service_role');

-- ── fn_classify_reality ────────────────────────────────────────────────────
create or replace function agent_ops.fn_classify_reality(
  p_has_evidence   boolean,
  p_log_written    boolean,
  p_output_valid   boolean
) returns text
language sql immutable
as $$
  select case
    when p_has_evidence and p_log_written and p_output_valid then 'REAL'
    when (p_log_written or p_has_evidence) and not (p_has_evidence and p_log_written and p_output_valid) then 'PARTIAL'
    else 'PRETEND'
  end
$$;

-- ── fn_enforce_execution ──────────────────────────────────────────────────
-- Called by bridge router per execution. Blocks PRETEND completions.
create or replace function agent_ops.fn_enforce_execution(
  p_agent_key    text,
  p_tool_key     text,
  p_has_evidence boolean,
  p_log_written  boolean,
  p_output_valid boolean
) returns jsonb
language plpgsql
as $$
declare
  v_reality text;
  v_blocked boolean := false;
begin
  v_reality := agent_ops.fn_classify_reality(p_has_evidence, p_log_written, p_output_valid);

  if v_reality = 'PRETEND' then
    v_blocked := true;
  end if;

  insert into agent_ops.enforcement_event
    (agent_key, tool_key, action_taken, reality_status, blocked, detail)
  values
    (p_agent_key, p_tool_key,
     case when v_blocked then 'BLOCKED' else 'LOGGED' end,
     v_reality, v_blocked,
     jsonb_build_object(
       'has_evidence', p_has_evidence,
       'log_written',  p_log_written,
       'output_valid', p_output_valid
     ));

  return jsonb_build_object(
    'reality',  v_reality,
    'blocked',  v_blocked,
    'agent',    p_agent_key,
    'tool',     p_tool_key
  );
end;
$$;

-- ── Seed core enforcement rules ────────────────────────────────────────────
insert into agent_ops.enforcement_rule
  (rule_key, description, schema_target, table_target, condition_sql, action, severity)
values
  ('pretend_block',    'Block any execution classified PRETEND',
   'agent_ops', 'enforcement_event', 'reality_status = ''PRETEND''', 'BLOCK', 'CRITICAL'),
  ('no_evidence_alert','Alert when execution has no evidence',
   'agent_ops', 'agent_task_run_log', 'status = ''complete'' and output is null', 'ALERT', 'HIGH'),
  ('orphan_agent',     'Flag agents with no task runs in 7d',
   'agent_ops', 'agent_registry', 'updated_at < now() - interval ''7 days''', 'REMEDIATE', 'MEDIUM')
on conflict (rule_key) do nothing;

-- ── Trigger: updated_at ────────────────────────────────────────────────────
create or replace function agent_ops.fn_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_enforcement_rule_updated_at on agent_ops.enforcement_rule;
create trigger trg_enforcement_rule_updated_at
  before update on agent_ops.enforcement_rule
  for each row execute function agent_ops.fn_set_updated_at();
