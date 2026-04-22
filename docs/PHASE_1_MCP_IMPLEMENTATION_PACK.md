# Phase 1 MCP Implementation Pack

## Goal

Build the first control-plane layer that makes the live MCP server operationally honest.

This phase adds:

- registry visibility
- execution traceability
- reality classification
- evidence attachment
- duplicate prevention
- blockers and active run reporting

It does **not** attempt to solve every future workflow or commercial use case yet.

---

## Phase 1 MCP tools to implement

### Required tools

1. `log_event`
2. `attach_evidence`
3. `get_execution_trace`
4. `classify_reality_state`
5. `compute_operation_hash`
6. `detect_duplicate_execution`
7. `get_system_status`
8. `get_active_runs`
9. `get_blockers`
10. `reconcile_registry_vs_runtime`

---

## Runtime design

### Execution model

Every materially important action should create or update an execution record.

Core fields:

- `execution_id`
- `capability_name`
- `capability_version`
- `operation_key`
- `operation_hash`
- `requested_by`
- `resolved_identity_context`
- `autonomy_tier`
- `target_system`
- `target_ref`
- `status`
- `reality_state`
- `started_at`
- `completed_at`
- `error_code`
- `error_detail`
- `rollback_ref`

### Evidence model

Evidence is append-only.

Core fields:

- `evidence_id`
- `execution_id`
- `evidence_type`
- `uri`
- `payload_json`
- `content_hash`
- `captured_at`
- `captured_by`
- `source_system`

### Event model

Telemetry/log events should support timeline reconstruction.

Core fields:

- `event_id`
- `execution_id`
- `event_type`
- `level`
- `message`
- `event_json`
- `created_at`

---

## SQL starter schema

```sql
create extension if not exists pgcrypto;

create schema if not exists control_plane;

create table if not exists control_plane.capability_registry (
  id uuid primary key default gen_random_uuid(),
  capability_name text not null unique,
  capability_version text not null,
  owner text,
  runtime_target text,
  autonomy_tier text not null default 'AUTO',
  supports_dry_run boolean not null default false,
  supports_rollback boolean not null default false,
  idempotent boolean not null default false,
  writes_state boolean not null default false,
  emits_metrics boolean not null default true,
  reality_requirement text not null default 'evidence_required',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists control_plane.executions (
  id uuid primary key default gen_random_uuid(),
  capability_name text not null,
  capability_version text,
  operation_key text,
  operation_hash text,
  requested_by text,
  resolved_identity_context jsonb not null default '{}'::jsonb,
  autonomy_tier text not null default 'AUTO',
  target_system text,
  target_ref text,
  status text not null default 'running',
  reality_state text not null default 'PARTIAL',
  error_code text,
  error_detail text,
  rollback_ref text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists executions_operation_hash_uidx
  on control_plane.executions(operation_hash)
  where operation_hash is not null;

create table if not exists control_plane.execution_events (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references control_plane.executions(id) on delete cascade,
  event_type text not null,
  level text not null default 'info',
  message text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists control_plane.execution_evidence (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references control_plane.executions(id) on delete cascade,
  evidence_type text not null,
  uri text,
  payload_json jsonb not null default '{}'::jsonb,
  content_hash text,
  source_system text,
  captured_by text,
  captured_at timestamptz not null default now()
);

create or replace view control_plane.v_active_runs as
select
  id,
  capability_name,
  status,
  reality_state,
  started_at,
  now() - started_at as running_for,
  target_system,
  target_ref
from control_plane.executions
where status in ('queued','running','retrying');

create or replace view control_plane.v_blockers as
select
  id,
  capability_name,
  status,
  reality_state,
  error_code,
  error_detail,
  started_at,
  completed_at
from control_plane.executions
where status in ('failed','blocked')
   or reality_state in ('PARTIAL','PRETEND');
```

---

## MCP tool contract sketches

### `log_event`

**Input**

```json
{
  "executionId": "uuid",
  "eventType": "lambda.invoked",
  "level": "info",
  "message": "Invoked target lambda",
  "event": {"functionName": "foo"}
}
```

**Effect**

- append row to `control_plane.execution_events`

---

### `attach_evidence`

**Input**

```json
{
  "executionId": "uuid",
  "evidenceType": "api_response",
  "uri": "s3://bucket/path.json",
  "payload": {"status": 200},
  "contentHash": "sha256:...",
  "sourceSystem": "aws_lambda"
}
```

**Effect**

- append row to `control_plane.execution_evidence`
- optionally trigger reality-state recalculation

---

### `get_execution_trace`

**Input**

```json
{ "executionId": "uuid" }
```

**Returns**

- execution row
- ordered events
- evidence list
- current reality classification

---

### `classify_reality_state`

**Input**

```json
{ "executionId": "uuid" }
```

**Suggested rules**

- `REAL`: execution completed and evidence exists
- `PARTIAL`: execution completed but evidence missing or incomplete, or execution still running
- `PRETEND`: claimed success contradicted by missing execution/evidence or explicit failure

---

### `compute_operation_hash`

**Input**

```json
{
  "capabilityName": "gdrive_search",
  "targetSystem": "gdrive",
  "payload": {"query": "T4H Shared folder"}
}
```

**Implementation**

- canonical JSON serialisation
- SHA-256 hash

---

### `detect_duplicate_execution`

**Input**

```json
{ "operationHash": "sha256:..." }
```

**Returns**

- duplicate found true/false
- matching execution ids if any

---

### `get_system_status`

**Returns**

- registered capability counts
- active runs count
- blockers count
- evidence lag count
- last event timestamp
- runtime drift count

---

### `get_active_runs`

**Returns**

- rows from `control_plane.v_active_runs`

---

### `get_blockers`

**Returns**

- rows from `control_plane.v_blockers`

---

### `reconcile_registry_vs_runtime`

**Goal**

Compare:

- capabilities declared in registry
- capabilities exposed by live MCP tool list

**Returns**

- registered not live
- live not registered
- version mismatches
- inactive but callable mismatches

---

## Lambda / handler layout recommendation

```text
mcp-server/
  tools/
    control-plane/
      log-event.ts
      attach-evidence.ts
      get-execution-trace.ts
      classify-reality-state.ts
      compute-operation-hash.ts
      detect-duplicate-execution.ts
      get-system-status.ts
      get-active-runs.ts
      get-blockers.ts
      reconcile-registry-vs-runtime.ts
  lib/
    db/
      control-plane.ts
    reality/
      classifier.ts
    hashing/
      operation-hash.ts
```

---

## Tool registration recommendation

All Phase 1 tools should be:

- `AUTO` for read and classify tools
- `LOG` for append-only write tools like `log_event` and `attach_evidence`

None of these should require destructive privileges.

---

## Definition of done

Phase 1 is complete only when:

1. each tool is callable from MCP
2. each tool writes/reads real Supabase state
3. duplicate execution detection works from `operation_hash`
4. `get_execution_trace` reconstructs timeline with evidence
5. Command Centre can render active runs, blockers, and reality state from live data
6. at least one runtime action is classified `REAL` based on attached evidence

---

## Blunt view

This phase does not make the system autonomous yet.

It makes the system:

- honest
- traceable
- non-ghosted
- evidence-backed

That is the right next step.
