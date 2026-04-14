-- =========================================================
-- AUTONOMOUS REVENUE ENGINE
-- =========================================================
create schema if not exists revenue;

create table if not exists revenue.factory_pricing (
  pricing_id uuid primary key default gen_random_uuid(),
  factory_key text not null,
  sku_key text not null,
  pricing_model text not null, -- subscription|one_off|usage|commission|hybrid
  currency text not null default 'AUD',
  base_price numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  floor_price numeric(12,2) not null default 0,
  ceiling_price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(factory_key, sku_key)
);

create table if not exists revenue.factory_margin_ledger (
  margin_id uuid primary key default gen_random_uuid(),
  factory_key text not null,
  run_id uuid,
  execution_key text,
  revenue_amount numeric(12,2) not null default 0,
  cost_amount numeric(12,2) not null default 0,
  gross_margin numeric(12,2) generated always as (revenue_amount - cost_amount) stored,
  gross_margin_pct numeric(8,2),
  status text not null default 'recorded',
  created_at timestamptz not null default now()
);

create table if not exists revenue.routing_policy (
  policy_id uuid primary key default gen_random_uuid(),
  policy_key text unique,
  factory_key text not null,
  priority_order jsonb not null default '[]'::jsonb,
  min_margin_pct numeric(8,2) not null default 20,
  max_cost_per_execution numeric(12,2) not null default 0,
  preferred_provider text,
  fallback_provider text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists revenue.stripe_product_map (
  map_id uuid primary key default gen_random_uuid(),
  factory_key text not null,
  sku_key text not null,
  stripe_product_id text,
  stripe_price_id text,
  billing_mode text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(factory_key, sku_key)
);

create table if not exists revenue.execution_value_signal (
  signal_id uuid primary key default gen_random_uuid(),
  execution_key text not null,
  factory_key text not null,
  revenue_tag text not null,
  lead_score numeric(8,2) default 0,
  close_probability numeric(8,2) default 0,
  expected_value numeric(12,2) default 0,
  actual_value numeric(12,2) default 0,
  status text default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(execution_key)
);

create or replace function revenue.fn_margin_pct(p_revenue numeric, p_cost numeric)
returns numeric
language plpgsql
as $$
begin
  if coalesce(p_revenue,0) <= 0 then
    return 0;
  end if;
  return round(((coalesce(p_revenue,0) - coalesce(p_cost,0)) / p_revenue) * 100, 2);
end;
$$;

create or replace function revenue.fn_record_margin(
  p_factory_key text,
  p_run_id uuid,
  p_execution_key text,
  p_revenue_amount numeric,
  p_cost_amount numeric
)
returns uuid
language plpgsql
as $$
declare v_id uuid;
begin
  insert into revenue.factory_margin_ledger (
    factory_key, run_id, execution_key, revenue_amount, cost_amount, gross_margin_pct
  ) values (
    p_factory_key, p_run_id, p_execution_key, coalesce(p_revenue_amount,0), coalesce(p_cost_amount,0),
    revenue.fn_margin_pct(coalesce(p_revenue_amount,0), coalesce(p_cost_amount,0))
  ) returning margin_id into v_id;

  return v_id;
end;
$$;

create or replace function revenue.fn_pick_provider(
  p_factory_key text,
  p_expected_revenue numeric,
  p_expected_cost numeric
)
returns jsonb
language plpgsql
as $$
declare
  v_policy record;
  v_margin numeric;
begin
  select * into v_policy
  from revenue.routing_policy
  where factory_key = p_factory_key and active = true
  order by created_at desc
  limit 1;

  v_margin := revenue.fn_margin_pct(coalesce(p_expected_revenue,0), coalesce(p_expected_cost,0));

  if v_policy.policy_id is null then
    return jsonb_build_object(
      'provider', 'gpt',
      'reason', 'default_no_policy',
      'expected_margin_pct', v_margin
    );
  end if;

  if v_margin < v_policy.min_margin_pct then
    return jsonb_build_object(
      'provider', coalesce(v_policy.fallback_provider, v_policy.preferred_provider, 'gpt'),
      'reason', 'margin_below_threshold',
      'expected_margin_pct', v_margin,
      'threshold', v_policy.min_margin_pct
    );
  end if;

  return jsonb_build_object(
    'provider', coalesce(v_policy.preferred_provider, 'gpt'),
    'reason', 'preferred_policy_match',
    'expected_margin_pct', v_margin,
    'threshold', v_policy.min_margin_pct
  );
end;
$$;

create or replace view revenue.v_factory_margin_health as
select
  factory_key,
  count(*) as run_count,
  sum(revenue_amount) as revenue_amount,
  sum(cost_amount) as cost_amount,
  sum(gross_margin) as gross_margin,
  round(avg(gross_margin_pct),2) as avg_gross_margin_pct,
  max(created_at) as last_seen_at
from revenue.factory_margin_ledger
group by factory_key
order by gross_margin desc nulls last;

create or replace view revenue.v_unpriced_factories as
select f.factory_key, f.factory_name, f.revenue_model
from ops.agent_factory f
left join revenue.factory_pricing p
  on p.factory_key = f.factory_key and p.active = true
where f.active = true
group by f.factory_key, f.factory_name, f.revenue_model
having count(p.pricing_id) = 0;

create or replace view revenue.v_unprofitable_factories as
select *
from revenue.v_factory_margin_health
where coalesce(avg_gross_margin_pct,0) < 20;

create or replace function revenue.fn_ci_gate_revenue_engine_block()
returns void
language plpgsql
as $$
declare v_count int;
begin
  select count(*) into v_count from revenue.v_unpriced_factories;
  if v_count > 0 then
    raise exception 'Revenue gate failed: % unpriced factories', v_count;
  end if;

  select count(*) into v_count from revenue.v_unprofitable_factories;
  if v_count > 0 then
    raise exception 'Revenue gate failed: % unprofitable factories below threshold', v_count;
  end if;
end;
$$;

insert into revenue.factory_pricing (factory_key, sku_key, pricing_model, currency, base_price, unit_price, floor_price, ceiling_price)
values
('lead_gen_factory','lead_standard','usage','AUD',0,25,15,60),
('automation_factory','automation_project','one_off','AUD',5000,0,3500,25000)
on conflict (factory_key, sku_key) do nothing;

insert into revenue.routing_policy (policy_key, factory_key, priority_order, min_margin_pct, max_cost_per_execution, preferred_provider, fallback_provider)
values
('lead_gen_policy','lead_gen_factory','["gpt","perplexity","claude"]'::jsonb,30,10,'gpt','perplexity'),
('automation_policy','automation_factory','["gpt","claude","gemini"]'::jsonb,40,250,'gpt','claude')
on conflict (policy_key) do nothing;
