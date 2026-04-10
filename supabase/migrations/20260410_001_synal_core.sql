begin;

create extension if not exists pgcrypto;

create schema if not exists synal;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'asset_category' and n.nspname = 'synal'
  ) then
    create type synal.asset_category as enum (
      'browser',
      'widgets',
      'apps',
      'extensions',
      'agents',
      'augmentation',
      'services'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'primitive_type' and n.nspname = 'synal'
  ) then
    create type synal.primitive_type as enum (
      'signal',
      'task',
      'flow',
      'action',
      'proof',
      'command'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'runtime_status' and n.nspname = 'synal'
  ) then
    create type synal.runtime_status as enum (
      'UNREGISTERED',
      'REGISTERED',
      'WIRED',
      'ACTIVE',
      'PROVING',
      'REAL',
      'ERROR',
      'STALLED',
      'PRETEND'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'reality_status' and n.nspname = 'synal'
  ) then
    create type synal.reality_status as enum (
      'REAL',
      'PARTIAL',
      'PRETEND'
    );
  end if;
end $$;

create table if not exists synal.asset_registry (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  name text not null,
  category synal.asset_category not null,
  primitive_start synal.primitive_type not null,
  primitive_end synal.primitive_type not null,
  status synal.runtime_status not null default 'REGISTERED',
  reality_status synal.reality_status not null default 'PRETEND',
  wired boolean not null default false,
  execution_ready boolean not null default false,
  source_system text,
  owner text,
  business_key text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  last_signal_at timestamptz,
  last_action_at timestamptz,
  last_proof_at timestamptz,
  signal_count integer not null default 0,
  task_count integer not null default 0,
  flow_count integer not null default 0,
  action_count integer not null default 0,
  proof_count integer not null default 0,
  health_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint synal_asset_registry_owner_chk check (coalesce(trim(owner), '') <> ''),
  constraint synal_asset_registry_key_chk check (coalesce(trim(asset_key), '') <> ''),
  constraint synal_asset_registry_name_chk check (coalesce(trim(name), '') <> '')
);

create table if not exists synal.signal (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references synal.asset_registry(id) on delete cascade,
  source text not null,
  source_ref text,
  payload jsonb not null default '{}'::jsonb,
  identity_key text,
  dedupe_key text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists synal_signal_dedupe_idx
on synal.signal (dedupe_key)
where dedupe_key is not null;

create table if not exists synal.task (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references synal.signal(id) on delete cascade,
  asset_id uuid not null references synal.asset_registry(id) on delete cascade,
  intent text not null,
  task_type text,
  status synal.runtime_status not null default 'REGISTERED',
  rejection_reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists synal.flow (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references synal.task(id) on delete cascade,
  asset_id uuid not null references synal.asset_registry(id) on delete cascade,
  flow_type text not null,
  status synal.runtime_status not null default 'REGISTERED',
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists synal.action (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references synal.flow(id) on delete cascade,
  asset_id uuid not null references synal.asset_registry(id) on delete cascade,
  action_type text not null,
  executor text,
  status synal.runtime_status not null default 'REGISTERED',
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  external_ref text,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists synal.proof (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references synal.action(id) on delete cascade,
  asset_id uuid not null references synal.asset_registry(id) on delete cascade,
  classification synal.reality_status not null,
  evidence jsonb not null default '{}'::jsonb,
  evidence_hash text,
  created_at timestamptz not null default now()
);

create table if not exists synal.command (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references synal.asset_registry(id) on delete set null,
  target_type text not null,
  target_id uuid,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  issued_by text,
  status synal.runtime_status not null default 'REGISTERED',
  issued_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists synal.value (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references synal.flow(id) on delete cascade,
  asset_id uuid references synal.asset_registry(id) on delete set null,
  revenue numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  margin numeric(12,2) generated always as (revenue - cost) stored,
  currency text not null default 'AUD',
  created_at timestamptz not null default now()
);

create table if not exists synal.event_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  asset_id uuid references synal.asset_registry(id) on delete set null,
  related_id uuid,
  related_table text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function synal.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists synal_asset_registry_set_updated_at on synal.asset_registry;
create trigger synal_asset_registry_set_updated_at
before update on synal.asset_registry
for each row execute function synal.set_updated_at();

drop trigger if exists synal_task_set_updated_at on synal.task;
create trigger synal_task_set_updated_at
before update on synal.task
for each row execute function synal.set_updated_at();

drop trigger if exists synal_flow_set_updated_at on synal.flow;
create trigger synal_flow_set_updated_at
before update on synal.flow
for each row execute function synal.set_updated_at();

drop trigger if exists synal_action_set_updated_at on synal.action;
create trigger synal_action_set_updated_at
before update on synal.action
for each row execute function synal.set_updated_at();

create or replace function synal.touch_asset_counters()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'signal' then
    update synal.asset_registry
       set signal_count = signal_count + 1,
           last_signal_at = now(),
           status = case when status = 'REGISTERED' then 'WIRED' else status end
     where id = new.asset_id;
  elsif tg_table_name = 'task' then
    update synal.asset_registry
       set task_count = task_count + 1,
           status = case when status in ('REGISTERED','WIRED') then 'ACTIVE' else status end
     where id = new.asset_id;
  elsif tg_table_name = 'flow' then
    update synal.asset_registry
       set flow_count = flow_count + 1,
           status = case when status in ('REGISTERED','WIRED') then 'ACTIVE' else status end
     where id = new.asset_id;
  elsif tg_table_name = 'action' then
    update synal.asset_registry
       set action_count = action_count + 1,
           last_action_at = coalesce(new.executed_at, now()),
           status = case when status in ('REGISTERED','WIRED','ACTIVE') then 'PROVING' else status end
     where id = new.asset_id;
  elsif tg_table_name = 'proof' then
    update synal.asset_registry
       set proof_count = proof_count + 1,
           last_proof_at = now(),
           reality_status = new.classification,
           status = case when new.classification = 'REAL' then 'REAL'
                         when new.classification = 'PARTIAL' then 'PROVING'
                         else 'PRETEND' end
     where id = new.asset_id;
  end if;

  return new;
end;
$$;

drop trigger if exists synal_signal_touch_asset on synal.signal;
create trigger synal_signal_touch_asset
after insert on synal.signal
for each row execute function synal.touch_asset_counters();

drop trigger if exists synal_task_touch_asset on synal.task;
create trigger synal_task_touch_asset
after insert on synal.task
for each row execute function synal.touch_asset_counters();

drop trigger if exists synal_flow_touch_asset on synal.flow;
create trigger synal_flow_touch_asset
after insert on synal.flow
for each row execute function synal.touch_asset_counters();

drop trigger if exists synal_action_touch_asset on synal.action;
create trigger synal_action_touch_asset
after insert on synal.action
for each row execute function synal.touch_asset_counters();

drop trigger if exists synal_proof_touch_asset on synal.proof;
create trigger synal_proof_touch_asset
after insert on synal.proof
for each row execute function synal.touch_asset_counters();

create or replace function synal.enforce_action_has_proof()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('REAL', 'PROVING') then
    if not exists (
      select 1
      from synal.proof p
      where p.action_id = new.id
    ) then
      update synal.asset_registry
         set reality_status = 'PRETEND',
             status = 'PRETEND'
       where id = new.asset_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists synal_action_enforce_proof on synal.action;
create trigger synal_action_enforce_proof
after update on synal.action
for each row execute function synal.enforce_action_has_proof();

create or replace view synal.v_home_summary as
select
  category,
  count(*) as total_assets,
  count(*) filter (where wired) as wired_assets,
  count(*) filter (where execution_ready) as execution_ready_assets,
  count(*) filter (where reality_status = 'REAL') as real_assets,
  count(*) filter (where reality_status = 'PARTIAL') as partial_assets,
  count(*) filter (where reality_status = 'PRETEND') as pretend_assets,
  max(greatest(
    coalesce(last_signal_at, 'epoch'::timestamptz),
    coalesce(last_action_at, 'epoch'::timestamptz),
    coalesce(last_proof_at, 'epoch'::timestamptz)
  )) as last_activity_at,
  round(avg(health_score), 2) as avg_health_score
from synal.asset_registry
group by category
order by category;

create or replace view synal.v_triage as
select
  ar.id,
  ar.asset_key,
  ar.name,
  ar.category,
  ar.primitive_start,
  ar.primitive_end,
  ar.status,
  ar.reality_status,
  ar.wired,
  ar.execution_ready,
  ar.signal_count,
  ar.task_count,
  ar.flow_count,
  ar.action_count,
  ar.proof_count,
  ar.last_signal_at,
  ar.last_action_at,
  ar.last_proof_at,
  case
    when ar.proof_count = 0 and ar.action_count > 0 then 'NO_PROOF'
    when ar.signal_count > 0 and ar.task_count = 0 then 'SIGNAL_ORPHAN'
    when ar.wired = false then 'UNWIRED'
    when ar.execution_ready = false then 'NOT_READY'
    when ar.reality_status = 'PRETEND' then 'PRETEND'
    else 'HEALTHY'
  end as triage_state,
  ar.owner,
  ar.source_system,
  ar.business_key,
  ar.health_score
from synal.asset_registry ar;

create index if not exists synal_asset_registry_category_idx on synal.asset_registry(category);
create index if not exists synal_asset_registry_status_idx on synal.asset_registry(status);
create index if not exists synal_asset_registry_reality_idx on synal.asset_registry(reality_status);
create index if not exists synal_signal_asset_idx on synal.signal(asset_id, received_at desc);
create index if not exists synal_task_asset_idx on synal.task(asset_id, created_at desc);
create index if not exists synal_flow_asset_idx on synal.flow(asset_id, created_at desc);
create index if not exists synal_action_asset_idx on synal.action(asset_id, created_at desc);
create index if not exists synal_proof_asset_idx on synal.proof(asset_id, created_at desc);

insert into synal.asset_registry (
  asset_key,
  name,
  category,
  primitive_start,
  primitive_end,
  status,
  reality_status,
  wired,
  execution_ready,
  owner,
  source_system,
  business_key,
  description,
  metadata
)
values
  (
    'synal-home',
    'Synal Home',
    'widgets',
    'proof',
    'command',
    'REGISTERED',
    'PRETEND',
    true,
    true,
    'troy',
    'command-centre',
    'SYNAL',
    'Unified integrity surface for all Synal assets',
    '{"surface":"home","kind":"widget"}'::jsonb
  ),
  (
    'synal-ingest',
    'Synal Ingest',
    'services',
    'signal',
    'proof',
    'REGISTERED',
    'PRETEND',
    true,
    true,
    'troy',
    'bridge-runner',
    'SYNAL',
    'Canonical ingestion path for all signals',
    '{"surface":"ingest","kind":"service"}'::jsonb
  ),
  (
    'synal-extension',
    'Synal Extension',
    'extensions',
    'signal',
    'task',
    'REGISTERED',
    'PRETEND',
    false,
    false,
    'troy',
    'browser',
    'SYNAL',
    'Inline signal capture and action bridge',
    '{"surface":"extension","kind":"chrome-extension"}'::jsonb
  )
on conflict (asset_key) do nothing;

commit;
