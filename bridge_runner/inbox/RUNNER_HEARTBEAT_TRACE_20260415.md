# Runner Heartbeat + Trace Pack

Date: 2026-04-15
Purpose: prove whether the bridge runner is real end-to-end, and if not, expose the exact broken leg.

---

## Required output location

Write all outputs under:

`bridge_runner/outbox/runner_trace/20260415/`

Required files:

- `heartbeat.md`
- `watcher_status.md`
- `inbox_scan.md`
- `handler_match.md`
- `writeback_test.md`
- `runner_trace_summary.md`

---

## Required checks

### 1. Heartbeat
Produce a heartbeat file proving the runner is active now.

`heartbeat.md` must include:
- current runtime timestamp
- executor identity
- host/runtime name if available
- repo being watched
- branch being watched
- inbox paths being watched
- outbox paths being written

### 2. Watcher status
Produce `watcher_status.md` including:
- watcher/poller mechanism
- schedule source (cron, EventBridge, GitHub Action, other)
- configured interval
- last successful run time
- last failed run time
- next planned run time if available

### 3. Inbox scan
Produce `inbox_scan.md` including:
- whether `bridge_runner/inbox/` is actively scanned
- whether `CLOSURE_MERGE_SWEEP_20260415.md` was detected
- detection timestamp
- parsed job type
- parse success/failure
- reason if skipped

### 4. Handler match
Produce `handler_match.md` including:
- handler selected for `CLOSURE_MERGE_SWEEP_20260415.md`
- whether that handler exists
- whether multi-LLM fan-out is supported
- whether write-back is supported
- exact reason for any mismatch or unsupported job

### 5. Write-back test
Produce `writeback_test.md` including:
- ability to write a test file to `bridge_runner/outbox/runner_trace/20260415/`
- success/failure result
- commit SHA if successful
- exact error if unsuccessful

### 6. Summary
Produce `runner_trace_summary.md` including:
- REAL / PARTIAL / PRETEND classification for the bridge runner
- which step failed first
- exact blocker
- exact next repair action
- whether the closure merge sweep job can be recovered automatically now

---

## Recovery rule

If the runner can write back but failed to process the earlier closure merge sweep request, it must immediately:
1. re-scan `bridge_runner/inbox/CLOSURE_MERGE_SWEEP_20260415.md`
2. process it
3. write:
   - `gpt_response.md`
   - `claude_response.md`
   - `perplexity_response.md`
   - `bridge_runner_summary.md`
4. state in `runner_trace_summary.md` that recovery was performed

---

## Non-negotiable behaviour

- Do not claim success without files written to outbox
- Do not mark runner REAL without heartbeat + write-back proof
- Do not hide unsupported handler states
- Do not stop at diagnosis if auto-recovery is possible
- Prefer exact failure evidence over explanation
