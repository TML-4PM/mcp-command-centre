begin;

create schema if not exists t4h_control;

create table if not exists t4h_control.t4h_execution_log (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null,
  contract_key text,
  agent_name text,
  task_key text,
  task_summary text,
  status text not null default 'PENDING' check (status in ('PENDING','PASS','FAIL','RETRY','BLOCKED')),
  style_score int,
  authenticity_score numeric,
  ai_detectability numeric,
  tone_match numeric,
  violations jsonb not null default '[]'::jsonb,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists t4h_control.t4h_telemetry (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_value numeric not null,
  metric_dimensions jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists t4h_control.t4h_failure_log (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  task_key text,
  error_text text not null,
  retry_count int not null default 0,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_t4h_execution_log_created_at on t4h_control.t4h_execution_log(created_at desc);
create index if not exists idx_t4h_execution_log_status on t4h_control.t4h_execution_log(status, identity_key);
create index if not exists idx_t4h_telemetry_metric_key on t4h_control.t4h_telemetry(metric_key, recorded_at desc);
create index if not exists idx_t4h_failure_log_resolved on t4h_control.t4h_failure_log(resolved, component);

create trigger trg_t4h_failure_log_updated_at
before update on t4h_control.t4h_failure_log
for each row execute function t4h_control.set_updated_at();

create or replace view t4h_control.v_style_drift_dashboard as
select
  date_trunc('hour', created_at) as hour_bucket,
  count(*) as executions,
  avg(style_score) as avg_style_score,
  sum(case when status = 'FAIL' then 1 else 0 end) as fail_count,
  sum(case when status = 'RETRY' then 1 else 0 end) as retry_count
from t4h_control.t4h_execution_log
group by 1
order by 1 desc;

create or replace view t4h_control.v_top_style_violations as
select
  jsonb_array_elements_text(violations) as violation,
  count(*) as occurrences
from t4h_control.t4h_execution_log
where jsonb_array_length(violations) > 0
group by 1
order by 2 desc, 1 asc;

create or replace view t4h_control.v_failure_queue as
select
  id,
  component,
  task_key,
  error_text,
  retry_count,
  resolved,
  created_at,
  updated_at
from t4h_control.t4h_failure_log
where resolved = false
order by created_at desc;

commit;
