-- seed agents
insert into ops_agent_contract.agent_identity (agent_key,agent_name,agent_role,llm_provider,system_prompt)
values
('solution_architect','Solution Architect','design','multi','design systems'),
('builder_agent','Builder Agent','execute','multi','execute tasks'),
('verification_specialist','Verification Specialist','verify','multi','verify outputs')
on conflict do nothing;

-- seed tools
insert into ops_agent_contract.tool_contract (tool_key,bridge_function,input_schema,output_schema,risk_level)
values
('troy_sql_executor','troy-sql-executor','{}','{}','medium'),
('troy_code_pusher','troy-code-pusher','{}','{}','high')
on conflict do nothing;

-- simple runtime fn
create or replace function ops_agent_contract.fn_classify_reality(v text, e jsonb)
returns text language plpgsql as $$
begin
  if v='verified' and jsonb_array_length(coalesce(e,'[]'::jsonb))>0 then return 'REAL';
  elsif v='failed' then return 'PRETEND';
  else return 'PARTIAL'; end if;
end;$$;
