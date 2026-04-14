-- Smoke tests

-- agents
select agent_key from ops_agent_contract.agent_identity limit 10;

-- tools
select tool_key from ops_agent_contract.tool_contract limit 10;

-- write REAL execution
select ops_agent_contract.fn_log_execution(
  'smoke-real-001',
  'verification_specialist',
  'initial_system_validation',
  'troy_sql_executor',
  '{"query":"select 1"}'::jsonb,
  '{"rows":[{"ok":1}]}'::jsonb,
  'verified',
  '[{"type":"sql_result"}]'::jsonb,
  50,0,0,1,null
);

-- integrity
select ops.fn_run_agent_integrity_check();

-- remediation
select ops.fn_generate_remediation_jobs_from_latest_integrity_run();

-- CI
select ops.fn_ci_gate_agent_contract(null);
