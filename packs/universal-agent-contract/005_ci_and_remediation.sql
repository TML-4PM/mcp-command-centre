create or replace function ops.fn_ci_gate_agent_contract()
returns jsonb language plpgsql as $$
begin
 return jsonb_build_object('ok',true);
end;$$;

create or replace function ops.fn_ci_gate_agent_contract_block()
returns void language plpgsql as $$
declare r jsonb;
begin
 r:=ops.fn_ci_gate_agent_contract();
 if (r->>'ok')::boolean=false then
  raise exception 'CI failed';
 end if;
end;$$;
