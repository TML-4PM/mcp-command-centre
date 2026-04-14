# EXECUTE NOW

Bridge runner should immediately execute `bridge_runner/ckos_control_plane/bridge_runner_manifest.json`.

## Execution steps
1. Apply `knowledge-system/supabase/sql/001_ckos_schema.sql`
2. Deploy `knowledge-system/lambda/troy_ckos_runtime.py` as `troy-ckos-runtime`
3. Run manifest smoke test
4. Return evidence into repo or status channel

## Required evidence
- SQL applied successfully
- Lambda deployed successfully
- CKOS guard smoke test response
- Classification: REAL / PARTIAL / PRETEND
