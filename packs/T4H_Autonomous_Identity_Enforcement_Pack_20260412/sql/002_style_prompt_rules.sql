begin;

create schema if not exists t4h_control;

create table if not exists t4h_control.t4h_style_enforcement (
  rule_id uuid primary key default gen_random_uuid(),
  rule_group text not null default 'global',
  rule_type text not null check (rule_type in ('banned_word','banned_phrase','banned_structure','tone_violation','rewrite_hint','threshold')),
  pattern text not null,
  severity int not null default 10,
  replacement text,
  enforcement_mode text not null default 'score' check (enforcement_mode in ('score','warn','block','rewrite')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists t4h_control.t4h_prompt_contract (
  contract_id uuid primary key default gen_random_uuid(),
  contract_key text not null unique,
  intent text not null,
  success_criteria jsonb not null default '[]'::jsonb,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  autonomy_level text not null default 'AUTONOMOUS',
  validation_rules jsonb not null default '[]'::jsonb,
  enforcement_rules jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists t4h_control.t4h_global_rules (
  rule_id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  rule_name text not null unique,
  rule_text text not null,
  enforcement_type text not null check (enforcement_type in ('block','warn','rewrite','log')),
  priority int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_t4h_style_enforcement_active on t4h_control.t4h_style_enforcement(is_active, rule_type, rule_group);
create index if not exists idx_t4h_prompt_contract_active on t4h_control.t4h_prompt_contract(is_active, contract_key);
create index if not exists idx_t4h_global_rules_active on t4h_control.t4h_global_rules(is_active, scope, priority);

create trigger trg_t4h_style_enforcement_updated_at
before update on t4h_control.t4h_style_enforcement
for each row execute function t4h_control.set_updated_at();

create trigger trg_t4h_prompt_contract_updated_at
before update on t4h_control.t4h_prompt_contract
for each row execute function t4h_control.set_updated_at();

create trigger trg_t4h_global_rules_updated_at
before update on t4h_control.t4h_global_rules
for each row execute function t4h_control.set_updated_at();

insert into t4h_control.t4h_style_enforcement (rule_group, rule_type, pattern, severity, replacement, enforcement_mode)
values
  ('global','banned_phrase','leverage synergy',20,'use direct language','rewrite'),
  ('global','banned_phrase','delve',15,'use explain or examine','rewrite'),
  ('global','banned_phrase','fast-paced landscape',15,'remove filler phrase','rewrite'),
  ('global','banned_phrase','game-changing',15,'describe the actual impact','rewrite'),
  ('global','banned_structure','^Short answer:',20,'remove opener','block'),
  ('global','banned_structure','^Short version:',20,'remove opener','block'),
  ('global','banned_structure','^If you want',15,'state the next move directly','rewrite'),
  ('global','threshold','minimum_style_score',70,null,'block')
on conflict do nothing;

insert into t4h_control.t4h_prompt_contract (
  contract_key,
  intent,
  success_criteria,
  input_schema,
  output_schema,
  autonomy_level,
  validation_rules,
  enforcement_rules,
  is_active
)
values (
  't4h-default-autonomous',
  'complete task to final operational state without clarification loop when context is sufficient',
  '["production-ready output","no missing core layers","evidence-aware","bridge-compatible"]'::jsonb,
  '{"required":["intent"],"optional":["success_criteria","constraints","context"]}'::jsonb,
  '{"required":["result","status"],"optional":["evidence","telemetry","artifacts"]}'::jsonb,
  'AUTONOMOUS',
  '["style score must be above threshold","must not use banned openers","must respect autonomy rules"]'::jsonb,
  '["run style filter","log execution result","bind for telemetry"]'::jsonb,
  true
)
on conflict (contract_key) do update
set intent = excluded.intent,
    success_criteria = excluded.success_criteria,
    input_schema = excluded.input_schema,
    output_schema = excluded.output_schema,
    autonomy_level = excluded.autonomy_level,
    validation_rules = excluded.validation_rules,
    enforcement_rules = excluded.enforcement_rules,
    is_active = excluded.is_active,
    updated_at = now();

insert into t4h_control.t4h_global_rules (scope, rule_name, rule_text, enforcement_type, priority, is_active)
values
  ('global','no_clarification_loop_default','Do not ask clarifying questions when sufficient context exists for safe execution.','warn',10,true),
  ('global','full_end_state_required','Default output should aim at final operational state, not the next fragment.','warn',20,true),
  ('global','evidence_before_reality','A build cannot be REAL without evidence binding.','log',30,true),
  ('global','distribution_is_part_of_done','A system is incomplete if it is built but not wired for use or distribution.','log',40,true)
on conflict (rule_name) do update
set rule_text = excluded.rule_text,
    enforcement_type = excluded.enforcement_type,
    priority = excluded.priority,
    is_active = excluded.is_active,
    updated_at = now();

commit;
