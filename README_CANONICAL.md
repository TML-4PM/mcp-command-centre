# MCP Command Centre

Operator-facing control plane for the Tech 4 Humanity execution stack.

This repository is the front-end command surface for a bridge-backed system that reads canonical state from Supabase, exposes health and portfolio visibility, and gives operators a single place to observe, steer, and prove cross-business execution.

---

## What this system is

MCP Command Centre is not just a dashboard.

It is the UI shell of a wider operating system that connects:
- browser operator surfaces
- local bridge proxy
- MCP Bridge execution gateway
- Supabase views, registries, and runtime tables
- Lambda and worker execution paths

---

## Core runtime path

```text
Operator
  -> React Command Centre UI
      -> /api/bridge
          -> MCP Bridge
              -> SQL executor / Lambda actions
                  -> Supabase / workers / registries / telemetry
```

---

## What is already real

- live bridge-backed landing page
- real health checks
- portfolio completion views
- MAAT finance summary
- worker incident state
- broad route inventory across operations, products, agents, governance, reports, campaigns, and system surfaces

---

## What this repo depends on

### Environment
- `BRIDGE_API_KEY`
- recommended: `BRIDGE_URL`

### Required backend objects
- `mcp_lambda_registry`
- `command_centre_queries`
- `t4h_canonical_28_first_pass`
- `v_command_centre_portfolio`
- `v_maat_dashboard`
- `cc_worker_state`
- plus related asset, site, domain, agent, and catalogue tables/views

---

## Hardening documents

See:
- `docs/WHAT_WE_BUILT.md`
- `docs/BRIDGE_CONTRACT.md`
- `docs/RUNTIME_EXPECTATIONS.md`
- `docs/SECURITY_HARDENING.md`
- `docs/FAIL_FAST_CHECKLIST.md`

---

## Current priority

Do not add surface area first.

Harden the system by:
1. removing fallback secrets from source
2. moving bridge URL into environment
3. validating runtime dependencies automatically
4. failing CI on contract drift

---

## Reality standard

This system should only be considered REAL when:
- bridge connectivity works
- required data sources exist
- UI loads with real data
- no silent fallback behavior remains
- CI checks pass

---

## Bottom line

This repo is the visible control plane for a real execution system.

Its next job is not to become bigger.
Its next job is to become trustworthy.
