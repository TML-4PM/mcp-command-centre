-- Ecosystem Unification Schema

create type ecosystem_state as enum ('RAW','TRIAGE','PARTIAL','VALIDATED','REAL','MONETISED','AUTOMATED','ARCHIVED','BLOCKED');

create table if not exists ecosystem_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  name text,
  source text,
  created_at timestamptz default now()
);

create table if not exists ecosystem_tasks (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references ecosystem_entities(id),
  state ecosystem_state,
  intent text,
  priority text,
  created_at timestamptz default now()
);

create table if not exists ecosystem_executions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references ecosystem_tasks(id),
  status text,
  output jsonb,
  created_at timestamptz default now()
);

create table if not exists ecosystem_receipts (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references ecosystem_executions(id),
  receipt_type text,
  receipt_data jsonb,
  created_at timestamptz default now()
);

create table if not exists reality_ledger (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid,
  classification text,
  evidence jsonb,
  created_at timestamptz default now()
);

-- simple view
create view ecosystem_status as
select e.name, t.state, x.status
from ecosystem_entities e
left join ecosystem_tasks t on e.id = t.entity_id
left join ecosystem_executions x on t.id = x.task_id;
