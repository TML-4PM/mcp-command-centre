create schema if not exists intel;

create table if not exists intel.notes (
  id uuid primary key default gen_random_uuid(),
  source text,
  raw_text text,
  summary text,
  tags text[],
  created_at timestamptz default now()
);

create table if not exists intel.assumptions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references intel.notes(id),
  assumption text,
  challenge text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists intel.email_events (
  id uuid primary key default gen_random_uuid(),
  sender text,
  subject text,
  body text,
  processed boolean default false,
  created_at timestamptz default now()
);

create table if not exists intel.decisions (
  id uuid primary key default gen_random_uuid(),
  context text,
  options jsonb,
  decision text,
  rationale text,
  created_at timestamptz default now()
);
