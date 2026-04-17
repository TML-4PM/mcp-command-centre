# READY FOR BRIDGE RUNNER

## Status
This pack is the canonical Bridge Runner pickup for the Intel Stack.

## Pickup
- Repo: `TML-4PM/mcp-command-centre`
- Branch: `feat/intel-stack-bridge-pack`
- Root path: `intel_stack/`

## Required runtime files
- `intel_stack/local/common.py`
- `intel_stack/local/gmail_sync_live.py`
- `intel_stack/local/scoring_engine.py`
- `intel_stack/local/auto_outreach.py`
- `intel_stack/local/customer_loop.py`
- `intel_stack/local/reply_classifier.py`
- `intel_stack/local/thread_advancer.py`
- `intel_stack/local/send_executor.py`
- `intel_stack/local/requirements.txt`
- `intel_stack/widgets/intel_scoring.widget.json`
- `intel_stack/widgets/intel_status.widget.json`
- `.github/workflows/intel_stack_on_push.yml`

## Required secrets
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GMAIL_USER`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `BRIDGE_API_URL`
- `BRIDGE_API_KEY`

## Execution order
1. `python local/gmail_sync_live.py`
2. `python local/reply_classifier.py`
3. `python local/thread_advancer.py`
4. `python local/customer_loop.py`
5. `python local/scoring_engine.py`
6. `python local/auto_outreach.py`
7. `python local/send_executor.py`

## Drop-off outputs
- `intel_stack/exports/ranked_targets.csv`
- `intel_stack/bridge/dropoff/gmail_sync_status.json`
- `intel_stack/bridge/dropoff/reply_classifier_status.json`
- `intel_stack/bridge/dropoff/thread_advancer_status.json`
- `intel_stack/bridge/dropoff/customer_loop_status.json`
- `intel_stack/bridge/dropoff/scoring_status.json`
- `intel_stack/bridge/dropoff/outreach_plan.json`
- `intel_stack/bridge/dropoff/send_executor_status.json`

## GitHub Actions trigger
This repo now contains `.github/workflows/intel_stack_on_push.yml` which should auto-run on pushes touching `intel_stack/**` once secrets are configured.

## Bridge Runner instruction
Use this pack as the source of truth. Do not search elsewhere. If a file is missing at runtime, fail fast and report the missing path in `intel_stack/bridge/dropoff/run_status.json`.
