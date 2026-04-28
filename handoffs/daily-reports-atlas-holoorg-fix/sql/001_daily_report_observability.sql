-- Daily report observability schema

create table if not exists agent_execution_log (
  id uuid primary key default gen_random_uuid(),
  agent_name text,
  status text,
  executed_at timestamptz default now()
);

create table if not exists report_delivery_log (
  id uuid primary key default gen_random_uuid(),
  report_name text,
  delivery_status text,
  created_at timestamptz default now()
);

create view v_agent_daily_summary as
select
  date_trunc('day', executed_at) as day,
  count(*) as total_executions,
  count(*) filter (where status='success') as success_count,
  count(*) filter (where status='failure') as failure_count
from agent_execution_log
group by 1;