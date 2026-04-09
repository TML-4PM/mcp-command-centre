# Bridge Runner Contract — Intel Stack

## Purpose
This document defines exactly how Bridge Runner should pick up, execute, and drop off work for the Intel Stack.

## Repo location
- Repository: `TML-4PM/mcp-command-centre`
- Branch: `feat/intel-stack-bridge-pack`
- Root path: `intel_stack/`

## Pickup contract
Bridge Runner should fetch the following files from the repo branch:

### Required files
- `intel_stack/README.md`
- `intel_stack/sql/intel_schema.sql`
- `intel_stack/local/requirements.txt`
- `intel_stack/local/watcher.py`
- `intel_stack/local/challenge_runner.py`

### Optional next files to expect
- `intel_stack/local/gmail_sync.py`
- `intel_stack/local/daily_digest.py`
- `intel_stack/lambda/intel_gmail_sync.py`
- `intel_stack/lambda/intel_challenge_engine.py`
- `intel_stack/widgets/intel_overview.widget.json`

## Local execution contract
### Python environment
```bash
cd intel_stack
python3 -m venv .venv
source .venv/bin/activate
pip install -r local/requirements.txt
```

### Run watcher
```bash
python local/watcher.py
```

### Run challenge engine
```bash
python local/challenge_runner.py
```

## Expected local paths
- Obsidian inbox target: `$HOME/Documents/ObsidianVault/00_inbox`
- Watch targets: `$HOME/Downloads`, `$HOME/Desktop`

## Bridge pickup shape
Bridge Runner can treat GitHub as source-of-truth pickup.

```json
{
  "pickup": {
    "type": "github",
    "repository_full_name": "TML-4PM/mcp-command-centre",
    "branch": "feat/intel-stack-bridge-pack",
    "root_path": "intel_stack"
  }
}
```

## Drop-off contract
After execution, Bridge Runner should drop off results in one or more of the following ways.

### A. GitHub drop-off
Commit generated or updated artefacts back into the same branch under:
- `intel_stack/runtime_logs/`
- `intel_stack/reports/`
- `intel_stack/exports/`
- `intel_stack/bridge/dropoff/`

Suggested filenames:
- `intel_stack/runtime_logs/runner_YYYYMMDD_HHMMSS.log`
- `intel_stack/reports/daily_digest_YYYYMMDD.md`
- `intel_stack/exports/campaign_activity_YYYYMMDD.csv`
- `intel_stack/bridge/dropoff/status_YYYYMMDD_HHMMSS.json`

### B. Bridge API drop-off
If Bridge Runner is using MCP Bridge API, return status using this envelope:

```json
{
  "status": "SUCCESS",
  "request_id": "intel-run-20260409-001",
  "function_name": "intel-stack-runner",
  "data": {
    "files_written": [
      "intel_stack/reports/daily_digest_20260409.md",
      "intel_stack/bridge/dropoff/status_20260409_201500.json"
    ],
    "notes_processed": 12,
    "emails_processed": 0,
    "challenges_generated": 1
  },
  "error": null,
  "logs": [
    "watcher started",
    "challenge runner complete"
  ],
  "execution_time_ms": 1844
}
```

### C. Command Centre drop-off
If wired into Command Centre, Bridge Runner should refresh or write widget artefacts into:
- `intel_stack/widgets/`
- `intel_stack/bridge/dropoff/command_centre_status.json`

## Minimum success criteria
Bridge Runner execution is successful when:
1. watcher executes without fatal error
2. at least one markdown capture lands in Obsidian inbox or test path
3. challenge runner completes
4. a drop-off status file is written

## Failure contract
If blocked, write:
- `intel_stack/bridge/dropoff/failure_YYYYMMDD_HHMMSS.json`

Shape:
```json
{
  "status": "FAILED",
  "stage": "pickup|runtime|dropoff",
  "error": "plain English error",
  "next_action": "exact remediation step"
}
```

## Exact pickup + drop-off summary
### Pickup
- Pull branch `feat/intel-stack-bridge-pack`
- Read files under `intel_stack/`
- Create venv
- Run watcher and challenge runner

### Drop-off
- Write logs / reports / exports into repo paths above
- Optionally post Bridge API result envelope
- Leave machine-readable status JSON under `intel_stack/bridge/dropoff/`
