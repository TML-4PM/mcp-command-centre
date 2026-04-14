-- Remediation core extracted from UAC

create or replace function ops.fn_run_queued_remediations(p_limit int default 25)
returns jsonb
language plpgsql
as $$
declare
  v_job record;
  v_results jsonb := '[]'::jsonb;
begin
  for v_job in
    select remediation_key
    from ops.agent_remediation_job
    where status = 'queued'
    limit p_limit
  loop
    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'remediation_key', v_job.remediation_key,
        'result', ops.fn_execute_remediation_job(v_job.remediation_key)
      )
    );
  end loop;

  return jsonb_build_object('ok', true, 'results', v_results);
end;
$$;

create or replace function ops.fn_nightly_integrity_and_remediation_sweep()
returns jsonb
language plpgsql
as $$
declare
  v_exec jsonb;
begin
  perform ops.fn_run_agent_integrity_check();
  perform ops.fn_generate_remediation_jobs_from_latest_integrity_run();
  v_exec := ops.fn_run_queued_remediations(50);

  return jsonb_build_object('ok', true, 'execution', v_exec);
end;
$$;
