-- BBES Browser-to-Business Execution System schema
-- Reality state: PARTIAL until applied and validated in Supabase.

create extension if not exists pgcrypto;

create type if not exists public.bbes_reality_state as enum ('REAL','PARTIAL','PRETEND','UNKNOWN');
create type if not exists public.bbes_lifecycle_state as enum ('CAPTURED','TRIAGED','PROCESSING','BLOCKED','EXECUTED','ABSORBED','MONETISED','CLOSED','KILLED');
create type if not exists public.bbes_outcome as enum ('EXECUTE_NOW','MERGE_AND_EXECUTE','QUEUE_FOR_BATCH','ARCHIVE_REFERENCE','KILL','PUBLISH_AS_IP');
create type if not exists public.bbes_kill_reason as enum ('DUPLICATE','NEGATIVE_EV','INTENT_EVAPORATED','BLOCKED_DEP','OUT_OF_SCOPE','REPLACED','LOW_SIGNAL','ACCESS_DENIED','UNKNOWN');
create type if not exists public.bbes_source_type as enum ('live_tab','bookmark','bookmark_folder','onetab','history','extension','download','chat_export','manual','api');

create table if not exists public.bbes_capture_batch (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type public.bbes_source_type not null default 'manual',
  captured_by text,
  notes text,
  reality_state public.bbes_reality_state not null default 'PARTIAL',
  created_at timestamptz not null default now()
);

create table if not exists public.bbes_tab (
  id uuid primary key default gen_random_uuid(),
  capture_batch_id uuid references public.bbes_capture_batch(id) on delete set null,
  url text not null,
  url_hash text generated always as (encode(digest(url, 'sha256'), 'hex')) stored,
  canonical_url text,
  page_title text,
  platform_type text,
  source_type public.bbes_source_type not null default 'manual',
  session_source text,
  original_position int,
  access_status text not null default 'unknown',

  original_intent text,
  evolved_intent text,
  why_still_matters text,
  core_signal text,
  decision_delta text,
  duplicate_of uuid references public.bbes_tab(id) on delete set null,

  primary_business text,
  secondary_businesses text[] not null default '{}',
  portfolio_group text,
  system_layer text,
  function_area text,
  lifecycle_state public.bbes_lifecycle_state not null default 'CAPTURED',
  final_outcome public.bbes_outcome,

  evidence_strength public.bbes_reality_state not null default 'UNKNOWN',
  evidence_ref text,
  evidence_hash text,
  confidence_score numeric(5,2),

  estimated_value_aud numeric(14,2),
  cost_to_execute_aud numeric(14,2),
  value_gate_result text,
  revenue_path text,
  revenue_ref text,
  monetisation_type text,

  execution_type text,
  execution_payload_json jsonb,
  bridge_ready boolean generated always as (execution_payload_json is not null) stored,
  absorbed_into text,
  enhances text,
  replaces text,
  reuse_multiplier numeric(8,2) not null default 1,

  ttl_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bbes_tab_value_gate check (
    estimated_value_aud is null or cost_to_execute_aud is null or estimated_value_aud >= 0 and cost_to_execute_aud >= 0
  )
);

create unique index if not exists bbes_tab_idempotency_idx on public.bbes_tab(url_hash, coalesce(session_source,''), coalesce(capture_batch_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists bbes_tab_state_idx on public.bbes_tab(lifecycle_state, final_outcome);
create index if not exists bbes_tab_business_idx on public.bbes_tab(primary_business, system_layer);
create index if not exists bbes_tab_execution_idx on public.bbes_tab using gin(execution_payload_json);

create table if not exists public.bbes_dead_weight (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.bbes_tab(id) on delete cascade,
  kill_reason public.bbes_kill_reason not null,
  kill_detail text,
  cluster_key text,
  resurfaced_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bbes_execution_log (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.bbes_tab(id) on delete set null,
  request_id text not null default gen_random_uuid()::text,
  function_name text not null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null default 'queued',
  reality_state public.bbes_reality_state not null default 'PARTIAL',
  error text,
  execution_time_ms int,
  created_at timestamptz not null default now()
);

create table if not exists public.bbes_value_learning (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.bbes_tab(id) on delete cascade,
  predicted_value_aud numeric(14,2),
  predicted_cost_aud numeric(14,2),
  actual_value_aud numeric(14,2),
  actual_cost_aud numeric(14,2),
  value_delta_aud numeric(14,2) generated always as (coalesce(actual_value_aud,0) - coalesce(predicted_value_aud,0)) stored,
  cost_delta_aud numeric(14,2) generated always as (coalesce(actual_cost_aud,0) - coalesce(predicted_cost_aud,0)) stored,
  time_to_value_actual interval,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bbes_artifact (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references public.bbes_tab(id) on delete set null,
  artifact_name text not null,
  artifact_type text not null,
  stored_location text not null,
  evidence_hash text,
  reality_state public.bbes_reality_state not null default 'PARTIAL',
  created_at timestamptz not null default now()
);

create table if not exists public.bbes_relationship (
  id uuid primary key default gen_random_uuid(),
  from_tab_id uuid references public.bbes_tab(id) on delete cascade,
  to_tab_id uuid references public.bbes_tab(id) on delete cascade,
  relationship_type text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint bbes_relationship_distinct check (from_tab_id is distinct from to_tab_id)
);

create table if not exists public.bbes_receipt (
  id uuid primary key default gen_random_uuid(),
  receipt_type text not null,
  receipt_payload jsonb not null,
  reality_state public.bbes_reality_state not null default 'PARTIAL',
  source_ref text,
  created_at timestamptz not null default now()
);

alter table public.bbes_capture_batch enable row level security;
alter table public.bbes_tab enable row level security;
alter table public.bbes_dead_weight enable row level security;
alter table public.bbes_execution_log enable row level security;
alter table public.bbes_value_learning enable row level security;
alter table public.bbes_artifact enable row level security;
alter table public.bbes_relationship enable row level security;
alter table public.bbes_receipt enable row level security;

create policy if not exists bbes_authenticated_read_capture_batch on public.bbes_capture_batch for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_tab on public.bbes_tab for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_dead_weight on public.bbes_dead_weight for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_execution_log on public.bbes_execution_log for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_value_learning on public.bbes_value_learning for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_artifact on public.bbes_artifact for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_relationship on public.bbes_relationship for select to authenticated using (true);
create policy if not exists bbes_authenticated_read_receipt on public.bbes_receipt for select to authenticated using (true);

create or replace function public.bbes_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bbes_tab_updated_at on public.bbes_tab;
create trigger trg_bbes_tab_updated_at before update on public.bbes_tab
for each row execute function public.bbes_touch_updated_at();

create or replace view public.v_bbes_execution_board as
select
  primary_business,
  system_layer,
  lifecycle_state,
  final_outcome,
  count(*) as item_count,
  sum(coalesce(estimated_value_aud,0)) as predicted_value_aud,
  sum(coalesce(cost_to_execute_aud,0)) as predicted_cost_aud
from public.bbes_tab
group by primary_business, system_layer, lifecycle_state, final_outcome;

create or replace view public.v_bbes_value_delta as
select
  t.primary_business,
  t.system_layer,
  count(v.id) as calibrated_items,
  sum(coalesce(v.predicted_value_aud,0)) as predicted_value_aud,
  sum(coalesce(v.actual_value_aud,0)) as actual_value_aud,
  sum(coalesce(v.value_delta_aud,0)) as value_delta_aud,
  sum(coalesce(v.cost_delta_aud,0)) as cost_delta_aud
from public.bbes_value_learning v
join public.bbes_tab t on t.id = v.tab_id
group by t.primary_business, t.system_layer;
