create table if not exists ops.cross_llm_handoff (
  id uuid primary key default gen_random_uuid(),
  handoff_key text not null unique,
  source_provider text not null,
  target_provider text not null,
  subject_object_key text,
  prompt text,
  response_summary text,
  status public.lifecycle_state default 'queued',
  created_at timestamptz default now(),
  completed_at timestamptz
);