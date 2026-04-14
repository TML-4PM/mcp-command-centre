create table if not exists runtime.orchestration_queue (
  id uuid primary key default gen_random_uuid(),
  orchestration_key text not null,
  agent_key text,
  subject_object_key text,
  task_type text,
  payload jsonb,
  status public.lifecycle_state default 'queued',
  priority int default 5,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);