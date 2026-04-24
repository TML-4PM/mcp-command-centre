# WIP EXECUTION PACKET — Bridge Runner / core.widgets unblock

## Authority

MAC is the endpoint. This packet is for WIP/Pen/Bridge execution only.

## Observed failure

```text
ERROR: 42P01: relation "core.widgets" does not exist
```

## Impact

| Area | Impact | State |
|---|---|---|
| Registry proof | Cannot query `core.widgets` | BLOCKED |
| Bridge Runner proof loop | Cannot complete DONE loop | BLOCKED |
| Promotion | Unsafe until runtime proof exists | BLOCKED |

## Required outcome

Create the missing registry table, seed the bridge-runner control-plane row, then return runtime proof.

## Source assets already committed

| Asset | Path |
|---|---|
| SQL migration | `bridge-runner/supabase/001_core_widgets_unblock.sql` |
| This packet | `bridge-runner/WIP_EXECUTION_PACKET.md` |
| Payload | `bridge-runner/payloads/core_widgets_unblock.payload.json` |

## Execution constraints

| Rule | Requirement |
|---|---|
| No destructive action | no drop/delete/truncate |
| Idempotent | safe to rerun |
| Archive not delete | failed runs stay logged |
| Runtime proof | required before done |
| Audit | write or return audit receipt |

## SQL to apply

Use the committed file:

`bridge-runner/supabase/001_core_widgets_unblock.sql`

## Required proof queries

```sql
select widget_id, category, status, name, created_at, updated_at, last_verified_at
from core.widgets
where widget_id = 'bridge_runner_control_plane';
```

Optional full checks after registry proof:

```sql
select * from ops.work_queue order by created_at desc limit 5;
select * from audit.log order by created_at desc limit 10;
select * from core.widgets order by created_at desc limit 5;
```

## Definition of done

| Check | Required result |
|---|---|
| `core` schema exists | yes |
| `core.widgets` exists | yes |
| PK on `widget_id` | yes |
| `bridge_runner_control_plane` row exists | yes |
| status | `active` |
| category | `control_plane` |
| receipt returned | yes |

## Receipt format

```json
{
  "unit": "bridge_runner_control_plane",
  "action": "core_widgets_unblock",
  "status": "completed_or_failed",
  "runtime": "supabase_or_bridge",
  "proof": {
    "core_widgets_row": "returned row or error"
  },
  "audit": {
    "written": true,
    "reference": "job/audit id if available"
  },
  "rollback": "archive-only; no destructive rollback"
}
```

## Current evidence

The migration has been committed to `main` at commit:

`ca42270cf1d3c7ffe8caa225a8724cab92b57ce5`

## Failure handling

| Failure | Meaning | Next action |
|---|---|---|
| relation still missing | SQL did not run against target DB | check bridge DB target/env |
| permission denied | service role or RLS path issue | route through allowlisted Supabase executor |
| seed missing | migration partially failed | rerun full migration idempotently |
| audit missing | audit path not wired | log manual receipt to WIP issue and patch audit next |
