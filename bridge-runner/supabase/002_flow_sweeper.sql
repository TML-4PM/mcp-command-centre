-- 002_flow_sweeper.sql
-- Purpose: create/repair FLOW sweeper primitives and proof harness.
-- Safe to re-run. No destructive operations. Archive-not-delete posture.

create schema if not exists public;

create table if not exists public.flow_items (
  id uuid primary key default gen_random_uuid(),
  biz_key text not null default 'T4H',
  title text not null,
  description text,
  canonical_stage text not null default 'PARKING',
  technical_state text not null default 'HEALTHY',
  trigger_mode text not null default 'MANUAL',
  autonomy_mode text not null default 'GATED',
  owner_name text,
  company_key text,
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  next_action text,
  blocker_note text,
  last_movement_at timestamptz not null default now(),
  next_review_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flow_events (
  id uuid primary key default gen_random_uuid(),
  flow_item_id uuid references public.flow_items(id) on delete cascade,
  event_type text not null,
  from_stage text,
  to_stage text,
  from_state text,
  to_state text,
  note text,
  actor_type text not null default 'SYSTEM',
  actor_name text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.flow_run_log (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  flow_item_id uuid,
  run_status text not null,
  decision_reason text,
  previous_stage text,
  new_stage text,
  previous_state text,
  new_state text,
  next_action_snapshot text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error jsonb,
  execution_time_ms int,
  created_at timestamptz not null default now()
);

create index if not exists flow_items_state_idx on public.flow_items(technical_state);
create index if not exists flow_items_review_idx on public.flow_items(next_review_at);
create index if not exists flow_items_last_movement_idx on public.flow_items(last_movement_at);
create index if not exists flow_run_log_sweeper_idx on public.flow_run_log(run_type, created_at desc);

create or replace view public.v_flow_drain_and_miss as
select
  fi.id,
  fi.title,
  fi.company_key,
  fi.canonical_stage,
  fi.technical_state,
  fi.last_movement_at,
  fi.next_review_at,
  fi.next_action,
  case
    when fi.next_review_at is not null and fi.next_review_at < now() then 'MISSED_REVIEW'
    when coalesce(fi.next_action, '') = '' then 'MISSED_NEXT_ACTION'
    when fi.last_movement_at < now() - interval '5 days' then 'DRAINED'
    when fi.last_movement_at < now() - interval '2 days' then 'STALE'
    else 'OK'
  end as flow_health
from public.flow_items fi
where fi.canonical_stage <> 'ARCHIVED';

create or replace function public.flow_sweeper(p_limit int default 50, p_dry_run boolean default false)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_started timestamptz := clock_timestamp();
  v_item record;
  v_count int := 0;
  v_result jsonb := '[]'::jsonb;
  v_health text;
  v_new_state text;
begin
  for v_item in
    select *
    from public.v_flow_drain_and_miss
    where flow_health <> 'OK'
    order by
      case flow_health
        when 'MISSED_REVIEW' then 1
        when 'MISSED_NEXT_ACTION' then 2
        when 'DRAINED' then 3
        when 'STALE' then 4
        else 9
      end,
      last_movement_at asc nulls first
    limit greatest(coalesce(p_limit, 50), 1)
  loop
    v_health := v_item.flow_health;
    v_new_state := case
      when v_health in ('MISSED_REVIEW','MISSED_NEXT_ACTION','DRAINED','STALE') then 'STALE'
      else v_item.technical_state
    end;

    if not p_dry_run then
      update public.flow_items
      set
        technical_state = v_new_state,
        metadata = metadata || jsonb_build_object('last_swept_at', now(), 'last_sweep_health', v_health),
        updated_at = now()
      where id = v_item.id;

      insert into public.flow_events (
        flow_item_id, event_type, from_stage, to_stage, from_state, to_state, note, actor_type, actor_name, evidence
      ) values (
        v_item.id, 'SWEEP_FLAGGED', v_item.canonical_stage, v_item.canonical_stage,
        v_item.technical_state, v_new_state,
        'FLOW sweeper flagged item as ' || v_health,
        'SYSTEM', 'flow_sweeper', jsonb_build_object('flow_health', v_health)
      );
    end if;

    insert into public.flow_run_log (
      run_type, flow_item_id, run_status, decision_reason, previous_stage, new_stage,
      previous_state, new_state, next_action_snapshot, payload, result, execution_time_ms
    ) values (
      'flow_sweeper', v_item.id,
      case when p_dry_run then 'dry_run' else 'completed' end,
      v_health,
      v_item.canonical_stage, v_item.canonical_stage,
      v_item.technical_state, v_new_state,
      v_item.next_action,
      jsonb_build_object('limit', p_limit, 'dry_run', p_dry_run),
      jsonb_build_object('flow_health', v_health, 'title', v_item.title),
      extract(milliseconds from clock_timestamp() - v_started)::int
    );

    v_count := v_count + 1;
    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'id', v_item.id,
      'title', v_item.title,
      'flow_health', v_health,
      'previous_state', v_item.technical_state,
      'new_state', v_new_state
    ));
  end loop;

  return jsonb_build_object(
    'status', 'completed',
    'dry_run', p_dry_run,
    'processed', v_count,
    'items', v_result,
    'elapsed_ms', extract(milliseconds from clock_timestamp() - v_started)::int
  );
exception when others then
  insert into public.flow_run_log (run_type, run_status, error, payload)
  values ('flow_sweeper', 'failed', jsonb_build_object('sqlstate', sqlstate, 'message', sqlerrm), jsonb_build_object('limit', p_limit, 'dry_run', p_dry_run));
  return jsonb_build_object('status','failed','sqlstate',sqlstate,'message',sqlerrm);
end;
$$;

insert into public.flow_items (
  biz_key, title, description, canonical_stage, technical_state, trigger_mode, autonomy_mode,
  owner_name, company_key, progress_pct, next_action, last_movement_at, next_review_at, metadata
) values (
  'T4H',
  'Sweeper proof stale item',
  'Synthetic item used to prove FLOW sweeper runtime.',
  'DISCOVERY',
  'HEALTHY',
  'SCHEDULED',
  'GATED',
  'WIP',
  'mcp-command-centre',
  10,
  '',
  now() - interval '7 days',
  now() - interval '1 day',
  jsonb_build_object('synthetic', true, 'proof_for', 'flow_sweeper')
)
on conflict do nothing;

-- Runtime proof: apply once after creation.
select public.flow_sweeper(10, false) as sweeper_result;

select *
from public.flow_run_log
where run_type = 'flow_sweeper'
order by created_at desc
limit 10;

select *
from public.v_flow_drain_and_miss
where flow_health <> 'OK'
order by last_movement_at asc nulls first
limit 20;
