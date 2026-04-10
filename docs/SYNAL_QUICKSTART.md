# SYNAL QUICKSTART

## 1. Apply database
Run core migrations in Supabase.

## 2. Deploy lambdas
- synal-ingest-handler
- synal-repair-worker
- synal-command-worker

## 3. Run ingest test
Use:
bridge/payloads/synal/ingest_demo.json

## 4. Run smoke test
Use:
bridge/payloads/synal/smoke_test.json

## 5. Check UI
Load:
ui/synal_home_widget.html

## Expected outcome
- signals appear
- asset counts update
- system begins forming pipeline

## Next
Add scheduler + repair loop
