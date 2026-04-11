# CKOS Control Plane Pack

This pack is intended for bridge runner pickup.

## Purpose
Route execution through CKOS so canonical knowledge is resolved before execution, gaps are recorded, and usage is logged.

## Included assets
- knowledge-system/lambda/troy_ckos_runtime.py
- knowledge-system/supabase/sql/001_ckos_schema.sql
- knowledge-system/IP_Canonical_Knowledge_Operating_System.md
- bridge_runner/ckos_control_plane/bridge_runner_manifest.json

## Runtime target
- CKOS runtime lambda: `troy-ckos-runtime`
- Default downstream SQL executor: `troy-sql-executor`

## Required environment
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CKOS_ENFORCEMENT_MODE
- CKOS_SQL_EXECUTOR_FUNCTION
- BRIDGE_INVOKE_URL
- T4H_BRIDGE_API_KEY
