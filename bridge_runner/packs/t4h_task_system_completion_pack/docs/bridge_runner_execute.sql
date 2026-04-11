create table if not exists public.t4h_task_queue (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  title text not null,
  system_area text not null,
  target_object text,
  outcome text,
  priority text not null default 'MEDIUM',
  status text not null default 'OPEN',
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  calendar_event_id text,
  calendar_system text,
  schedule_status text default 'unscheduled',
  source_type text default 'manual',
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.t4h_task_run (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  run_status text not null default 'PENDING',
  started_at timestamptz,
  finished_at timestamptz,
  actor text,
  execution_ref text,
  evidence_ref text,
  truth_state text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.t4h_task_dependency (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  depends_on_task_id uuid not null references public.t4h_task_queue(id) on delete cascade,
  dependency_type text not null default 'finish_to_start',
  created_at timestamptz not null default now(),
  unique(task_id, depends_on_task_id)
);

insert into public.t4h_task_queue
(task_key, title, system_area, target_object, outcome, priority, status, source_type)
values
('task-queue-live-status-check', 'Check live status of public.t4h_task_queue', 'tasks', 'public.t4h_task_queue', 'Confirm table exists, current row volume, active usage, and operational status', 'HIGH', 'OPEN', 'chat'),
('task-page-ccq-source-check', 'Check Task page CCQ query source', 'command-centre', 'Tasks page CCQ source', 'Identify exact query, view, or config powering the Tasks page', 'HIGH', 'OPEN', 'chat'),
('import-doc-task-lists', 'Import doc task lists into canonical queue', 'tasks', 'public.t4h_task_queue', 'Load existing document-based task lists into canonical DB queue', 'HIGH', 'OPEN', 'chat'),
('wire-task-run-log', 'Wire task executions to public.t4h_task_run', 'runtime', 'public.t4h_task_run', 'Create execution logging and runtime evidence for every task attempt', 'HIGH', 'OPEN', 'chat'),
('wire-task-dependencies', 'Wire dependency sequencing via public.t4h_task_dependency', 'runtime', 'public.t4h_task_dependency', 'Enable dependency-aware ordering and blocked-state handling', 'HIGH', 'OPEN', 'chat'),
('decide-closure-cutover', 'Decide closure-register cutover point', 'closure', 'ops.build_closure_register', 'Define cutover rule between task queue lifecycle and closure-register lifecycle', 'HIGH', 'OPEN', 'chat'),
('bind-closure-to-evidence', 'Bind closure to evidence and truth-state classification', 'closure', 'REAL_PARTIAL_PRETEND', 'Require evidence before closure and classify truth-state consistently', 'CRITICAL', 'OPEN', 'chat'),
('bind-tasks-to-calendar', 'Bind tasks to calendar events and scheduling rules', 'calendar', 'Google Calendar / Cal.com', 'Ensure date-bound tasks can create, update, and reconcile against calendar events', 'HIGH', 'OPEN', 'chat')
on conflict (task_key) do update
set
  title = excluded.title,
  system_area = excluded.system_area,
  target_object = excluded.target_object,
  outcome = excluded.outcome,
  priority = excluded.priority,
  status = excluded.status,
  updated_at = now();

with ids as (
  select task_key, id from public.t4h_task_queue
)
insert into public.t4h_task_dependency (task_id, depends_on_task_id, dependency_type)
select child.id, parent.id, 'finish_to_start'
from ids child
join ids parent on
  (child.task_key = 'task-page-ccq-source-check' and parent.task_key = 'task-queue-live-status-check') or
  (child.task_key = 'import-doc-task-lists' and parent.task_key = 'task-page-ccq-source-check') or
  (child.task_key = 'wire-task-run-log' and parent.task_key = 'import-doc-task-lists') or
  (child.task_key = 'wire-task-dependencies' and parent.task_key = 'wire-task-run-log') or
  (child.task_key = 'bind-tasks-to-calendar' and parent.task_key = 'wire-task-dependencies') or
  (child.task_key = 'decide-closure-cutover' and parent.task_key = 'bind-tasks-to-calendar') or
  (child.task_key = 'bind-closure-to-evidence' and parent.task_key = 'decide-closure-cutover')
on conflict do nothing;

create or replace view public.v_t4h_task_board as
select
  q.id,
  q.task_key,
  q.title,
  q.system_area,
  q.target_object,
  q.priority,
  q.status,
  q.schedule_status,
  q.due_at,
  q.scheduled_start,
  q.scheduled_end,
  q.calendar_event_id,
  q.calendar_system,
  (
    select count(*)
    from public.t4h_task_dependency d
    where d.task_id = q.id
  ) as dependency_count,
  (
    select max(r.finished_at)
    from public.t4h_task_run r
    where r.task_id = q.id
  ) as last_finished_at
from public.t4h_task_queue q;
