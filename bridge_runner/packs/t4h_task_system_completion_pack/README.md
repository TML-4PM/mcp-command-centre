# T4H Task System Completion Pack

This pack completes the task-system work requested in chat:

1. Check live status of `public.t4h_task_queue`
2. Check Task page CCQ query source
3. Import doc task lists into canonical queue
4. Wire task executions to `public.t4h_task_run`
5. Wire dependency sequencing via `public.t4h_task_dependency`
6. Decide closure-register cutover point
7. Bind closure to evidence and truth-state classification
8. Bind tasks to calendar events and scheduling rules

## Expected outcomes

- One canonical task queue
- One canonical runtime task-run table
- Dependency-aware scheduling and execution
- Closure gated by evidence and truth-state
- Calendar binding for date-bound work
- A clear cutover from task queue to closure register
