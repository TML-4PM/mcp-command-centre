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
