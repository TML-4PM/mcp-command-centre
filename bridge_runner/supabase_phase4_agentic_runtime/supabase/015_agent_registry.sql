create table if not exists ops.agent_registry (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null unique,
  agent_name text not null,
  agent_type text,
  capability_tags text[],
  llm_provider text,
  lifecycle_state public.lifecycle_state default 'queued',
  last_active_at timestamptz,
  owner_role text,
  subject_object_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);