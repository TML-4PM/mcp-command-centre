# Synal Golden Loop Bridge Pack

This pack is the bridge-ready execution bundle for the Synal Global Control System.

## Purpose

Turn Synal into a self-proving, self-healing control system with one canonical loop:

`observe -> ingest -> decide -> execute -> prove -> classify -> heal -> learn -> monetise -> optimise -> repeat`

## Pack contents

- `payloads/golden-loop.invoke.json` — canonical bridge invocation envelope
- `sql/synal_golden_loop.sql` — registry, ledger, drift, replay, usage, and knowledge schema
- `sam/synal_golden_loop.template.yaml` — AWS Lambda + EventBridge deployment template
- `lambdas/` — Python runtime for discovery, orchestration, verification, remediation, replay, enforcement, and drift

## Truth rule

System is not FINAL or REAL until both are true:

1. `make deploy` completes end-to-end
2. `make prove` returns PASS with zero unknowns and full ledger evidence

## Proof gates

1. Execution Proof — every component runs, returns structured output, and is replayable
2. Coverage Proof — 100% Lambda discovery and classification into SAFE, DRY_RUN, or BLOCKED; no unknowns
3. Reality Ledger Binding — every execution writes intent -> execution -> output -> classification -> evidence
4. Drift + Recovery Proof — config, IAM, and dead-Lambda drift detected with auto-fix or escalation
5. One-Command Rebuild Proof — deploy + prove produces PASS/FAIL deterministically

## Bridge handoff

The intended execution path is:

1. Bridge Runner picks up `payloads/golden-loop.invoke.json`
2. Applies `sql/synal_golden_loop.sql` to Supabase
3. Deploys `sam/synal_golden_loop.template.yaml`
4. Invokes orchestrator/discover/verify
5. Writes proof back into Reality Ledger and Command Centre views

## Classification

- REAL — all proof gates satisfied
- PARTIAL — some components proven, system not closed
- PRETEND — claims without evidence

## Notes

This pack contains code and text artefacts only. Image/media assets are not included in this commit.