insert into ops.standard_knowledge_register (knowledge_key,knowledge_name,status,version,canonical_truth)
values ('universal_agent_contract_v1_1','Universal Agent Contract','active','1.1',true)
on conflict do nothing;

-- enforcement audit
create table if not exists ops.bridge_enforcement_audit (
  audit_id uuid primary key default gen_random_uuid(),
  agent_key text,
  tool_key text,
  decision text,
  created_at timestamptz default now()
);

-- enforcement rule
create table if not exists ops.agent_build_enforcement_rule (
  rule_key text primary key,
  severity text,
  required boolean
);
