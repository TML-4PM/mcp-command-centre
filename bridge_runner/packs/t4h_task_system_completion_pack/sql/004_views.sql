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
