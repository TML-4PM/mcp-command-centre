-- bootstrap job
insert into ops_agent_contract.orchestration_job (job_key,job_name)
values ('initial_system_validation','Initial System Validation')
on conflict do nothing;

-- smoke test
select ops_agent_contract.fn_classify_reality('verified','[{"ok":1}]'::jsonb);
select ops.fn_run_agent_integrity_check();
