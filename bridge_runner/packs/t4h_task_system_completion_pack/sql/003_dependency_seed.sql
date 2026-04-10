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
