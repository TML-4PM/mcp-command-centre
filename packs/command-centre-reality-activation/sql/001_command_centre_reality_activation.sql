create extension if not exists pgcrypto;

create schema if not exists cc;
create schema if not exists ops;

create table if not exists public.reality_ledger (
  id uuid primary key default gen_random_uuid()
);

alter table public.reality_ledger add column if not exists system text;
alter table public.reality_ledger add column if not exists component text;
alter table public.reality_ledger add column if not exists status text;
alter table public.reality_ledger add column if not exists evidence jsonb default '{}'::jsonb;
alter table public.reality_ledger add column if not exists last_verified timestamptz default now();
alter table public.reality_ledger add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reality_ledger_status_check'
  ) then
    alter table public.reality_ledger
      add constraint reality_ledger_status_check
      check (status in ('REAL','PARTIAL','PRETEND'));
  end if;
end $$;

create table if not exists public.reality_verification_jobs (
  id uuid primary key default gen_random_uuid()
);

alter table public.reality_verification_jobs add column if not exists system text;
alter table public.reality_verification_jobs add column if not exists component text;
alter table public.reality_verification_jobs add column if not exists expected_check text;
alter table public.reality_verification_jobs add column if not exists check_query text;
alter table public.reality_verification_jobs add column if not exists expected_result jsonb default '{}'::jsonb;
alter table public.reality_verification_jobs add column if not exists last_result jsonb default '{}'::jsonb;
alter table public.reality_verification_jobs add column if not exists status text default 'UNKNOWN';
alter table public.reality_verification_jobs add column if not exists last_run timestamptz;
alter table public.reality_verification_jobs add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reality_verification_jobs_status_check'
  ) then
    alter table public.reality_verification_jobs
      add constraint reality_verification_jobs_status_check
      check (status in ('PASS','FAIL','UNKNOWN'));
  end if;
end $$;

create table if not exists public.deployment_gates (
  stage text primary key
);

alter table public.deployment_gates add column if not exists required_previous text[] default '{}'::text[];
alter table public.deployment_gates add column if not exists status text default 'LOCKED';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'deployment_gates_status_check'
  ) then
    alter table public.deployment_gates
      add constraint deployment_gates_status_check
      check (status in ('LOCKED','READY','DONE'));
  end if;
end $$;

insert into public.deployment_gates (stage, required_previous, status)
values
  ('telemetry', '{}'::text[], 'READY'),
  ('dashboard', '{telemetry}'::text[], 'LOCKED'),
  ('api', '{dashboard}'::text[], 'LOCKED'),
  ('ui', '{api}'::text[], 'LOCKED')
on conflict (stage) do update
set required_previous = excluded.required_previous;

create table if not exists public.artifact_registry (
  id uuid primary key default gen_random_uuid()
);

alter table public.artifact_registry add column if not exists name text;
alter table public.artifact_registry add column if not exists type text;
alter table public.artifact_registry add column if not exists version text;
alter table public.artifact_registry add column if not exists location text;
alter table public.artifact_registry add column if not exists checksum text;
alter table public.artifact_registry add column if not exists deployed boolean default false;
alter table public.artifact_registry add column if not exists deployed_at timestamptz;
alter table public.artifact_registry add column if not exists updated_at timestamptz default now();

update public.artifact_registry
set deployed = false
where deployed is null;

create table if not exists public.command_centre_intents (
  id uuid primary key default gen_random_uuid()
);

alter table public.command_centre_intents add column if not exists intent text;
alter table public.command_centre_intents add column if not exists target_system text;
alter table public.command_centre_intents add column if not exists action text;
alter table public.command_centre_intents add column if not exists payload jsonb default '{}'::jsonb;
alter table public.command_centre_intents add column if not exists status text default 'QUEUED';
alter table public.command_centre_intents add column if not exists created_at timestamptz default now();
alter table public.command_centre_intents add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'command_centre_intents_status_check'
  ) then
    alter table public.command_centre_intents
      add constraint command_centre_intents_status_check
      check (status in ('QUEUED','RUNNING','DONE','FAILED'));
  end if;
end $$;

create table if not exists public.system_feedback_actions (
  id uuid primary key default gen_random_uuid()
);

alter table public.system_feedback_actions add column if not exists source_view text;
alter table public.system_feedback_actions add column if not exists condition text;
alter table public.system_feedback_actions add column if not exists action_type text;
alter table public.system_feedback_actions add column if not exists action_payload jsonb default '{}'::jsonb;
alter table public.system_feedback_actions add column if not exists status text default 'PENDING';
alter table public.system_feedback_actions add column if not exists updated_at timestamptz default now();

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reality_ledger_updated_at on public.reality_ledger;
create trigger trg_reality_ledger_updated_at
before update on public.reality_ledger
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_rvj_updated_at on public.reality_verification_jobs;
create trigger trg_rvj_updated_at
before update on public.reality_verification_jobs
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_artifact_registry_updated_at on public.artifact_registry;
create trigger trg_artifact_registry_updated_at
before update on public.artifact_registry
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_cci_updated_at on public.command_centre_intents;
create trigger trg_cci_updated_at
before update on public.command_centre_intents
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_sfa_updated_at on public.system_feedback_actions;
create trigger trg_sfa_updated_at
before update on public.system_feedback_actions
for each row execute function public.fn_set_updated_at();

create unique index if not exists uq_reality_ledger_system_component
on public.reality_ledger(system, component);

create unique index if not exists uq_rvj_system_component_check
on public.reality_verification_jobs(system, component, expected_check);

create index if not exists idx_artifact_registry_deployed
on public.artifact_registry(deployed);

create or replace function public.fn_run_verification()
returns void
language plpgsql
as $$
declare
  r record;
  result jsonb;
begin
  for r in select * from public.reality_verification_jobs loop
    begin
      execute r.check_query into result;

      update public.reality_verification_jobs
      set
        last_result = coalesce(result, '{}'::jsonb),
        status = case
          when coalesce(result, '{}'::jsonb) = coalesce(r.expected_result, '{}'::jsonb) then 'PASS'
          else 'FAIL'
        end,
        last_run = now()
      where id = r.id;

      insert into public.reality_ledger (
        system,
        component,
        status,
        evidence,
        last_verified
      )
      values (
        r.system,
        r.component,
        case
          when coalesce(result, '{}'::jsonb) = coalesce(r.expected_result, '{}'::jsonb) then 'REAL'
          else 'PARTIAL'
        end,
        jsonb_build_object(
          'expected_check', r.expected_check,
          'result', coalesce(result, '{}'::jsonb),
          'expected_result', coalesce(r.expected_result, '{}'::jsonb),
          'verified_at', now()
        ),
        now()
      )
      on conflict (system, component)
      do update set
        status = excluded.status,
        evidence = excluded.evidence,
        last_verified = excluded.last_verified,
        updated_at = now();

    exception when others then
      update public.reality_verification_jobs
      set
        status = 'FAIL',
        last_result = jsonb_build_object('error', sqlerrm, 'failed_at', now()),
        last_run = now()
      where id = r.id;

      insert into public.reality_ledger (
        system,
        component,
        status,
        evidence,
        last_verified
      )
      values (
        r.system,
        r.component,
        'PARTIAL',
        jsonb_build_object('error', sqlerrm, 'expected_check', r.expected_check, 'failed_at', now()),
        now()
      )
      on conflict (system, component)
      do update set
        status = 'PARTIAL',
        evidence = excluded.evidence,
        last_verified = excluded.last_verified,
        updated_at = now();
    end;
  end loop;
end;
$$;

create or replace function public.fn_refresh_deployment_gates()
returns void
language plpgsql
as $$
declare
  gate_rec record;
  all_done boolean;
begin
  for gate_rec in
    select * from public.deployment_gates where cardinality(required_previous) > 0
  loop
    select bool_and(status = 'DONE') into all_done
    from public.deployment_gates
    where stage = any(gate_rec.required_previous);

    update public.deployment_gates
    set status = case
      when status = 'DONE' then 'DONE'
      when coalesce(all_done, false) then 'READY'
      else 'LOCKED'
    end
    where stage = gate_rec.stage;
  end loop;
end;
$$;

create or replace view cc.v_critical_alert_stack as
select id, source_view, condition, action_type, action_payload, status, updated_at
from public.system_feedback_actions
where coalesce(status, 'PENDING') in ('PENDING','FAILED')
order by updated_at desc nulls last, id desc;

create or replace view cc.v_todays_action_queue as
select id, intent, target_system, action, payload, status, created_at, updated_at
from public.command_centre_intents
where created_at::date = (now() at time zone 'Australia/Sydney')::date
order by created_at desc;

create or replace view cc.v_missing_evidence_board as
select id, system, component, status, evidence, last_verified, updated_at
from public.reality_ledger
where coalesce(status, 'PRETEND') <> 'REAL'
order by last_verified asc nulls first, updated_at desc;

create or replace view cc.v_environment_drift_detector as
select id, name, type, version, location, checksum, coalesce(deployed, false) as deployed, deployed_at, updated_at
from public.artifact_registry
where coalesce(deployed, false) = false
order by updated_at desc nulls last, id desc;

create or replace view cc.v_registry_drift as
select id, system, component, expected_check, status, expected_result, last_result, last_run, updated_at
from public.reality_verification_jobs
where coalesce(status, 'UNKNOWN') <> 'PASS'
order by last_run asc nulls first, updated_at desc;

insert into public.reality_verification_jobs (
  system,
  component,
  expected_check,
  check_query,
  expected_result,
  status
)
select
  'command-centre',
  'dashboard-core',
  'basic_select',
  $$select to_jsonb(1)$$,
  '1'::jsonb,
  'UNKNOWN'
where not exists (
  select 1
  from public.reality_verification_jobs
  where system = 'command-centre'
    and component = 'dashboard-core'
    and expected_check = 'basic_select'
);

select public.fn_run_verification();
select public.fn_refresh_deployment_gates();
