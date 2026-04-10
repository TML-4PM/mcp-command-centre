create schema if not exists ops;

create table if not exists ops.site_registry (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  group_name text,
  status text check (status in ('LIVE','ACTIVE','READY','HOLD','ARCHIVED')),
  canonical_url text,
  vercel_url text,
  github_repo text,
  lovable_project text,
  supabase_project text,
  s3_prefix text,
  source text,
  reality_status text not null default 'PRETEND',
  health_status text not null default 'UNKNOWN',
  last_checked timestamptz,
  priority_score int not null default 50,
  commercial_status text not null default 'Review',
  revenue_owner text,
  pipeline_stage text,
  estimated_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ops.site_action_queue (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references ops.site_registry(id) on delete cascade,
  slug text,
  action_type text not null,
  severity text not null default 'MEDIUM',
  title text not null,
  detail text,
  status text not null default 'OPEN',
  autofixable boolean not null default false,
  source_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ops.site_autofix_log (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references ops.site_registry(id) on delete cascade,
  slug text,
  violation_code text not null,
  requested_fix text not null,
  action_status text not null default 'QUEUED',
  dry_run boolean not null default true,
  before_state jsonb,
  after_state jsonb,
  result_message text,
  event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function ops.fn_calc_reality(
  p_canonical_url text,
  p_vercel_url text,
  p_github_repo text,
  p_health_status text
)
returns text
language plpgsql
as $$
begin
  if p_canonical_url is not null
     and p_vercel_url is not null
     and p_github_repo is not null
     and coalesce(p_health_status,'UNKNOWN') = 'UP' then
    return 'REAL';
  elseif p_canonical_url is not null
      or p_vercel_url is not null
      or p_github_repo is not null then
    return 'PARTIAL';
  else
    return 'PRETEND';
  end if;
end;
$$;

create or replace function ops.fn_site_registry_before_write()
returns trigger
language plpgsql
as $$
begin
  new.reality_status :=
    ops.fn_calc_reality(
      new.canonical_url,
      new.vercel_url,
      new.github_repo,
      new.health_status
    );
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_site_registry_before_write on ops.site_registry;
create trigger trg_site_registry_before_write
before insert or update on ops.site_registry
for each row execute function ops.fn_site_registry_before_write();

create or replace view ops.v_site_registry as
select * from ops.site_registry;

create or replace view ops.v_site_violations as
select
  r.*,
  case
    when r.github_repo is null then 'NO_GITHUB'
    when r.canonical_url is null then 'NO_PUBLIC'
    when r.vercel_url is null then 'NO_DEPLOY'
    when r.health_status = 'DOWN' then 'HEALTH_DOWN'
    when r.health_status = 'DEGRADED' then 'HEALTH_DEGRADED'
    when r.reality_status <> ops.fn_calc_reality(r.canonical_url, r.vercel_url, r.github_repo, r.health_status) then 'REALITY_DRIFT'
    else null
  end as violation_code
from ops.site_registry r
where
  r.github_repo is null
  or r.canonical_url is null
  or r.vercel_url is null
  or r.health_status in ('DOWN','DEGRADED')
  or r.reality_status <> ops.fn_calc_reality(r.canonical_url, r.vercel_url, r.github_repo, r.health_status);

create or replace view ops.v_site_control_tower as
select
  r.*,
  coalesce((
    select count(*)
    from ops.site_action_queue q
    where q.site_id = r.id
      and q.status in ('OPEN','IN_PROGRESS')
  ), 0) as open_action_count,
  coalesce((
    select count(*)
    from ops.site_autofix_log l
    where l.site_id = r.id
      and l.action_status = 'FAILED'
  ), 0) as failed_autofix_count
from ops.site_registry r;
