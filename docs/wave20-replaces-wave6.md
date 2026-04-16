# Wave 20 Replacement Doc — Wave 6 Retirement
**Date:** 2026-04-17  
**Batch:** drift_cleanup_2026-04-17  
**Archive table:** `public.lambda_retirement_archive`  
**Status:** RETIRED — do not redeploy

---

## Wave 6 → Wave 20 Mapping

| Wave 6 Lambda | Purpose | Wave 20 Replacement | Location |
|---|---|---|---|
| `troy-loop-runner` | Heartbeat — detect stuck, select next job, dispatch | Bridge runner crons 203/204/205 | EventBridge → `troy-bridge-runner` |
| `troy-coordinator` | Select next executable jobs and route | `bridge_canon_router.py` + `fn_t4h_task_dequeue()` | Control Plane + `t4h_task_queue` |
| `troy-executor-dispatch` | Translate jobs into bridge calls | `troy-worker` (SQS) + bridge direct invoke | `t4h_task_queue` SQS consumer |
| `troy-closure-writer` | Write evidence, classify claims, close jobs | `ops.close_entity()` + `troy-evidence_binder` | Supabase RPC + Lambda |
| `troy-observer` | Publish metrics and exception summaries | `t4h-morning-brief` (7am AEDT) + `v_entity_drift` | Lambda + Supabase view |
| `troy-sweeper-core` | Discover candidate work across all surfaces | `v_entity_drift` → `LAMBDA_MISSING_FROM_REGISTRY` | Supabase view (nightly routine) |
| `troy-sweeper-drift` | Detect stuck jobs and failure drift | `v_entity_drift` → `ZOMBIE_NO_INVOCATION_30D` | Supabase view (nightly routine) |
| `troy-sweeper-gap` | Classify missing wiring and linkage gaps | `v_entity_drift` → `REGISTRY_ORPHAN` | Supabase view (nightly routine) |

---

## Architecture Shift: Wave 6 → Wave 20

### Wave 6 model (Lambda-per-concern)
```
troy-loop-runner (cron)
  → troy-sweeper-core (discover)
    → troy-coordinator (select)
      → troy-executor-dispatch (translate)
        → troy-observer (observe)
          → troy-closure-writer (close)
```
Each concern = a separate Lambda. Trigger chain. No shared state visibility. Drift was invisible.

### Wave 20 model (Control Plane + Views)
```
EventBridge crons 203/204/205
  → troy-bridge-runner (polls bridge_runner/incoming/)
    → bridge_canon_router.py (routes to registered handlers)
      → t4h_task_queue (state machine)
        → troy-worker (executes)
          → ops.close_entity() / troy-evidence_binder (closes)

Observability layer (runs independently):
  → v_entity_drift (always-on view)
  → t4h-morning-brief (daily summary)
  → nightly-entity-drift routine (Claude Code, 2am AEST)
```

Key differences:
- **State is visible at rest** — `t4h_task_queue`, `core.registry_entities`, `v_entity_drift` 
- **Drift is caught by the view**, not a Lambda that has to run
- **Closure is a DB operation** (`ops.close_entity()`), not a Lambda invocation
- **Observability is passive** — no Lambda needed to observe; views always reflect reality

---

## HoloOrg Old → New Mapping

| Retired (HoloOrg category) | Was for | Replacement |
|---|---|---|
| `holoorg-alert-author` | Alert authoring agent | `holo-morning-brief` (EVENTBRIDGE) — needs wiring |
| `holoorg-content-auditor` | Content audit agent | Absorbed into `holo-morning-brief` brief sections |
| `holoorg-freshness-watcher` | Content freshness monitoring | `holo-weekly-adaptive-tune` (EVENTBRIDGE) |
| `holoorg-neural-researcher` | Neural research agent | `holo-agent-pack-builder` (API_GATEWAY) |
| `holoorg-schema-verifier` | Schema verification | `v_entity_drift` + Control Plane schema enforcement |
| `holoorg-signal-harvester` | Signal harvesting | `holo-morning-brief` ingestion section |

**Outstanding:** `holo-morning-brief` and `holo-weekly-adaptive-tune` both have `trigger_type=EVENTBRIDGE` but no EventBridge rule deployed. Wire these next.

---

## Autonomy Workers Old → New

| Retired | Was for | Replacement |
|---|---|---|
| `autonomy-worker-dataops` | Data operations autonomy | CTEL `autonomy_tier=AUTONOMOUS` gate on `troy-sql-executor` |
| `autonomy-worker-financeops` | Finance operations autonomy | CTEL gate on MAAT Lambdas + `v_pl_master` |
| `autonomy-worker-taskops` | Task operations autonomy | `t4h_task_queue` + `fn_t4h_task_dequeue()` |
| `autonomy-worker-websiteops` | Website operations autonomy | `t4h-site-scan-launcher` + autofix Lambdas |

---

## Restore Instructions

If any retired Lambda needs to be restored:

1. **Find the restore SQL:**
```sql
SELECT function_name, restore_sql, wave20_replacement, retirement_reason
FROM public.lambda_retirement_archive
WHERE function_name = '<name>';
```

2. **Execute the restore SQL** (sets status back to ACTIVE in both tables)

3. **Re-assess** whether the Wave 20 replacement is actually covering the use case — if not, file a task in `t4h_task_queue` to wire the replacement properly before reactivating the retired Lambda.

---

## Next Actions (not this run)

| Priority | Action | Target |
|---|---|---|
| 🔴 HIGH | Wire `holo-morning-brief` EventBridge rule | HOLO product |
| 🔴 HIGH | Wire `holo-weekly-adaptive-tune` EventBridge rule | HOLO product |
| 🟡 MED | Confirm T4HFactoryStack-* CFN status in AWS | Factory pipeline |
| 🟡 MED | Wire `nf-*` NeuroForge EventBridge rules (5 Lambdas) | RDTI-relevant |
| 🟡 MED | Wire `outrd-gap-detector` + `outrd-closure-enforcer` crons | OUTRD revenue |
| 🟢 LOW | Wire `tk-dispatcher` EventBridge rule (unblocks 8 TK Lambdas) | OUTRD GTM |
