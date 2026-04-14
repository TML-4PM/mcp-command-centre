#!/usr/bin/env bash
# run_chat_archive_pipeline.sh
# Bridge Runner entrypoint. Mac = endpoint only.
set -euo pipefail

TASK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${STATE_DIR:-$TASK_ROOT/state}"
LOG_DIR="${LOG_DIR:-$TASK_ROOT/logs}"
mkdir -p "$STATE_DIR" "$LOG_DIR"

[[ -f "$TASK_ROOT/.env" ]] && source "$TASK_ROOT/.env"

: "${CHAT_ARCHIVE_S3_BUCKET:?CHAT_ARCHIVE_S3_BUCKET required}"
: "${GOOGLE_APPLICATION_CREDENTIALS:?GOOGLE_APPLICATION_CREDENTIALS required}"

: "${CHAT_ARCHIVE_S3_PREFIX:=llm-chat-archives}"
: "${CHAT_ARCHIVE_ANALYSIS_PREFIX:=analysis}"
: "${GOOGLE_DRIVE_FILE_ID:=1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs}"
: "${CHAT_ARCHIVE_INTERVAL_SECONDS:=1800}"
: "${AWS_REGION:=ap-southeast-2}"

SUPABASE_ARGS=""
if [[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_KEY:-}" ]]; then
  SUPABASE_ARGS="--supabase-url $SUPABASE_URL --supabase-key $SUPABASE_SERVICE_KEY"
  [[ -n "${SUPABASE_ARCHIVE_TABLE:-}" ]] && SUPABASE_ARGS="$SUPABASE_ARGS --supabase-table $SUPABASE_ARCHIVE_TABLE"
fi

FORCE_ARG=""
[[ "${FORCE_REANALYSIS:-0}" == "1" ]] && FORCE_ARG="--force"

run_once() {
  local ts
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  python3 "$TASK_ROOT/chat_archive_pipeline.py" \
    --bucket "$CHAT_ARCHIVE_S3_BUCKET" \
    --prefix "$CHAT_ARCHIVE_S3_PREFIX" \
    --analysis-prefix "$CHAT_ARCHIVE_ANALYSIS_PREFIX" \
    --state-dir "$STATE_DIR" \
    --drive-file-id "$GOOGLE_DRIVE_FILE_ID" \
    --log-json "$LOG_DIR/pipeline-${ts}.json" \
    $SUPABASE_ARGS \
    $FORCE_ARG
}

if [[ "${1:-}" == "--loop" ]]; then
  echo "Starting continuous loop (interval=${CHAT_ARCHIVE_INTERVAL_SECONDS}s)"
  while true; do
    run_once || echo "[WARN] run failed, continuing loop"
    sleep "$CHAT_ARCHIVE_INTERVAL_SECONDS"
  done
else
  run_once
fi
