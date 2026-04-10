# MCP Command Centre Bridge Contract

## Purpose

This document defines how the command-centre UI talks to the execution layer.

The current browser contract is intentionally narrow:
- the browser talks only to the local proxy endpoint
- the local proxy forwards to the MCP Bridge API Gateway
- the bridge executes SQL or lambda actions
- the UI expects stable JSON back

---

## Current flow

```text
React UI
  -> POST /api/bridge
      -> AWS API Gateway /lambda/invoke
          -> target function or execution action
              -> JSON response
```

---

## Local browser-facing contract

### UI helper functions

The UI currently uses four helper patterns in `src/lib/bridge.ts`:

1. `bridgeSQL(sql)`
2. `bridgeCount(sql)`
3. `bridgeQueryKey(key)`
4. `bridgeLambda(fn, params)`

### Proxy endpoint

The browser posts to:

```text
/api/bridge
```

### SQL execution payload shape

Current UI contract for SQL calls:

```json
{
  "fn": "troy-sql-executor",
  "sql": "SELECT 1"
}
```

### Generic lambda invocation payload shape

Current UI contract for generic lambda calls:

```json
{
  "fn": "lambda-name",
  "param1": "value",
  "param2": "value"
}
```

---

## Current proxy behavior

The proxy currently:
- accepts `POST`
- forwards JSON body unchanged to the bridge
- attaches the bridge API key in `x-api-key`
- returns JSON back to the browser
- supports `OPTIONS` for CORS

Current target:

```text
https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke
```

---

## Current response assumptions in the UI

### `bridgeSQL`
The UI is currently tolerant of:
- `rows` as an array
- optional `count`
- optional `sql`
- optional `error`

Expected practical response shape:

```json
{
  "rows": [{ "count": 1 }],
  "count": 1,
  "sql": "SELECT count(*) FROM example"
}
```

### `bridgeCount`
`bridgeCount` assumes the first row contains one of:
- `c`
- `count`
- otherwise the first value in the first row object

That means SQL written for count-style usage should prefer one of these patterns:

```sql
SELECT count(*) AS count FROM some_table;
```

or

```sql
SELECT count(*) AS c FROM some_table;
```

### `bridgeQueryKey`
`bridgeQueryKey` expects a table-backed query registry with this basic contract:

```sql
SELECT sql
FROM command_centre_queries
WHERE key = '<key>'
  AND is_active = true
LIMIT 1;
```

---

## Data dependencies already visible in the landing page

The command-centre landing page currently expects the following tables or views to exist and return usable results:

- `t4h_canonical_28_first_pass`
- `mcp_lambda_registry`
- `neural_ennead_members`
- `ip_assets`
- `t4h_catalog`
- `stripe_products_catalog`
- `sites_registry`
- `v_domain_map_full`
- `v_command_centre_portfolio`
- `v_maat_dashboard`
- `cc_worker_state`
- `command_centre_queries`

---

## Known fragility points

### 1. SQL in browser-facing code
Raw SQL is currently being passed from the browser layer into the bridge path. That is fast and flexible, but it means:
- schema drift breaks the UI directly
- view renames break the UI directly
- poorly controlled SQL composition becomes a risk over time

### 2. Function name tight coupling
The UI currently hardcodes:

```text
troy-sql-executor
```

If the execution function name changes, the UI breaks unless the proxy or bridge preserves backward compatibility.

### 3. Query registry dependency
`bridgeQueryKey` depends on `command_centre_queries` existing and being populated.

### 4. Silent shape drift
The UI is resilient to a few response variants, but not to arbitrary changes. The bridge must continue returning JSON that preserves `rows` or an equivalent shape that the proxy normalizes.

---

## Recommended hardening target

Move toward this stronger contract:

### Recommended envelope

```json
{
  "action": "query",
  "fn": "troy-sql-executor",
  "sql": "SELECT count(*) AS count FROM some_table",
  "request_id": "uuid-or-trace-id",
  "source": "mcp-command-centre"
}
```

### Recommended normalized response

```json
{
  "ok": true,
  "rows": [{ "count": 1 }],
  "count": 1,
  "error": null,
  "request_id": "uuid-or-trace-id",
  "duration_ms": 42
}
```

That gives you:
- traceability
- easier logging
- safer normalization in the proxy
- cleaner future compatibility with non-SQL actions

---

## Fail-fast checks that should exist

At deploy or CI time, validate:

1. `/api/bridge` responds to `POST`
2. bridge target URL is configured
3. bridge API key is configured through environment
4. `SELECT 1` succeeds through the proxy
5. `mcp_lambda_registry` exists
6. `v_maat_dashboard` exists
7. `v_command_centre_portfolio` exists
8. `cc_worker_state` exists
9. `command_centre_queries` exists

---

## Immediate cleanup recommendation

The current code path contains a hardcoded fallback API key in the proxy source. That should be removed.

Desired state:
- key only comes from environment
- deploy fails if the key is missing
- no secret or fallback secret is stored in source

---

## Bottom line

The command centre already has a real bridge contract.

Right now it is:
- fast
- workable
- direct

But it should evolve from a code-discovered contract into an explicit, versioned contract with environment-only secrets and fail-fast validation.
