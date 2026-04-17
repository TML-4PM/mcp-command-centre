# Bridge Runner Contract — Intel Stack
_Source of truth for T4H automation. Version 2.0 — 2026-04-09_

## Purpose
Defines exactly how T4H's Lambda Bridge picks up, executes, and drops off work for the Intel Stack. This is a machine-executable contract — every field is used by automation.

---

## Bridge Endpoint
```
POST https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke
x-api-key: <from cap_secrets key=BRIDGE_API_KEY>
Content-Type: application/json
```

All invocations use this single endpoint. The `fn` field routes to the target Lambda.

---

## Repo Location
- Repository: `TML-4PM/mcp-command-centre`
- Branch: `feat/intel-stack-bridge-pack`
- Root path: `intel_stack/`
- Supabase: S1 (`lzfgigiyqpuuxslsygjt`), schema `intel`

---

## Pickup Contract

### Invoke shape
```json
{
  "fn": "troy-fire-orchestrator",
  "payload": {
    "action": "run_intel_pack",
    "branch": "feat/intel-stack-bridge-pack",
    "root_path": "intel_stack",
    "files": [
      "intel_stack/sql/intel_schema.sql",
      "intel_stack/local/watcher.py",
      "intel_stack/local/challenge_runner.py"
    ]
  }
}
```

### Required files (pickup)
| File | Purpose |
|------|---------|
| `intel_stack/sql/intel_schema.sql` | Apply to S1 Supabase schema `intel` |
| `intel_stack/local/watcher.py` | File ingestion loop |
| `intel_stack/local/challenge_runner.py` | Assumption challenge engine |

### Optional next files (future pickups)
- `intel_stack/local/gmail_sync.py`
- `intel_stack/local/daily_digest.py`
- `intel_stack/lambda/intel_gmail_sync.py`
- `intel_stack/lambda/intel_challenge_engine.py`
- `intel_stack/widgets/intel_overview.widget.json`

---

## Execution Contract

### Schema migration
Apply `intel_schema.sql` to S1 Supabase via bridge:
```json
{
  "fn": "troy-fire-orchestrator",
  "payload": {
    "action": "run_sql",
    "target": "s1",
    "schema": "intel",
    "sql_file": "intel_stack/sql/intel_schema.sql"
  }
}
```

### Watcher execution (Lambda-triggered, not local)
Watcher logic runs inside a Lambda or EventBridge-triggered function, not a local venv.
```json
{
  "fn": "troy-task-orchestrator",
  "payload": {
    "lane": "build",
    "task": "intel_watcher_run",
    "watch_paths": ["s3://t4h-intel-inbox/"],
    "obsidian_target": "intel_stack/runtime_logs/"
  }
}
```

### Challenge engine
```json
{
  "fn": "troy-task-orchestrator",
  "payload": {
    "lane": "admin",
    "task": "intel_challenge_run",
    "date": "YYYY-MM-DD"
  }
}
```

---

## Drop-off Contract

### A. Supabase drop-off (primary)
All execution results write to S1 Supabase, schema `intel`:

| Table | What gets written |
|-------|------------------|
| `intel.notes` | Captured file content |
| `intel.assumptions` | Generated challenges |
| `intel.decisions` | Decision outputs |
| `intel.email_events` | Gmail-sourced events |
| `intel.run_log` | Bridge run status per execution |

### B. Bridge API response envelope
```json
{
  "status": "SUCCESS",
  "request_id": "intel-run-YYYYMMDD-NNN",
  "fn": "troy-fire-orchestrator",
  "data": {
    "files_written": [
      "intel_stack/runtime_logs/runner_YYYYMMDD_HHMMSS.log"
    ],
    "notes_processed": 0,
    "emails_processed": 0,
    "challenges_generated": 0,
    "supabase_rows_written": 0
  },
  "error": null,
  "logs": [],
  "execution_time_ms": 0
}
```

### C. GitHub drop-off (logs + reports only)
Commit generated artefacts into branch under:
- `intel_stack/runtime_logs/runner_YYYYMMDD_HHMMSS.log`
- `intel_stack/reports/daily_digest_YYYYMMDD.md`
- `intel_stack/bridge/dropoff/status_YYYYMMDD_HHMMSS.json`

---

## Minimum Success Criteria
Bridge execution is successful when ALL of the following are true:
1. `intel_schema.sql` applied idempotently (no fatal error)
2. At least one row written to `intel.notes` or `intel.run_log`
3. Challenge runner completes — row written to `intel.assumptions`
4. Drop-off status JSON written to `intel_stack/bridge/dropoff/`

---

## Failure Contract
On any failure, write to `intel_stack/bridge/dropoff/failure_YYYYMMDD_HHMMSS.json`:

```json
{
  "status": "FAILED",
  "stage": "pickup|schema|runtime|dropoff",
  "fn": "troy-fire-orchestrator",
  "error": "plain English error description",
  "next_action": "exact remediation step",
  "rollback": "idempotent — re-run safe"
}
```

---

## RDTI Classification
- `is_rd: true`
- `project_code: INTEL-01`
- `category: automation_infrastructure`
- All Lambda invocations are RDTI-eligible R&D activity under T4H FY25-26 programme

---

## Next Steps (unblocked after merge)
1. Add Lambda `intel-gmail-sync` — reads Gmail via BASIQ/OAuth, writes to `intel.email_events`
2. Add CCQ widget — reads `intel.notes` + `intel.assumptions`, renders to Command Centre
3. Schedule pg_cron job — daily challenge run at 06:00 AEST
4. Wire `intel.run_log` to health monitor dashboard
