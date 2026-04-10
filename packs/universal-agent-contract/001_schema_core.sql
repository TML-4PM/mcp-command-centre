create extension if not exists pgcrypto;
create schema if not exists ops;
create schema if not exists ops_agent_contract;

-- minimal standard knowledge tables (safe create)
create table if not exists ops.standard_knowledge_register (
  knowledge_key text primary key,
  knowledge_name text,
  category text,
  subcategory text,
  status text,
  version text,
  summary text,
  canonical_truth boolean,
  enforcement_level text,
  usable_by_agents boolean,
  usable_by_humans boolean,
  source_type text,
  source_ref text,
  notes text,
  owner_domain text,
  updated_at timestamptz default now()
);

create table if not exists ops.standard_knowledge_source_map (
  id uuid primary key default gen_random_uuid(),
  knowledge_key text,
  source_name text,
  source_kind text,
  source_locator text,
  source_priority int,
  active boolean,
  notes text,
  updated_at timestamptz default now()
);

-- agent identity
create table if not exists ops_agent_contract.agent_identity (
  agent_id uuid primary key default gen_random_uuid(),
  agent_key text unique,
  agent_name text,
  agent_role text,
  llm_provider text,
  system_prompt text,
  capabilities jsonb default '{}'::jsonb,
  constraints jsonb default '{}'::jsonb,
  output_format jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tools
create table if not exists ops_agent_contract.tool_contract (
  tool_id uuid primary key default gen_random_uuid(),
  tool_key text unique,
  bridge_function text,
  input_schema jsonb,
  output_schema jsonb,
  risk_level text,
  requires_approval boolean default false
);

-- mapping
create table if not exists ops_agent_contract.agent_tool_map (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  tool_id uuid,
  allowed boolean default true
);

-- jobs
create table if not exists ops_agent_contract.orchestration_job (
  job_id uuid primary key default gen_random_uuid(),
  job_key text unique,
  job_name text,
  status text default 'queued',
  created_at timestamptz default now()
);

-- execution log
create table if not exists ops_agent_contract.agent_execution_log (
  execution_id uuid primary key default gen_random_uuid(),
  execution_key text unique,
  agent_id uuid,
  job_id uuid,
  tool_used text,
  verification_status text,
  reality_status text,
  evidence jsonb,
  created_at timestamptz default now()
);
