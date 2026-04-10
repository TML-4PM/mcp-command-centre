begin;

create or replace function synal.rpc_ingest_signal(p_asset_key text, p_source text, p_payload jsonb, p_dedupe_key text default null)
returns uuid
language plpgsql
as $$
declare v_asset_id uuid; v_signal_id uuid;
begin
  select id into v_asset_id from synal.asset_registry where asset_key = p_asset_key;
  if v_asset_id is null then
    raise exception 'asset_key not found: %', p_asset_key;
  end if;
  insert into synal.signal(asset_id, source, payload, dedupe_key)
  values (v_asset_id, p_source, coalesce(p_payload,'{}'::jsonb), p_dedupe_key)
  returning id into v_signal_id;
  return v_signal_id;
end; $$;

create or replace function synal.rpc_create_task(p_signal_id uuid, p_intent text, p_payload jsonb)
returns uuid
language plpgsql
as $$
declare v_asset_id uuid; v_task_id uuid;
begin
  select asset_id into v_asset_id from synal.signal where id = p_signal_id;
  insert into synal.task(signal_id, asset_id, intent, payload)
  values (p_signal_id, v_asset_id, p_intent, coalesce(p_payload,'{}'::jsonb))
  returning id into v_task_id;
  return v_task_id;
end; $$;

create or replace function synal.rpc_start_flow(p_task_id uuid, p_flow_type text, p_payload jsonb)
returns uuid
language plpgsql
as $$
declare v_asset_id uuid; v_flow_id uuid;
begin
  select asset_id into v_asset_id from synal.task where id = p_task_id;
  insert into synal.flow(task_id, asset_id, flow_type, payload, started_at)
  values (p_task_id, v_asset_id, p_flow_type, coalesce(p_payload,'{}'::jsonb), now())
  returning id into v_flow_id;
  return v_flow_id;
end; $$;

create or replace function synal.rpc_record_action(p_flow_id uuid, p_action_type text, p_executor text, p_req jsonb, p_res jsonb)
returns uuid
language plpgsql
as $$
declare v_asset_id uuid; v_action_id uuid;
begin
  select asset_id into v_asset_id from synal.flow where id = p_flow_id;
  insert into synal.action(flow_id, asset_id, action_type, executor, request_payload, response_payload, executed_at)
  values (p_flow_id, v_asset_id, p_action_type, p_executor, coalesce(p_req,'{}'::jsonb), coalesce(p_res,'{}'::jsonb), now())
  returning id into v_action_id;
  return v_action_id;
end; $$;

create or replace function synal.rpc_record_proof(p_action_id uuid, p_class synal.reality_status, p_evidence jsonb)
returns uuid
language plpgsql
as $$
declare v_asset_id uuid; v_proof_id uuid;
begin
  select asset_id into v_asset_id from synal.action where id = p_action_id;
  insert into synal.proof(action_id, asset_id, classification, evidence)
  values (p_action_id, v_asset_id, p_class, coalesce(p_evidence,'{}'::jsonb))
  returning id into v_proof_id;
  return v_proof_id;
end; $$;

commit;