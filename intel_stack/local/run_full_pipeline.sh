#!/bin/bash
set -e

echo "=== INTEL STACK FULL RUN ==="

python local/watcher.py &
WATCH_PID=$!

sleep 3

python local/gmail_sync.py
python local/supabase_sync.py
python local/challenge_runner.py

kill $WATCH_PID || true

echo "=== COMPLETE ==="
