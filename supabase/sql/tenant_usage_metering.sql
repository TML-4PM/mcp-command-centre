create table if not exists tenant_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  request_id text,
  query_type text,
  cost_estimate numeric,
  blocked boolean,
  created_at timestamptz default now()
);
