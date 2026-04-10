begin;

create extension if not exists pgcrypto;

create schema if not exists ops;
create schema if not exists runtime;
create schema if not exists cc;
create schema if not exists audit;
create schema if not exists commercial;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lifecycle_state') then
    create type public.lifecycle_state as enum ('queued','active','validating','blocked','complete','locked','archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'evidence_state') then
    create type public.evidence_state as enum ('REAL','PARTIAL','PRETEND');
  end if;
  if not exists (select 1 from pg_type where typname = 'severity_level') then
    create type public.severity_level as enum ('CRITICAL','HIGH','MEDIUM','LOW');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_state') then
    create type public.work_state as enum ('OPEN','IN_PROGRESS','BLOCKED','CLOSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'object_domain') then
    create type public.object_domain as enum ('REGISTRY','RUNTIME','EVIDENCE','CLOSURE','UI','COMMERCIAL','INTEGRATION','AUDIT');
  end if;
  if not exists (select 1 from pg_type where typname = 'evidence_type') then
    create type public.evidence_type as enum ('runtime_log','screenshot','output_artifact','webhook_receipt','deploy_result','health_check','manual_validation','external_confirmation');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists ops.system_registry (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  object_name text not null,
  object_domain public.object_domain not null,
  object_type text not null,
  biz_key text,
  brand_key text,
  product_key text,
  env_key text,
  owner_role text,
  owner_ref text,
  lifecycle_state public.lifecycle_state not null default 'queued',
  evidence_status public.evidence_state not null default 'PRETEND',
  is_canonical boolean not null default false,
  is_deprecated boolean not null default false,
  replaced_by_object_key text,
  source_of_truth text not null default 'supabase',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_registry_replaced_by_fk foreign key (replaced_by_object_key) references ops.system_registry(object_key) deferrable initially deferred
);

create index if not exists idx_system_registry_domain on ops.system_registry(object_domain);
create index if not exists idx_system_registry_type on ops.system_registry(object_type);
create index if not exists idx_system_registry_biz on ops.system_registry(biz_key);
create index if not exists idx_system_registry_lifecycle on ops.system_registry(lifecycle_state);
create index if not exists idx_system_registry_evidence on ops.system_registry(evidence_status);

drop trigger if exists trg_system_registry_updated_at on ops.system_registry;
create trigger trg_system_registry_updated_at before update on ops.system_registry for each row execute function public.set_updated_at();

create table if not exists audit.evidence_register (
  id uuid primary key default gen_random_uuid(),
  subject_object_key text not null,
  subject_type text not null,
  subject_id text,
  evidence_type public.evidence_type not null,
  evidence_uri text,
  evidence_hash text,
  evidence_payload jsonb not null default '{}'::jsonb,
  validator text,
  validation_status public.evidence_state not null default 'PARTIAL',
  validation_notes text,
  validated_at timestamptz,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_register_subject_fk foreign key (subject_object_key) references ops.system_registry(object_key) on delete cascade
);

create index if not exists idx_evidence_subject on audit.evidence_register(subject_object_key);
create index if not exists idx_evidence_type on audit.evidence_register(evidence_type);
create index if not exists idx_evidence_validation_status on audit.evidence_register(validation_status);

drop trigger if exists trg_evidence_register_updated_at on audit.evidence_register;
create trigger trg_evidence_register_updated_at before update on audit.evidence_register for each row execute function public.set_updated_at();

create table if not exists audit.reality_ledger (
  id uuid primary key default gen_random_uuid(),
  subject_object_key text not null unique,
  current_state public.evidence_state not null default 'PRETEND',
  last_evidence_id uuid,
  confidence_score numeric(5,2),
  rationale text,
  checked_at timestamptz not null default now(),
  checked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reality_ledger_subject_fk foreign key (subject_object_key) references ops.system_registry(object_key) on delete cascade,
  constraint reality_ledger_last_evidence_fk foreign key (last_evidence_id) references audit.evidence_register(id) on delete set null
);

create index if not exists idx_reality_ledger_state on audit.reality_ledger(current_state);

drop trigger if exists trg_reality_ledger_updated_at on audit.reality_ledger;
create trigger trg_reality_ledger_updated_at before update on audit.reality_ledger for each row execute function public.set_updated_at();

create table if not exists ops.gap_register (
  id uuid primary key default gen_random_uuid(),
  subject_object_key text not null,
  gap_lens text not null check (gap_lens in ('RUNTIME','DATA','VALUE','REVENUE','DISTRIBUTION','TELEMETRY','RECOVERY','ORCHESTRATION','EVIDENCE')),
  severity public.severity_level not null default 'MEDIUM',
  status public.work_state not null default 'OPEN',
  title text not null,
  description text,
  required_to_close text,
  owner_role text,
  due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gap_register_subject_fk foreign key (subject_object_key) references ops.system_registry(object_key) on delete cascade
);

create index if not exists idx_gap_subject on ops.gap_register(subject_object_key);
create index if not exists idx_gap_status on ops.gap_register(status);
create index if not exists idx_gap_severity on ops.gap_register(severity);

drop trigger if exists trg_gap_register_updated_at on ops.gap_register;
create trigger trg_gap_register_updated_at before update on ops.gap_register for each row execute function public.set_updated_at();

commit;
