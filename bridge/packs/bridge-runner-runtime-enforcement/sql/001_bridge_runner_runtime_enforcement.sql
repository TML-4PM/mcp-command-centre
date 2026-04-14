create schema if not exists runtime;
create schema if not exists reality;
create schema if not exists ops;

create type runtime.bridge_job_state as enum (
  'QUEUED','CLAIMED','RUNNING','RETRYING','COMPLETED','FAILED','BLOCKED','STALE','ORPHANED','CANCELLED'
);

create type reality.classification as enum ('REAL','PARTIAL','PRETEND');

create table if not exists runtime.bridge_job (
  job_id uuid primary key,
  source_repo text,
  source_path text,
  commit_sha text,
  state runtime.bridge_job_state default 'QUEUED',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists runtime.bridge_job_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid,
  message text,
  created_at timestamptz default now()
);

create table if not exists reality.bridge_job_evidence (
  job_id uuid primary key,
  pickup_timestamp timestamptz,
  executor text,
  status_code int,
  output_location text,
  writeback_location text,
  closure_timestamp timestamptz
);

create table if not exists ops.bridge_job_closure (
  job_id uuid primary key,
  status text,
  classification reality.classification,
  closed_at timestamptz default now()
);

create or replace function reality.fn_classify_bridge_job(p_job_id uuid)
returns reality.classification as $$
declare v record;
begin
  select * into v from reality.bridge_job_evidence where job_id = p_job_id;
  if v.job_id is null then return 'PRETEND'; end if;
  if v.output_location is null or v.writeback_location is null then return 'PARTIAL'; end if;
  return 'REAL';
end;
$$ language plpgsql;