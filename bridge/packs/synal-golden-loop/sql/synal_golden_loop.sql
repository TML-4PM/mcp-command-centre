-- Synal Golden Loop schema

create table if not exists synal_lambda_registry (
  id uuid primary key default gen_random_uuid(),
  function_name text unique,
  classification text default 'UNKNOWN',
  is_callable boolean default false,
  last_seen timestamptz default now()
);

create table if not exists synal_execution_log (
  id uuid primary key default gen_random_uuid(),
  function_name text,
  status text,
  response jsonb,
  error text,
  executed_at timestamptz default now()
);

create table if not exists synal_reality_ledger (
  id uuid primary key default gen_random_uuid(),
  intent text,
  function_name text,
  classification text,
  evidence jsonb,
  created_at timestamptz default now()
);

create table if not exists synal_drift_log (
  id uuid primary key default gen_random_uuid(),
  drift_type text,
  resource text,
  details jsonb,
  detected_at timestamptz default now()
);

create table if not exists synal_replay_queue (
  id uuid primary key default gen_random_uuid(),
  function_name text,
  payload jsonb,
  status text default 'PENDING'
);

create table if not exists synal_ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  source text,
  tool_name text,
  action text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists synal_knowledge_store (
  id uuid primary key default gen_random_uuid(),
  source text,
  content jsonb,
  created_at timestamptz default now()
);