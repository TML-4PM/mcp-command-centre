-- reality_ledger.sql
-- T4H MCP Command Centre — Wave10 Reality Ledger
-- RDTI tagged | idempotent | RLS-ready

create table if not exists reality_ledger (
  id               uuid primary key default gen_random_uuid(),
  entity_id        text not null,
  entity_type      text not null,
  wave             text not null default 'wave10',
  status           text not null check (status in ('REAL','PARTIAL','PRETEND')),
  runtime_proof    jsonb,
  evidence_url     text,
  verified_by      text,
  verified_at      timestamptz,
  is_rd            boolean not null default true,
  project_code     text not null default 'T4H-INFRA',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_reality_ledger_entity_id on reality_ledger(entity_id);
create index if not exists idx_reality_ledger_status    on reality_ledger(status);

alter table reality_ledger enable row level security;
