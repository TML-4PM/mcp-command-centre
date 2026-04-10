# SQL Execution Standard

Status: Mandatory  
Version: v1  
Owner: Universal Agent Contract

## Purpose

Define the single approved SQL execution path for all agents, bridge jobs, runtime packs, repair scripts, and Command Centre initiated write actions.

## Canonical execution path

- Invoke via: MCP Bridge
- Action: `invoke_function`
- Function name: `troy-sql-executor-s2`
- Invocation type: `RequestResponse`

## Direct Lambda payload

```json
{
  "sql": "select now() as ts",
  "params": [],
  "mode": "execute",
  "request_id": "req_<unique>",
  "source": "<agent_name>",
  "timestamp_utc": "<ISO8601>",
  "dry_run": false,
  "approval_required": false
}
```

## Bridge envelope

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

## Hard rules

- No direct DB connections
- No trailing semicolons in SQL
- `params` must always exist
- Metadata block required for bridge calls
- `request_id` must be unique
- All SQL activity must be auditable
- `dry_run` required for uncertain or high-risk changes
- `approval_required` must be true for gated or sensitive operations

## Fallback order

1. `troy-sql-executor-s2`
2. `troy-sql-runner`
3. `troy-sql-executor-fix`
4. `troy-sql-executor`

## Execution modes

### Execute

```json
{
  "mode": "execute",
  "dry_run": false
}
```

### Validate only

```json
{
  "mode": "execute",
  "dry_run": true
}
```

### Gated change

```json
{
  "mode": "execute",
  "dry_run": false,
  "approval_required": true
}
```

## Required agent behaviour

1. Resolve intent to SQL.
2. Validate SQL against expected schema or target.
3. Wrap in canonical payload.
4. Invoke through bridge when available.
5. Capture response status, logs, and execution time.
6. Write or surface audit result.
7. Classify failure as PARTIAL or PRETEND if unverified.

## Observability

Every execution must produce:

- `request_id`
- `status`
- `logs`
- `execution_time_ms`
- `result_payload`

All outputs must be routed to:

- Command Centre
- Bridge enforcement audit
- Reality Ledger

## Anti-drift policy

The following conditions are non-canonical and must be treated as PRETEND until verified:

- Different function name without fallback reason
- Missing metadata
- Ad hoc payload shape
- Undocumented SQL execution path

## Operating note

SQL execution is not ad hoc.

All agents must treat SQL as a governed runtime action. The preferred function is `troy-sql-executor-s2`. Use the MCP Bridge envelope when bridge access is available. Use fallback functions only in the approved fallback order and only when the prior function is unavailable or broken. Every SQL action must be attributable, replayable, and auditable.
