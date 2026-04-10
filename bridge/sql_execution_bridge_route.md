# SQL Execution Bridge Route

Status: Mandatory  
Purpose: Force all SQL execution through the guardrail before executor invocation.

## Required route

```text
Agent -> MCP Bridge -> troy-sql-guardrail -> troy-sql-executor-s2 -> audit -> Command Centre
```

## Rule

No agent, runner, job, or Command Centre action may invoke `troy-sql-executor-s2` directly.

Direct invocation is non-canonical and must be classified as `PRETEND` unless explicitly approved as break-glass recovery.

## Incoming bridge envelope

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

## Bridge rewrite behaviour

When the bridge receives a canonical SQL execution request, it must:

1. Preserve the original envelope unchanged under `original_event`
2. Change top-level `function_name` to `troy-sql-guardrail`
3. Pass the original request through as the event body to the guardrail
4. Allow the guardrail to either reject or forward

## Guardrail forward behaviour

If approved, the guardrail returns:

```json
{
  "status": "approved",
  "request_id": "req_<unique>",
  "forward_to": "troy-sql-executor-s2",
  "forwarded_event": { ... original envelope ... }
}
```

The bridge runner or orchestrator must then invoke `forward_to` using `forwarded_event`.

## Failure behaviour

If rejected, the bridge must:

- stop execution
- write audit row
- return rejection to caller
- classify as `PRETEND`

## Allowed fallback route

Only if `troy-sql-executor-s2` is unavailable, the guardrail may approve one of:

- `troy-sql-runner`
- `troy-sql-executor-fix`
- `troy-sql-executor`

All fallbacks must be logged with a `fallback_reason`.

## Non-canonical conditions

- bridge calls executor directly
- missing guardrail hop
- missing audit write
- missing request_id
- mutation of original SQL before validation

These must be treated as control-plane drift.
