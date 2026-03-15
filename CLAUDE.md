# T4H Claude Code Context

## Identity
Troy Latter — Tech 4 Humanity Pty Ltd (ABN 61 605 746 618)  
Solo founder. 28 canonical businesses. AWS ap-southeast-2. Supabase lzfgigiyqpuuxslsygjt.

## Bridge (single execution engine)
```
POST https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke
Header: x-api-key: bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4
Body:   {"fn":"troy-sql-executor","sql":"..."}
```

SQL executor handles DDL. Pooler required for Lambda DB connections.

## Autonomy tiers
- AUTONOMOUS: SELECTs, views, RPCs, schema inspection
- LOG-ONLY: INSERTs/UPDATEs to ops tables
- GATED: DELETE/DROP, code deploys, CFN — dry-run first
- BLOCKED: IAM, DNS, payment flows, cred rotation — confirm first

## Quality bar
- No TODOs or placeholders
- All tables: RLS enabled
- All assets: registered in mcp_lambda_registry + t4h_ui_snippet
- Archive over delete
- Delta over rewrite

## Key tables
- `t4h_canonical_28_first_pass` — 28 canonical businesses (frozen)
- `cap_secrets` — credentials store
- `mcp_lambda_registry` — all Lambda registrations
- `command_centre_queries` — CC page queries
- `t4h_ui_snippet` — UI widget registry
- `maat_transactions` — financial transactions

## Stack
- GitHub org: TML-4PM
- Vercel team: team_IKIr2Kcs38KGo8Zs60yNtm7Y
- AWS account: 140548542136

## Execute first, explain after. No clarifying questions.
