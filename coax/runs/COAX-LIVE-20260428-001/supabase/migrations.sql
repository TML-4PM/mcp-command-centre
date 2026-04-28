-- COAX Federated Execution tables
create table if not exists coax_thread_registry (
  coax_thread_id text primary key,
  intent text not null,
  status text not null default 'captured',
  reality text not null default 'PARTIAL',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists coax_execution_log (
  id uuid primary key default gen_random_uuid(),
  coax_thread_id text not null references coax_thread_registry(coax_thread_id),
  agent text not null,
  system text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  status text not null default 'queued',
  reality text not null default 'PARTIAL',
  evidence jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists coax_reality_ledger (
  id uuid primary key default gen_random_uuid(),
  coax_thread_id text not null,
  classification text not null,
  evidence jsonb not null default '{}'::jsonb,
  decision text,
  created_at timestamptz default now()
);
