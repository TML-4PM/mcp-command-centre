# Bridge Runner Runtime Enforcement Pack

This pack hardens Bridge Runner from a passive sweep mechanism into a runtime-enforced, evidence-bound execution lane.

## Purpose

Make Bridge Runner provably real.

A run is only considered **REAL** when the same `job_id` has:

1. inbound GitHub proof
2. pickup/claim proof
3. execution logs
4. transport proof
5. write-back proof
6. state transition proof
7. closure proof
8. runtime classification

## Pack Contents

- `sql/001_bridge_runner_runtime_enforcement.sql`
  - canonical enums
  - runtime tables
  - evidence tables
  - closure tables
  - helper views
  - validation/classification functions
- `lambda/bridge_runner_validator.py`
  - validates envelope
  - validates evidence completeness
  - classifies REAL / PARTIAL / PRETEND
- `lambda/nightly_integrity_sweep.py`
  - downgrades false-complete jobs
  - flags stale/orphaned jobs
  - requests retry or escalation
- `manifests/bridge_runner_runtime_enforcement.manifest.json`
  - canonical pack manifest for runner pickup
- `jobs/inbound/sample_job_runtime_enforced.json`
  - sample GitHub job envelope
- `widgets/bridge_runner_runtime_widget.html`
  - Command Centre visibility surface

## Required Runtime Path

GitHub -> pickup -> claim -> execute -> log -> evidence bind -> write-back -> closure -> classification

## Acceptance Rule

A job may not be marked `COMPLETED` unless:

- envelope is valid
- logs exist
- output exists
- write-back exists
- closure exists
- validator returns `REAL`

## Deployment Notes

1. apply SQL to Supabase
2. deploy validator lambda
3. deploy nightly integrity sweep
4. wire worker to write evidence rows during execution
5. surface widget in Command Centre
6. route pack through Bridge Runner

## Minimum tables expected in live use

- `runtime.bridge_job`
- `runtime.bridge_job_transition`
- `runtime.bridge_job_log`
- `reality.bridge_job_evidence`
- `ops.bridge_job_closure`
- `ops.bridge_runner_alert`

## Closure Standard

A job is not done because code exists.

A job is done only when one traceable run can show:

**GitHub in -> claim -> run -> logs -> output -> write-back -> closure -> classification**
