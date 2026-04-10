# SQL Control Plane — Bridge Runner Pack

## Purpose

This pack wires SQL execution into a fully governed control plane:

Agent -> Bridge -> Guardrail -> Executor -> Audit -> Command Centre -> Reality Ledger

## How to use

1. Load manifest:
   bridge_runner/sql_control_plane/bridge_runner_manifest.json

2. Execute steps in order

3. Validate using smoke test in manifest

## Expected outcome

- No SQL bypass
- All executions audited
- Replay works
- Reality classification assigned

## Warning

If Bridge Runner does not enforce route rewrite to guardrail, the system is NOT considered complete.

## Success signal

Command Centre shows SQL activity with REAL/PARTIAL/PRETEND classification.
