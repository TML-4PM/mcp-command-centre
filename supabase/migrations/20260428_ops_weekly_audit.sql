create table if not exists public.ops_weekly_audit (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  summary text not null,
  known_errors jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  drift_items jsonb not null default '[]'::jsonb,
  proof_gaps jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  kill_list jsonb not null default '[]'::jsonb,
  double_down_list jsonb not null default '[]'::jsonb,
  automation_candidates jsonb not null default '[]'::jsonb,
  slack_posted boolean not null default false,
  slack_ts text,
  github_issue_url text,
  created_at timestamptz default now()
);

create table if not exists public.ops_slack_event_queue (
  id uuid primary key default gen_random_uuid(),
  channel_key text not null,
  event_type text not null,
  state text not null check (state in ('FLOW','DRIFT','BLOCKED','OPPORTUNITY','PROOF_GAP')),
  severity int not null default 1,
  title text not null,
  body text not null,
  source text,
  source_url text,
  evidence_links jsonb not null default '[]'::jsonb,
  status text not null default 'queued',
  posted_at timestamptz,
  slack_ts text,
  created_at timestamptz default now()
);