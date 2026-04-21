create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz default now(),
  to_addr text,
  subject text,
  has_html boolean,
  has_text boolean,
  source text,
  message_id text
);
