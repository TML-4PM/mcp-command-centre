# troy-sql-guardrail Specification

Status: Proposed for build  
Purpose: Reject non-canonical SQL execution payloads before they hit the executor.

## Objective

Enforce a single SQL invoke contract across bridge-routed agents and runtime jobs.

## Function name

`troy-sql-guardrail`

## Invocation pattern

This function sits in front of `troy-sql-executor-s2` and validates payload integrity before forwarding.

## Expected input envelope

```json
{
  "action": "invoke_function",
  "function_name": "troy-sql-executor-s2",
  "invocation_type": "RequestResponse",
  "payload": {
    "sql": "select now() as ts",
    "params": [],
    "mode": "execute",
    "request_id": "req_<unique>",
    "source": "<agent_name>",
    "timestamp_utc": "<ISO8601>",
    "dry_run": false,
    "approval_required": false
  },
  "metadata": {
    "request_id": "req_<unique>",
    "source": "<agent_name>",
    "timestamp_utc": "<ISO8601>",
    "auth_context": "internal"
  }
}
```

## Validation checks

1. `action` must equal `invoke_function`
2. `function_name` must equal `troy-sql-executor-s2` or an approved fallback
3. `payload.sql` must exist and be non-empty
4. `payload.sql` must not end in a trailing semicolon
5. `payload.params` must exist and be an array
6. `payload.request_id` must exist and match `metadata.request_id`
7. `payload.source` must exist and match `metadata.source`
8. `payload.timestamp_utc` must exist and be valid ISO8601
9. `metadata.auth_context` must exist
10. `payload.mode` must equal `execute`
11. `dry_run` and `approval_required` must exist explicitly

## Optional safety checks

- Block destructive SQL when `approval_required=false`
- Block `drop`, `truncate`, and unrestricted `delete` statements unless explicitly approved
- Reject unknown `function_name` values
- Reject replayed `request_id` values unless replay mode is explicitly enabled

## Output contract

### Success

```json
{
  "status": "approved",
  "request_id": "req_<unique>",
  "forward_to": "troy-sql-executor-s2",
  "checks_passed": [
    "action",
    "function_name",
    "payload_shape",
    "metadata",
    "sql_safety"
  ]
}
```

### Failure

```json
{
  "status": "rejected",
  "request_id": "req_<unique>",
  "reason_code": "MISSING_METADATA",
  "message": "metadata.request_id, metadata.source, and metadata.timestamp_utc are required",
  "reality_classification": "PRETEND"
}
```

## Audit requirements

Every approval or rejection must write to the SQL enforcement audit surface with:

- request_id
- source
- function_name
- sql_hash
- approval_decision
- reason_code
- timestamp_utc
- forwarded_to
- reality_classification

## Integration sequence

1. Agent creates canonical bridge payload
2. Bridge routes payload to `troy-sql-guardrail`
3. Guardrail validates and logs decision
4. If approved, guardrail forwards to `troy-sql-executor-s2`
5. Executor runs SQL and returns result
6. Result is written to Command Centre and Reality Ledger

## Enforcement classification

- APPROVED = REAL candidate
- REJECTED = PRETEND
- EXECUTED BUT UNVERIFIED = PARTIAL

## Build note

This file is a runtime specification, not the deployed Lambda source. Bridge Runner or implementation tooling should generate the actual Lambda from this contract.
