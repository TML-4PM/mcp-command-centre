-- =========================================================
-- AHC MASTER SYSTEM PACK v1  (deployment: ahc-full-deploy-v1)
-- Target: S1 (lzfgigiyqpuuxslsygjt) via troy-sql-executor
-- Semantics: ADDITIVE ONLY. No DROP TABLE. No destructive RLS churn.
-- =========================================================

-- ---------- 1. EXTENSIONS ----------
create extension if not exists pgcrypto;

-- ---------- 2. PROFILES IDENTITY EXTENSION (additive) ----------
alter table public.profiles add column if not exists consent_state   text    default 'NONE';
alter table public.profiles add column if not exists lifecycle_stage text    default 'NEW';
alter table public.profiles add column if not exists ahc_agent_id    text;
alter table public.profiles add column if not exists org_id          text;
alter table public.profiles add column if not exists signal_score    numeric default 0;
alter table public.profiles add column if not exists revenue_value   numeric default 0;
alter table public.profiles add column if not exists last_active     timestamptz;

-- ---------- 3. AUTH EVENT LOG ----------
create table if not exists public.auth_event_log (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid,
  email      text,
  status     text        not null,
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists auth_event_log_status_idx  on public.auth_event_log(status, created_at desc);
create index if not exists auth_event_log_user_id_idx on public.auth_event_log(user_id);

-- ---------- 4. USER EVENTS (LifeGraph lite) ----------
create table if not exists public.user_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid,
  event_type  text        not null,
  event_value jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists user_events_user_idx       on public.user_events(user_id, created_at desc);
create index if not exists user_events_event_type_idx on public.user_events(event_type);

-- ---------- 5. AHC JOBS ----------
create table if not exists public.ahc_jobs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid,
  agent_type text        not null,
  input      jsonb,
  output     jsonb,
  status     text        not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ahc_jobs_user_idx    on public.ahc_jobs(user_id, created_at desc);
create index if not exists ahc_jobs_status_idx  on public.ahc_jobs(status) where status in ('PENDING','RUNNING');

-- ---------- 6. VALUE EVENTS (revenue loop) ----------
create table if not exists public.value_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid,
  source     text        not null,
  value      numeric     not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists value_events_user_idx   on public.value_events(user_id, created_at desc);
create index if not exists value_events_source_idx on public.value_events(source);

-- ---------- 7. TRIGGER FUNCTION — schema-correct, exception-safe ----------
-- Existing function was inserting first_name/last_name (do not exist on profiles).
-- Root cause of "Database error saving new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  user_role public.app_role;
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name',''),
    trim(coalesce(new.raw_user_meta_data->>'first_name','') || ' ' || coalesce(new.raw_user_meta_data->>'last_name','')),
    split_part(coalesce(new.email,''),'@',1)
  );

  begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, nullif(v_full_name,''))
    on conflict (id) do update set
      email     = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
  exception when others then
    insert into public.auth_event_log (user_id, email, status, error)
    values (new.id, new.email, 'PROFILE_INSERT_FAILED', sqlerrm);
  end;

  begin
    user_role := coalesce(
      nullif(new.raw_user_meta_data->>'role','')::public.app_role,
      'user'::public.app_role
    );
    insert into public.user_roles (user_id, role)
    values (new.id, user_role)
    on conflict do nothing;
  exception when others then
    insert into public.auth_event_log (user_id, email, status, error)
    values (new.id, new.email, 'ROLE_INSERT_FAILED', sqlerrm);
  end;

  insert into public.auth_event_log (user_id, email, status)
  values (new.id, new.email, 'SUCCESS');

  return new;
exception when others then
  -- Ultimate safety net: never block auth.users insert
  insert into public.auth_event_log (user_id, email, status, error)
  values (new.id, new.email, 'TRIGGER_FATAL', sqlerrm);
  return new;
end;
$function$;

-- ---------- 8. TRIGGER (replace in place — atomic) ----------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------- 9. COMMAND CENTRE VIEWS ----------
create or replace view cc.v_auth_health as
select
  date_trunc('hour', created_at) as hr,
  status,
  count(*) as total
from public.auth_event_log
where created_at > now() - interval '7 days'
group by 1,2
order by 1 desc, 2;

create or replace view cc.v_user_lifecycle as
select
  coalesce(lifecycle_stage,'UNSET') as lifecycle_stage,
  count(*) as total
from public.profiles
group by 1
order by 2 desc;

create or replace view cc.v_value_flow as
select
  source,
  count(*)    as events,
  sum(value)  as total_value,
  max(created_at) as last_event
from public.value_events
group by 1
order by 3 desc nulls last;

-- ---------- 10. BACKFILL: profiles for auth.users without one ----------
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data->>'full_name',''),
    trim(coalesce(u.raw_user_meta_data->>'first_name','') || ' ' || coalesce(u.raw_user_meta_data->>'last_name','')),
    split_part(coalesce(u.email,''),'@',1)
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------- 11. BACKFILL: auth_event_log marker for backfill ----------
insert into public.auth_event_log (user_id, email, status, error)
select u.id, u.email, 'BACKFILLED', 'ahc-full-deploy-v1'
from auth.users u
left join public.auth_event_log l on l.user_id = u.id and l.status in ('SUCCESS','BACKFILLED')
where l.id is null;

-- ---------- 12. DEPLOYMENT RECEIPT ----------
-- Write to t4h_canonical_changes (handled by bridge, not here, to keep pack pure SQL)

-- END OF PACK
