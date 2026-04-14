# Fail-Fast Checklist — Command Centre

## Purpose

This checklist defines what must be true before the system is considered safe to run.

If any item fails, deployment should stop.

---

## 1. Bridge layer

- [ ] `/api/bridge` responds to POST
- [ ] `SELECT 1` succeeds through proxy
- [ ] bridge latency < acceptable threshold
- [ ] no hardcoded API key fallback exists

---

## 2. Environment

- [ ] `BRIDGE_API_KEY` is present
- [ ] `BRIDGE_URL` is present (recommended)
- [ ] environment is clearly identified (dev/staging/prod)

---

## 3. Data layer

- [ ] `mcp_lambda_registry` exists
- [ ] `command_centre_queries` exists
- [ ] `v_command_centre_portfolio` exists
- [ ] `v_maat_dashboard` exists
- [ ] `cc_worker_state` exists

---

## 4. UI contract

- [ ] bridge returns JSON
- [ ] `rows` array is present for SQL calls
- [ ] `bridgeCount` queries return numeric value
- [ ] no UI crash on empty result

---

## 5. Security

- [ ] no secrets in source
- [ ] no fallback keys in code
- [ ] no bridge key exposed to browser

---

## 6. Observability

- [ ] system health visible in command centre
- [ ] worker state visible
- [ ] portfolio completion visible

---

## 7. CI enforcement

- [ ] hardening-check workflow passes
- [ ] no grep failures for secrets
- [ ] required files exist

---

## Definition of REAL

System is considered REAL only if:

- all checks pass
- bridge responds
- UI loads with real data
- no silent fallback behavior

---

## Definition of PARTIAL

- UI loads but missing data
- bridge works but schema incomplete
- fallback behavior still present

---

## Definition of PRETEND

- mock data
- no bridge connectivity
- UI renders but does not execute real queries

---

## Bottom line

This checklist is the gate between:

prototype → system

If it is not passing, it is not production.
