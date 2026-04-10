create table if not exists core5_tasks (
  id uuid primary key default gen_random_uuid(),
  title text,
  status text,
  created_at timestamptz default now()
);

create table if not exists core5_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid,
  status text,
  created_at timestamptz default now()
);

create table if not exists core5_agent_visits (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  agent text,
  output jsonb,
  created_at timestamptz default now()
);

create table if not exists core5_outputs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  content jsonb,
  is_final boolean default false,
  created_at timestamptz default now()
);

create table if not exists core5_stage_gates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  gate text,
  status text,
  created_at timestamptz default now()
);
