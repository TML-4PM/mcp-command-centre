create table if not exists public.t4h_task_queue (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  title text not null,
  system_area text not null,
  target_object text,
  outcome text,
  priority text not null default 'MEDIUM',
  status text not null default 'OPEN',
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  calendar_event_id text,
  calendar_system text,
  schedule_status text default 'unscheduled',
  source_type text default 'manual',
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.t4h_task_run (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  run_status text not null default 'PENDING',
  started_at timestamptz,
  finished_at timestamptz,
  actor text,
  execution_ref text,
  evidence_ref text,
  truth_state text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.t4h_task_dependency (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  depends_on_task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  dependency_type text not null default 'finish_to_start',
  created_at timestamptz not null default now(),
  unique(task_id, depends_on_task_id)
);
