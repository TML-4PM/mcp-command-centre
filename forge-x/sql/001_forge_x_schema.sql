-- FORGE-X SCHEMA

create table if not exists forge_assets_raw (
  id uuid primary key default gen_random_uuid(),
  source text,
  source_id text,
  session_id text,
  content_type text,
  content text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists forge_assets (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid,
  asset_type text,
  title text,
  summary text,
  language text,
  confidence float,
  tags text[],
  linked_asset_ids uuid[],
  created_at timestamptz default now()
);

create table if not exists forge_assets_reconstructed (
  id uuid primary key default gen_random_uuid(),
  base_asset_ids uuid[],
  reconstructed_content text,
  completeness_score float,
  status text
);

create table if not exists forge_reality_ledger (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid,
  claim text,
  status text,
  evidence jsonb,
  checked_at timestamptz default now()
);

create table if not exists forge_execution_queue (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid,
  action text,
  priority int,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists forge_asset_value (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid,
  value_score float,
  reuse_score float,
  revenue_score float,
  recommended_action text
);
