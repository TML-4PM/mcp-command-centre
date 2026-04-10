# Command Centre Reality Activation Pack

This pack closes the loop between build artifacts, runtime verification, and evidence-backed status in the Command Centre.

## What is included

- `sql/001_command_centre_reality_activation.sql`
  - migration-safe schema updates
  - Reality Ledger
  - verification jobs
  - deployment gates
  - artifact registry
  - intent queue
  - feedback actions
  - command-centre views
  - verification runner
- `lambda/command_centre_reality_verifier.py`
  - bridge-safe Lambda entrypoint
  - runs verification
  - returns compact dashboard payload
- `ui/config.example.js`
  - front-end config stub
- `ui/app.js`
  - live UI fetch logic for API payloads
- `bridge_runner/bridge_runner_payload.json`
  - canonical invoke envelope for bridge execution
- `bridge_runner/DEPLOY_ORDER.md`
  - exact apply order

## Purpose

This pack moves these components from concept to enforceable operational state:

- telemetry spine
- command-centre dashboard
- bridge API helpers
- runtime verification hooks
- reality ledger widget path

## Status model

- `REAL` = deployed, callable, verified with evidence
- `PARTIAL` = built but not fully wired or not yet verified
- `PRETEND` = concept, draft, or unverified artifact

## Apply order

1. Run `sql/001_command_centre_reality_activation.sql`
2. Deploy `lambda/command_centre_reality_verifier.py`
3. Point API Gateway or bridge route to the Lambda
4. Publish `ui/config.example.js` as `config.js` with your live endpoint
5. Deploy `ui/app.js` into the Command Centre UI
6. Invoke `bridge_runner/bridge_runner_payload.json`
7. Confirm these queries return cleanly:

```sql
select * from public.reality_ledger order by updated_at desc;
select * from cc.v_missing_evidence_board;
select * from cc.v_environment_drift_detector;
select * from cc.v_registry_drift;
select * from public.deployment_gates order by stage;
```

## Environment variables for Lambda

- `DB_URL`
- `AWS_REGION` if needed by your runtime

## Expected first success condition

- `command-centre / dashboard-core` appears in `public.reality_ledger`
- `dashboard-core` becomes `REAL`
- drift views compile cleanly
- the verifier Lambda returns counts for:
  - `missing_evidence`
  - `registry_drift`
  - `pending_feedback_actions`
  - `todays_actions`

## Notes

This pack is intentionally migration-safe. It assumes the live Supabase project already contains partially-built objects and avoids greenfield-only SQL patterns.
