# Universal Agent Contract v1.1 Apply Order

Apply in exactly this order:

1. `001_schema_core.sql`
2. `002_seed_core.sql`
3. `003_runtime_functions.sql`
4. `004_standard_knowledge.sql`
5. `005_enforcement.sql`
6. `006_command_centre_views_widgets.sql`
7. `007_integrity.sql`
8. `008_ci_gates.sql`
9. `009_remediation.sql`
10. `010_bootstrap_jobs.sql`
11. `011_smoke_tests.sql`

## Scheduler wiring
Nightly full sweep:

```sql
select ops.fn_nightly_integrity_and_remediation_sweep();
```

Recommended run time:

- `02:20 Australia/Sydney`

## Hard go-live criteria

Do not call this live until all are true:

- at least one `REAL` execution exists
- no critical missing tool permissions for active agents
- no jobs missing execution logs
- no high-risk actions without approval
- Command Centre widgets return rows without SQL errors
- nightly integrity function runs successfully
- CI gate returns ok = true
- remediation runner can create and process at least one safe job
- PRETEND executions surface visibly in dashboard
- blocked remediations surface visibly in dashboard
