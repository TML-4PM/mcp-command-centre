-- Canonical Knowledge Operating System (CKOS)

create table if not exists ops.ckos_knowledge (
  id uuid primary key default gen_random_uuid(),
  name text,
  category text,
  summary text,
  canonical_value text,
  lookup_key text unique,
  stage text,
  confidence text,
  effort text,
  automation_eligible boolean,
  source_type text,
  usage_count int default 0,
  last_used timestamptz,
  owner text,
  last_confirmed timestamptz,
  version text default '1.0',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ops.ckos_gaps (
  id uuid primary key default gen_random_uuid(),
  lookup_key text,
  context text,
  first_seen timestamptz default now(),
  count int default 1,
  suggested_value text,
  status text default 'OPEN'
);

create table if not exists ops.ckos_usage (
  id uuid primary key default gen_random_uuid(),
  lookup_key text,
  used_by text,
  usage_count int default 1,
  last_used timestamptz default now(),
  outcome text
);

create table if not exists ops.ckos_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text,
  lookup_key text
);

create table if not exists ops.ckos_change_log (
  id uuid primary key default gen_random_uuid(),
  lookup_key text,
  old_value text,
  new_value text,
  changed_by text,
  changed_at timestamptz default now()
);

insert into ops.ckos_knowledge (name, category, summary, canonical_value, lookup_key, stage, confidence, automation_eligible)
values
('Bridge Invoke Endpoint','Infra','Main invoke endpoint','https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke','bridge_invoke_endpoint','CRITICAL','High',true),
('SQL Executor','Infra','Primary SQL execution lambda','troy-sql-executor','sql_execution_lambda','CRITICAL','High',true)
on conflict (lookup_key) do nothing;
