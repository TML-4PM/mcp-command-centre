#!/usr/bin/env bash
set -e

echo "Checking Synal core files..."

required=(
  "supabase/migrations/20260410_001_synal_core.sql"
  "supabase/migrations/20260410_002_synal_ops.sql"
  "lambdas/synal_ingest_handler.py"
  "lambdas/synal_repair_worker.py"
)

for f in "${required[@]}"; do
  if [ ! -f "$f" ]; then
    echo "Missing: $f"
    exit 1
  fi
  echo "OK: $f"
done

echo "Synal basic validation complete"
