# CKOS Status Request

Bridge runner: pick up `bridge_runner/ckos_control_plane/bridge_runner_manifest.json` and execute.

## Required return evidence
1. SQL applied for `knowledge-system/supabase/sql/001_ckos_schema.sql`
2. Lambda deployed for `troy-ckos-runtime`
3. Smoke test result for CKOS guard
4. Any deployment errors
5. Closure record classification: REAL / PARTIAL / PRETEND

## Expected target state
- CKOS schema live in Supabase
- CKOS runtime deployed
- bridge-ready guarded execution path available
