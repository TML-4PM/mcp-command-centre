# SQL Execution Sealed Policy

Status: Sealed  
Scope: All SQL execution across agents, bridge jobs, runtime packs, and Command Centre actions.

## Core rule

Direct invocation of any SQL executor is forbidden unless the request is explicitly marked as break-glass recovery.

## Mandatory path

```text
Agent -> MCP Bridge -> troy-sql-guardrail -> approved executor -> audit -> Command Centre -> Reality Ledger
```

## Non-bypass rules

The following conditions must cause hard rejection:

1. `troy-sql-executor-s2` invoked directly
2. missing guardrail hop
3. missing audit write
4. missing metadata
5. missing request_id
6. rewritten SQL after validation and before execution
7. executor chosen outside approved fallback set

## Break-glass path

Break-glass is allowed only when all are true:

- `approval_required = true`
- `auth_context = break_glass`
- `break_glass_reason` present
- audit write succeeds
- reality classification is at most `PARTIAL` until replay verification completes

## Fallback rules

Approved fallback order:

1. `troy-sql-executor-s2`
2. `troy-sql-runner`
3. `troy-sql-executor-fix`
4. `troy-sql-executor`

Fallbacks require:

- `fallback_reason`
- original target function
- chosen fallback function
- audit write

## Enforcement result mapping

- approved + audited + replay match = REAL
- approved + audited + no replay yet = PARTIAL
- rejected or bypassed = PRETEND

## Completion standard

A SQL execution system is not complete unless:

- executor cannot be reached without guardrail
- every run is auditable
- every run is replayable
- every run is classifiable in the Reality Ledger
