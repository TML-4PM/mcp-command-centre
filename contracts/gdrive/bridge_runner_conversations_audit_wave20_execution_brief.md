# Execution Brief — Wave 20 Conversation Audit Loop

## Purpose

Execute the autonomous conversation audit system end-to-end using the shared-drive source file and persist all outputs to canonical stores.

## Governing Contract

- Architecture level: 35
- Autonomous wave level: 20
- Human in loop: false
- Stop condition: never
- Runtime expectation: persistent loop with self-healing

## Primary Inputs

- Contract YAML: `contracts/gdrive/bridge_runner_conversations_audit_wave20.yaml`
- Bridge payload: `contracts/gdrive/bridge_runner_conversations_audit_wave20_bridge_payload.json`
- Source file: Google Drive file id `1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs`
- Source principal: `gdrive-crawler@mcp-bridge-478002.iam.gserviceaccount.com`

## Required Runtime Outcomes

1. Confirm source access and metadata.
2. Download large conversation export.
3. Split export into derived JSONL artifacts.
4. Load unfinished threads into canonical Supabase tables.
5. Uplift all open threads to minimum architecture level 35 and automation wave 20.
6. Export first 500 open threads and full open thread dataset.
7. Requeue the contract for continuous operation.
8. Log failures and retries truthfully.

## Evidence Required

- Run start record
- Source metadata confirmation
- Output artifact paths written
- Supabase row counts for canonical tables
- First 500 CSV generated
- Requeue proof / next scheduled run
- Failure log entries if any

## Reality Classification Rule

- REAL: Runtime executed and evidence attached
- PARTIAL: GitHub posted and/or some outputs exist but no full runtime proof
- PRETEND: Claimed complete without evidence

## Board Reporting Requirement

Return a short closure/status note covering:
- whether pickup occurred
- whether run succeeded
- what artifacts exist
- what is blocked
- current reality class
