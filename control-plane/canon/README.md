# T4H Control Plane — Canon Injector

**Lambda:** `t4h-canon-injector`  
**ARN:** `arn:aws:lambda:ap-southeast-2:140548542136:function:t4h-canon-injector`  
**Status:** ACTIVE | python3.12 / arm64 | 512MB / 30s  
**RDTI:** `is_rd=true` · `project_code=CP-CANON-001`  
**Deployed:** 2026-04-15  

## Purpose

Enforces canonical cognition alignment across all LLM sessions. Detects drift from the T4H control-plane operating model, injects the universal canon, and logs all interventions to Supabase.

## Actions

| Action | Autonomy | Description |
|--------|----------|-------------|
| `control_plane.canon.check` | AUTONOMOUS | Detect drift, inject if needed, log session state |
| `control_plane.canon.inject` | AUTONOMOUS | Soft inject universal canon |
| `control_plane.canon.rebind` | AUTONOMOUS | Force reinterpretation of prior response |
| `control_plane.canon.quarantine` | GATED | Stop unsafe execution, recover safely |
| `control_plane.canon.nightly_audit` | AUTONOMOUS | Aggregate drift patterns across sessions |

## Bridge Invocation

```json
{
  "fn": "t4h-canon-injector",
  "payload": {
    "action": "control_plane.canon.check",
    "session_key": "sess_abc123",
    "model_family": "gpt",
    "input_text": "<last model response or prompt>",
    "metadata": {
      "biz_key": "t4h",
      "thread_key": "thread_xyz"
    }
  }
}
```

## Response

```json
{
  "inject": true,
  "command": "/canon-rebind",
  "canon": "<universal canon text>",
  "overlay": "<model-specific overlay if gpt>",
  "drift": {
    "score": 9,
    "severity": "rebind",
    "hits": ["missing_evidence", "missing_runtime"],
    "alignment_state": "REBOUND"
  }
}
```

## Drift Scoring

| Check | Weight |
|-------|--------|
| missing `evidence` | +3 |
| missing `runtime` | +3 |
| missing `registry` | +2 |
| missing `recovery`/`rollback` | +2 |
| `done` without `evidence` | +4 |

| Score | Severity | Command |
|-------|----------|---------|
| ≥9 | quarantine | `/canon-quarantine` |
| ≥6 | rebind | `/canon-rebind` |
| ≥3 | soft | `/canon` |
| 0 | none | — |

## Schema

**Schema:** `control_plane` (Supabase S1)

- `prompt_profile` — canon + model overlays
- `injection_rule` — drift trigger rules
- `session_state` — per-session alignment state
- `drift_event` — intervention log
- `command_registry` — canon command definitions

**Public bridge views** (REST-accessible):
- `public.v_cp_prompt_profile`
- `public.v_cp_session_state`
- `public.v_cp_injection_rule`

## Nightly Audit

EventBridge fires at 02:00 AEST (`cron(0 16 * * ? *)`).  
Action: `control_plane.canon.nightly_audit`

## Files

```
control-plane/canon/
├── template.yaml          # SAM deploy template
├── lambda/
│   └── bridge_canon_router.py   # Full handler (v1.2)
├── sql/
│   └── control_plane_canon.sql  # Schema + seeds (idempotent)
└── bridge-runner/
    └── CANON_INJECTOR_READY_PACK.md
```

## Related

- `bridge-runner-task-executor` — fixed 2026-04-15 (8 bugs: table names, RPC param, PK field, status casing)
- `bridge_incoming_queue` — packs detected and queued here
- `t4h_task_queue` / `t4h_task_run` — task execution + evidence chain
