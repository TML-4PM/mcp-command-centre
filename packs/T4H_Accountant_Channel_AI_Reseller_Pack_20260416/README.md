# T4H Accountant Channel AI Reseller Pack — Implementation Runbook

## Purpose
Deploy the accountant-channel white-label reseller system into the MCP command centre operating spine using bridge-first controls, RLS, audit evidence, and widget seeding.

## Pack location
`packs/T4H_Accountant_Channel_AI_Reseller_Pack_20260416`

## Contents
- `README.md`
- `MANIFEST.json`
- `FULL_ROLLOUT_SEQUENCE.md`
- `architecture/pack_to_28_businesses.md`
- `sql/001_bootstrap.sql`
- `sql/002_enums.sql`
- `sql/003_tables.sql`
- `sql/004_views.sql`
- `sql/005_rls.sql`
- `sql/006_seed_partner_demo.sql`
- `sql/007_registry_and_economic_layer.sql`
- `ui/widget_registry_seed.sql`
- `ui/white_label_schema.json`
- `bridge-payloads/*.json`
- `bridge-payloads/deploy_sequence_manifest.json`
- `lambdas/*`
- `python/accountant_channel_common/*`
- `docs/IMPLEMENTATION_RUNBOOK.md`
- `docs/DEPLOYMENT_CHECKLIST.md`

## What was enhanced
- Added `007_registry_and_economic_layer.sql` to bind this pack into registry patterns already used across T4H.
- Added explicit registry hooks for `mcp_lambda_registry`, `command_centre_queries`, and `t4h_ui_snippet` compatibility.
- Added deployment sequence manifest for bridge runner orchestration.
- Added deployment checklist for dry-run, exec, aliasing, smoke, rollback.

## Deployment doctrine
- Dry-run every SQL and lambda action first.
- No direct app writes outside the bridge.
- Evidence before REAL.
- Archive over delete.
- Register lambdas and widgets before exposing the partner dashboard.

## Recommended execution order
1. `bridge-payloads/sql_dry_run_bootstrap.json`
2. `bridge-payloads/sql_exec_bootstrap.json`
3. `ui/widget_registry_seed.sql`
4. build lambda bundles with `lambdas/build_bundles.sh`
5. `bridge-payloads/deploy_dry_run_partner_onboarding.json`
6. `bridge-payloads/deploy_exec_partner_onboarding.json`
7. `bridge-payloads/manager_dry_run_prod_alias.json`
8. `bridge-payloads/manager_exec_prod_alias.json`
9. `bridge-payloads/pilot_onboard_10_clients.json`
10. smoke-test margin, onboarding, summary, cashflow, vcfo, compliance

## Required environment
- `BRIDGE_URL`
- `BRIDGE_API_KEY`
- `SQL_EXECUTOR_FUNCTION_NAME`
- package-specific lambda deployment variables in your bridge/deployer path

## Registry hooks expected
- `public.mcp_lambda_registry`
- `public.command_centre_queries`
- `public.t4h_ui_snippet`

## Rollback
- Move aliases off the new lambdas.
- Disable pack-specific widget slugs.
- Archive seeded demo partner rows if needed.
- Leave audit records in place.
