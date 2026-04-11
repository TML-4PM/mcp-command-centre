create table if not exists core5_provider_policies (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text,
  role text,
  priority integer not null default 100,
  retry_limit integer not null default 2,
  cooldown_seconds integer not null default 30,
  max_cost_usd numeric(12,4) not null default 5.0000,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists core5_cost_budgets (
  id uuid primary key default gen_random_uuid(),
  budget_name text not null,
  scope text not null default 'global',
  daily_limit_usd numeric(12,4) not null default 50.0000,
  per_run_limit_usd numeric(12,4) not null default 10.0000,
  warning_threshold_pct integer not null default 80,
  hard_stop_threshold_pct integer not null default 100,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists core5_provider_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  agent text not null,
  provider text not null,
  model text,
  attempt_no integer not null default 1,
  status text not null,
  latency_ms integer,
  tokens_in integer,
  tokens_out integer,
  estimated_cost_usd numeric(12,6) default 0,
  error_code text,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists core5_reorder_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  previous_order jsonb not null,
  new_order jsonb not null,
  trigger_reason text not null,
  created_at timestamptz default now()
);

create table if not exists core5_live_metrics (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,
  metric_key text not null,
  metric_value jsonb not null,
  created_at timestamptz default now()
);

create or replace view v_core5_provider_health as
select
  provider,
  model,
  count(*) as total_attempts,
  count(*) filter (where status = 'success') as success_count,
  count(*) filter (where status <> 'success') as failure_count,
  round(avg(latency_ms)::numeric, 2) as avg_latency_ms,
  round(sum(coalesce(estimated_cost_usd,0))::numeric, 4) as total_cost_usd,
  max(created_at) as last_seen_at
from core5_provider_attempts
group by provider, model;

create or replace view v_core5_budget_status as
with daily_spend as (
  select
    coalesce(sum(estimated_cost_usd),0) as spend_today
  from core5_provider_attempts
  where created_at::date = now()::date
)
select
  b.budget_name,
  b.scope,
  b.daily_limit_usd,
  b.per_run_limit_usd,
  d.spend_today,
  round(case when b.daily_limit_usd > 0 then (d.spend_today / b.daily_limit_usd) * 100 else 0 end, 2) as pct_used,
  b.warning_threshold_pct,
  b.hard_stop_threshold_pct,
  case
    when (case when b.daily_limit_usd > 0 then (d.spend_today / b.daily_limit_usd) * 100 else 0 end) >= b.hard_stop_threshold_pct then 'STOP'
    when (case when b.daily_limit_usd > 0 then (d.spend_today / b.daily_limit_usd) * 100 else 0 end) >= b.warning_threshold_pct then 'WARN'
    else 'OK'
  end as budget_state
from core5_cost_budgets b
cross join daily_spend d
where b.active = true;

create or replace view v_core5_realtime_dashboard as
select jsonb_build_object(
  'active_runs', (select count(*) from core5_runs where status in ('queued','running','stage_gate')),
  'final_outputs', (select count(*) from core5_outputs where is_final = true),
  'provider_health', coalesce((select jsonb_agg(to_jsonb(h)) from v_core5_provider_health h), '[]'::jsonb),
  'budget_status', coalesce((select jsonb_agg(to_jsonb(b)) from v_core5_budget_status b), '[]'::jsonb),
  'latest_reorders', coalesce((select jsonb_agg(to_jsonb(r)) from (select * from core5_reorder_events order by created_at desc limit 10) r), '[]'::jsonb)
) as dashboard;
