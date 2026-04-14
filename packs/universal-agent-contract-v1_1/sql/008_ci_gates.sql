-- 008_ci_gates.sql
-- UAC v1.1 - CI gate views + fn_ci_health_check
-- Returns machine-readable pass/fail for GitHub Actions gate.

-- ── fn_ci_health_check ─────────────────────────────────────────────────────
-- Returns: { pass: bool, gates: [...], blocker_count: int }
create or replace function agent_ops.fn_ci_health_check()
returns jsonb
language plpgsql
as $$
declare
  v_gates      jsonb := '[]'::jsonb;
  v_blockers   int  := 0;

  v_pretend_24h      int;
  v_critical_issues  int;
  v_enforcement_tbls int;
  v_integrity_tbls   int;
begin
  -- Gate 1: No PRETEND executions in last 24h
  select count(*) into v_pretend_24h
  from agent_ops.enforcement_event
  where reality_status = 'PRETEND'
    and created_at >= now() - interval '24 hours';

  v_gates := v_gates || jsonb_build_object(
    'gate', 'no_pretend_24h',
    'pass', v_pretend_24h = 0,
    'value', v_pretend_24h
  );
  if v_pretend_24h > 0 then v_blockers := v_blockers + 1; end if;

  -- Gate 2: No unresolved CRITICAL integrity issues
  select count(*) into v_critical_issues
  from agent_ops.integrity_issue
  where severity = 'CRITICAL'
    and resolved = false
    and created_at >= now() - interval '48 hours';

  v_gates := v_gates || jsonb_build_object(
    'gate', 'no_critical_integrity_issues',
    'pass', v_critical_issues = 0,
    'value', v_critical_issues
  );
  if v_critical_issues > 0 then v_blockers := v_blockers + 1; end if;

  -- Gate 3: Enforcement tables exist
  select count(*) into v_enforcement_tbls
  from information_schema.tables
  where table_schema = 'agent_ops'
    and table_name in ('enforcement_rule','policy_gate','enforcement_event');

  v_gates := v_gates || jsonb_build_object(
    'gate', 'enforcement_tables_present',
    'pass', v_enforcement_tbls = 3,
    'value', v_enforcement_tbls
  );
  if v_enforcement_tbls < 3 then v_blockers := v_blockers + 1; end if;

  -- Gate 4: Integrity tables exist
  select count(*) into v_integrity_tbls
  from information_schema.tables
  where table_schema = 'agent_ops'
    and table_name in ('integrity_run','integrity_issue');

  v_gates := v_gates || jsonb_build_object(
    'gate', 'integrity_tables_present',
    'pass', v_integrity_tbls = 2,
    'value', v_integrity_tbls
  );
  if v_integrity_tbls < 2 then v_blockers := v_blockers + 1; end if;

  return jsonb_build_object(
    'pass',          v_blockers = 0,
    'blocker_count', v_blockers,
    'gates',         v_gates,
    'checked_at',    now()
  );
end;
$$;

-- ── View: CI gate dashboard ────────────────────────────────────────────────
create or replace view agent_ops.v_ci_gate_status as
select
  (agent_ops.fn_ci_health_check() ->> 'pass')::boolean          as all_pass,
  (agent_ops.fn_ci_health_check() ->> 'blocker_count')::int     as blocker_count,
  agent_ops.fn_ci_health_check() -> 'gates'                     as gates,
  now()                                                          as checked_at;
