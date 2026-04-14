# LLM JSON Ingest + Open Thread Closure Pack

This pack instructs Bridge Runner to ingest the large Google Drive export `claude conversations all.json`, copy it to canonical S3 storage, stream-parse it into shards and derived registers, classify all discovered threads using REAL/PARTIAL/PRETEND truth states, and drive continuous closure loops until zero open non-blocked items remain.

## Source
- Google Drive file id: `1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs`
- Title: `claude conversations all.json`
- Created: `2026-04-12T22:09:14.667Z`
- Modified: `2026-04-12T22:31:51.716Z`

## Required actions
1. Pull/copy the source file from Google Drive into S3 raw storage.
2. Stream-parse without full memory load.
3. Emit per-conversation JSONL shards.
4. Build open-thread register, blocker register, closure candidates, and evidence manifest.
5. Bind derived records into closure/truth systems.
6. Publish runtime outputs to Command Centre.
7. Continue closure loop until all non-blocked items are closed.

## Expected outputs
- `llm-json/raw/claude/claude_conversations_all_20260412.json`
- `llm-json/shards/claude/*.jsonl`
- `llm-json/derived/open-thread-register/open_threads.csv`
- `llm-json/derived/open-thread-register/thread_register.parquet`
- `llm-json/derived/evidence/evidence_manifest.json`
- `llm-json/derived/summaries/daily_summary.md`

## Truth-state rules
- `REAL`: end-state exists, executed, evidenced, durable, closure registered
- `PARTIAL`: some real work exists but end-state incomplete
- `PRETEND`: described or drafted without proven operational completion

## Stop condition
Zero open non-blocked threads. Blocked items must be precisely isolated with evidence.
