# SQL Bridge Wiring (Final State)

## Target architecture

Agent -> Bridge -> Guardrail -> Executor -> Audit -> Command Centre

## What must change

### BEFORE

Agent -> Executor (direct)

### AFTER

Agent -> Bridge -> Guardrail -> Executor

## Bridge responsibilities

1. Intercept all SQL execution requests
2. Rewrite invocation target to `troy-sql-guardrail`
3. Pass original payload through unchanged
4. Wait for guardrail decision
5. If approved, invoke executor using returned event
6. Log result to audit table

## Enforcement rule

Any direct invocation of `troy-sql-executor-s2` must be:

- flagged
- logged
- classified as PRETEND

## Testing

### Valid request

- should pass guardrail
- should execute SQL
- should appear in audit

### Invalid request

- should be rejected
- should not reach executor

## Completion condition

System is complete when:

- no SQL reaches executor without guardrail
- all executions appear in audit
- replay works for any request_id

## Warning

If this wiring is not enforced, the control plane is bypassable.
