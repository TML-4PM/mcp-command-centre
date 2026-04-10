# Runtime Expectations — MCP Command Centre

## Purpose

This document defines what must be true for the command centre to work in a real environment.

If these conditions are not met, the system should be considered degraded or broken.

---

## 1. Environment

### Required environment variables

At minimum:

- `BRIDGE_API_KEY`

Recommended additions:

- `BRIDGE_URL` (instead of hardcoding)
- `APP_ENV` (dev / staging / prod)

---

## 2. Bridge availability

The following must succeed:

```text
POST /api/bridge
```

Validation test:

```json
{
  "fn": "troy-sql-executor",
  "sql": "SELECT 1"
}
```

Expected:

```json
{
  "rows": [{ "?column?": 1 }]
}
```

---

## 3. Supabase / data layer

The following tables/views must exist and be queryable:

### Core
- `mcp_lambda_registry`
- `command_centre_queries`

### Portfolio
- `t4h_canonical_28_first_pass`
- `v_command_centre_portfolio`

### Agents / signal
- `neural_ennead_members`

### Finance / MAAT
- `v_maat_dashboard`

### Infrastructure
- `sites_registry`
- `v_domain_map_full`

### Assets
- `ip_assets`

### Runtime
- `cc_worker_state`

---

## 4. Expected system behavior

### Healthy
- bridge responds < 500ms typical
- SQL queries return rows
- lambda registry count > 0
- worker state returns UP

### Degraded
- bridge responds but slowly
- some queries fail
- worker state indicates degraded

### Down
- bridge fails
- no SQL returns
- worker state DOWN or missing

---

## 5. UI expectations

The UI assumes:

- responses always return JSON
- SQL returns `rows` array
- counts can be derived from first row
- missing data defaults to 0 (not crash)

---

## 6. Observability expectations

Minimum:

- bridge latency measurable
- worker state visible
- portfolio completion visible

Target state:

- request IDs propagated
- execution time tracked
- errors classified (bridge / SQL / schema)

---

## 7. Failure modes to guard

1. Schema drift
   - renamed tables or columns break UI

2. Bridge contract drift
   - different response shape breaks parsing

3. Missing environment variables
   - proxy still runs but silently fails downstream

4. Secret leakage
   - API keys in repo or client code

---

## 8. Required hardening moves

- enforce environment-only secrets
- fail startup if bridge config missing
- add health check endpoint in proxy
- validate required tables at boot
- add CI step to test `SELECT 1` through bridge

---

## Bottom line

If the bridge works, the schema is stable, and the proxy is correctly configured, the command centre works.

If any of those drift, the system fails quickly.

This document defines the baseline for keeping it stable.
