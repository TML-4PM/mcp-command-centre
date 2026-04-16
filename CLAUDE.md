# T4H Claude Code Context

## Identity
Troy Latter — Tech 4 Humanity Pty Ltd (ABN 70 666 271 272)
Solo founder. 30 canonical businesses. AWS ap-southeast-2 (account 140548542136). Supabase S1: lzfgigiyqpuuxslsygjt.

## Bridge (single execution engine)
```
POST https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke
Header: x-api-key: bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4
Body:   {"fn":"<lambda-name>","payload":{...}}
```
- Payload key is `fn` NOT `lambda_name`
- SQL executor: `{"fn":"troy-sql-executor","payload":{"sql":"..."}}`
- No trailing semicolons → silent empty rows
- No `$$`-quoted PL/pgSQL — use Supabase REST `run_sql` RPC for full DDL
- S2 (pflisxkcxbzboxwidywf) = READ-ONLY, no writes

## Autonomy tiers
- AUTONOMOUS: SELECTs, views, RPCs, schema inspection, indexes
- LOG-ONLY: INSERTs/UPDATEs — log action|target|result|utc
- GATED: DELETE/DROP, CFN deploys, RLS changes — dry-run first, then exec
- BLOCKED: IAM, DNS, payment flows, credential rotation — stop and flag

## Quality bar
- No TODOs or placeholders
- All tables: RLS enabled, PK, timestamps
- All assets registered: `core.registry_entities` + `mcp_lambda_registry`
- Archive over delete (`ops.close_entity()` is canonical closure path)
- Idempotent writes. Rollback path documented before GATED actions.
- RDTI tag at creation: `is_rd=true` + `project_code`

## Evidence classification
- REAL: runtime proof (rows returned, HTTP 200, CloudWatch confirmed)
- PARTIAL: some steps verified, not end-to-end
- PRETEND: assumed/hallucinated — reject and flag

## Key tables & views
- `core.registry_entities` — 394 active entities (canonical registry)
- `public.mcp_lambda_registry` — Lambda inventory (ACTIVE=377, join key: `'lambda.' || function_name`)
- `public.v_entity_drift` — drift view: ZOMBIE/MISSING/ORPHAN/STALE categories
- `cap_secrets` — 11-col credentials store (key/value/description/is_encrypted/timestamps×3/is_canonical/is_deprecated/notes)
- `maat_timesheets` — `hours_worked` column (not `hours`)
- `command_centre_queries` — uses `key` + `page_id` (not `query_key`/`page_key`)
- `t4h_ui_snippet` — unique on (slug) not (slug,page_key)
- `v_pl_master`, `v_bas_quarterly_summary`, `v_rdti_by_fy` — canonical financial views
- `public.t4h_task_queue` — UUID PK

## Drift baseline (as of 2026-04-17)
- ZOMBIE_NO_INVOCATION_30D: 233
- LAMBDA_MISSING_FROM_REGISTRY: 70
- REGISTRY_ORPHAN: 39
- REGISTRY_STALE_LAMBDA_RETIRED: 1

## Notifications
- Telegram bot token: stored in `cap_secrets` key=TELEGRAM_BOT_TOKEN
- Telegram chat ID: stored in `cap_secrets` key=TELEGRAM_CHAT_ID
- Send via: `POST https://api.telegram.org/bot{token}/sendMessage`

## Compliance flags (open)
- BAS FY25-26 Q1+Q2: OVERDUE — lodge ASAP
- Div7A balance: $371,699 — MYR $72,299 due 30 Jun 2026
- RDTI: submitted PYV4R3VPW, $929,504 refund pending

## Stack
- GitHub org: TML-4PM
- Vercel team: team_IKIr2Kcs38KGo8Zs60yNtm7Y
- EC2 primary: i-09f18f2e1123a5702 (ap-southeast-2)
- Control Plane: schema `core/ops/runtime/cc`, autonomy default=GATED
- `gilroys-painting-lead-alert` Lambda — DO NOT RENAME

## Execute first, explain after. No clarifying questions. No TODOs.
