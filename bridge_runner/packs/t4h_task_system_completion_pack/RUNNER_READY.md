# Runner Ready

## Objective
Execute the task system completion pack against the canonical database.

## Execute this file
`bridge_runner/packs/t4h_task_system_completion_pack/docs/bridge_runner_execute.sql`

## Suggested executor
`troy-sql-executor`

## Expected outcome
- `public.t4h_task_queue` exists
- `public.t4h_task_run` exists
- `public.t4h_task_dependency` exists
- 8 requested tasks are seeded
- dependency chain is seeded
- `public.v_t4h_task_board` exists

## Validation queries
```sql
select count(*) from public.t4h_task_queue;
select count(*) from public.t4h_task_dependency;
select * from public.v_t4h_task_board order by priority desc, title asc;
```

## Notes
This pack is bridge-runner ready in GitHub. Execution still depends on the external runner or SQL executor being triggered with repository access.
