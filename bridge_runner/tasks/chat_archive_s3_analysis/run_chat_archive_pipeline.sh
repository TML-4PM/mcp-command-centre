#!/usr/bin/env bash
set -euo pipefail

TASK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${STATE_DIR:-$TASK_ROOT/state}"
LOG_DIR="${LOG_DIR:-$TASK_ROOT/logs}"
mkdir -p "$STATE_DIR" "$LOG_DIR"

if [[ -f "$TASK_ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  source "$TASK_ROOT/.env"
fi

: "${CHAT_ARCHIVE_S3_BUCKET:?CHAT_ARCHIVE_S3_BUCKET is required}"
: "${CHAT_ARCHIVE_S3_PREFIX:=llm-chat-archives}"
: "${CHAT_ARCHIVE_LOCAL_ROOT:=/Users/${USER}/Downloads}"
: "${CHAT_ARCHIVE_ANALYSIS_PREFIX:=analysis}"
: "${CHAT_ARCHIVE_INTERVAL_SECONDS:=0}"

run_once() {
  local ts
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  python3 "$TASK_ROOT/chat_archive_pipeline.py" \
    --downloads-dir "$CHAT_ARCHIVE_LOCAL_ROOT" \
    --bucket "$CHAT_ARCHIVE_S3_BUCKET" \
    --prefix "$CHAT_ARCHIVE_S3_PREFIX" \
    --analysis-prefix "$CHAT_ARCHIVE_ANALYSIS_PREFIX" \
    --state-dir "$STATE_DIR" \
    --log-json "$LOG_DIR/pipeline-${ts}.json"
}

if [[ "${1:-}" == "--loop" ]]; then
  interval="${CHAT_ARCHIVE_INTERVAL_SECONDS}"
  if [[ "$interval" -le 0 ]]; then
    echo "CHAT_ARCHIVE_INTERVAL_SECONDS must be > 0 for loop mode" >&2
    exit 1
  fi

  while true; do
    run_once || true
    sleep "$interval"
  done
else
  run_once
fi
