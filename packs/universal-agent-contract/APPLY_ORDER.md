# Apply Order

Apply in this exact order:

1. 001_schema_core.sql
2. 002_seed_and_runtime.sql
3. 003_standard_knowledge_and_enforcement.sql
4. 004_command_centre_and_integrity.sql
5. 005_ci_and_remediation.sql
6. 006_bootstrap_and_smoke_tests.sql

Then:
- wire bridge contracts under /bridge
- enable scheduler for integrity + remediation
- enable GitHub Actions CI gate

## Go-live checks
- at least one REAL execution exists
- no PRETEND executions open
- no high-risk actions without approval
- no jobs missing execution logs
- widgets query without errors
- CI gate returns ok=true

If any fail → do not proceed to production.
