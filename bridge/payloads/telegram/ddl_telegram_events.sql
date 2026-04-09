create table if not exists public.telegram_events (
  id uuid primary key default gen_random_uuid(),
  telegram_update_id bigint,
  chat_id text not null,
  user_id text,
  username text,
  message_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','done','ignored','error')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_telegram_events_chat_id on public.telegram_events(chat_id);
create index if not exists idx_telegram_events_status on public.telegram_events(status);
create index if not exists idx_telegram_events_created_at on public.telegram_events(created_at desc);
