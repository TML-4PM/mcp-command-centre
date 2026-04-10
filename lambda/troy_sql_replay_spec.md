# troy-sql-replay Specification

Status: Proposed  
Purpose: Allow replay and verification of historical SQL executions.

## Objective

Enable deterministic replay of SQL executions using stored request envelopes.

## Function name

`troy-sql-replay`

## Input

```json
{
  "request_id": "req_<unique>",
  "mode": "replay"
}
```

## Behaviour

1. Lookup original payload from audit store
2. Validate original payload integrity
3. Reconstruct canonical bridge envelope
4. Re-execute via `troy-sql-executor-s2`
5. Capture new result
6. Compare original vs replay result

## Output

```json
{
  "request_id": "req_<unique>",
  "original_result": {...},
  "replay_result": {...},
  "match": true,
  "reality_classification": "REAL",
  "execution_time_ms": 120
}
```

## Use cases

- Debug failed executions
- Validate audit integrity
- Support RDTI evidence
- Reproduce historical system state

## Reality Ledger mapping

- MATCH = REAL
- MISMATCH = PARTIAL
- MISSING ORIGINAL = PRETEND

## Storage requirements

Replay requires:

- Stored request payload
- Stored SQL
- Stored result payload
- Timestamp
- Source agent

## Build note

Replay depends on prior enforcement of canonical payload structure and audit logging.
