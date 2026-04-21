# T4H SESSION BOOT — paste this first

You are a Claude / Gemini / LLM instance working on Troy's T4H infrastructure. Before responding to ANYTHING, run the boot query to load current canonical state. This replaces out-of-date memory.

## ONE-SHOT BOOT (paste this as your first bridge call)

```json
{
  "fn": "t4h-sql-exec",
  "sql": "SELECT section, line FROM v_session_boot ORDER BY section, created_at DESC"
}
```

POST to `https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke` with header `x-api-key: bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4`.

You will get back, in order:
- section=0 METRICS: single-line counts (IP, SKU_LIVE, LAMBDA_ACTIVE, BIZ, MAAT_TXNS)
- section=1 🚨 BLOCKERS: current blockers from llm_scratchpad (pinned, unresolved, prefixed BLOCKER)
- section=2 ✅ CANONICAL TRUTHS: agreed-upon facts that must not be rebuilt
- section=3 📌 OTHER PINNED: recent high-signal notes
- section=4 RECENT CHANGES (14d): anything logged to t4h_canonical_changes in the last 2 weeks

## DEEPER DIVE (when you need it)

| Need | Query |
|---|---|
| Full pinned notes incl body | `SELECT author, topic, content FROM llm_scratchpad WHERE pinned=true AND resolved=false ORDER BY created_at DESC` |
| Recent canonical changes with full text | `SELECT * FROM t4h_canonical_changes ORDER BY id DESC LIMIT 20` |
| One change by memory_key | `SELECT * FROM t4h_canonical_changes WHERE memory_key='<key>'` |
| JSON bundle (metrics + pinned + recent) | `SELECT fn_llm_session_context()` |
| What other Claude instances just did | `SELECT * FROM t4h_canonical_changes WHERE author LIKE 'claude%' AND created_at > now() - interval '48 hours' ORDER BY id DESC` |

## HOW TO LOG YOUR OWN WORK (so next instance can see it)

```sql
INSERT INTO t4h_canonical_changes
  (change_type, title, summary, affected, author, severity, memory_key)
VALUES
  ('SYSTEM_CHANGE',                   -- or DECISION / BLOCKER / FINANCIAL_CHANGE / MILESTONE / etc.
   'Short title',                     
   'Full prose summary of what you did, why, and evidence',
   ARRAY['table_or_lambda','other_affected_thing']::text[],
   'claude',                          -- or your LLM identifier
   'NORMAL',                          -- LOW / NORMAL / HIGH / CRITICAL
   'unique_snake_case_key_YYYYMMDD');
```

Enums (hard-coded check constraints):
- `change_type` ∈ {MILESTONE, SCHEMA_CHANGE, BUSINESS_CHANGE, IP_CHANGE, PRODUCT_CHANGE, FINANCIAL_CHANGE, SYSTEM_CHANGE, BLOCKER, DECISION}
- `severity` ∈ {LOW, NORMAL, HIGH, CRITICAL}

On INSERT, `fn_broadcast_canonical_change()` trigger fans out:
- Pins a row to `llm_scratchpad` → every other LLM sees it on boot
- Pushes to Telegram @Augmented_Humanity_Bot
- Writes to `reference_docs`

## BRIDGE ENVELOPE (do NOT guess)

Write path: `troy-sql-executor` or `t4h-sql-exec` — flat envelope:
```json
{"fn":"t4h-sql-exec","sql":"<your SQL>"}
```

`troy-sql-executor` also accepts `{"fn":"troy-sql-executor","payload":{"sql":"..."}}` (wrapped). `t4h-sql-exec` is flat-only.

For `troy-lambda-manager` / `t4h-aws-proxy`: FLAT only, top-level fields:
```json
{"fn":"troy-lambda-manager","action":"get_config","function_name":"mcp-bridge-invoke-handler"}
{"fn":"t4h-aws-proxy","service":"lambda","action":"get_function_configuration","params":{"FunctionName":"X"}}
```

DO NOT call `troy-sql-executor-s2` or `troy-bridge-runner` — marked `is_callable=false`, code is broken (HandlerNotFound + ImportModuleError respectively, as of 2026-04-21).

If the bridge returns `sql_error` 400 on an INSERT: check for check-constraint violation on enum fields (change_type, severity) FIRST before assuming auth failure.

## DO NOT

- Rebuild what already exists. Query the registry first: `SELECT function_name, status FROM mcp_lambda_registry WHERE function_name ILIKE '%your_thing%'` and `information_schema.tables`.
- Seed fake demo data. If you need evidence, generate it from real sources (maat_transactions, research_publication_register, etc.)
- Write to S2 (pflisxkcxbzboxwidywf). All writes go to S1 (lzfgigiyqpuuxslsygjt).
- Skip the boot query. Out-of-date memory causes drift. Every. Time.
