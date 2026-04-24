-- 001_core_widgets_unblock.sql
-- Purpose: unblock bridge-runner registry proof where core.widgets is missing.
-- Safe to re-run. No deletes. No destructive changes.

create schema if not exists core;

create table if not exists core.widgets (
  widget_id text primary key,
  category text not null default 'unknown',
  status text not null default 'draft',
  name text,
  description text,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at timestamptz
);

create index if not exists idx_widgets_status on core.widgets(status);
create index if not exists idx_widgets_category on core.widgets(category);
create index if not exists idx_widgets_created_at on core.widgets(created_at desc);

insert into core.widgets (
  widget_id,
  category,
  status,
  name,
  description,
  payload,
  metadata,
  last_verified_at
) values (
  'bridge_runner_control_plane',
  'control_plane',
  'active',
  'T4H Bridge Runner Control Plane',
  'Pseudo-Troy bridge runner for queue-first execution, audit receipts, and runtime proof.',
  '{"source":"bridge_runner_v3","queue_first":true,"audit_receipt":true}'::jsonb,
  '{"created_by":"chatgpt_connector","mode":"WIP","definition_of_done":"queue + worker + audit + registry proof"}'::jsonb,
  now()
)
on conflict (widget_id) do update set
  category = excluded.category,
  status = excluded.status,
  name = excluded.name,
  description = excluded.description,
  payload = excluded.payload,
  metadata = excluded.metadata,
  updated_at = now(),
  last_verified_at = now();

-- Proof query
select widget_id, category, status, name, created_at, updated_at, last_verified_at
from core.widgets
where widget_id = 'bridge_runner_control_plane';
