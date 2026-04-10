# What We Built

## Plain-English summary

This repository is not just a front end.

It is the shell of an operating system for augmented organisations: a command centre that sits on top of the MCP Bridge, queries canonical state from Supabase, surfaces health and portfolio status, and gives operators one place to see, steer, and prove what is happening.

At a high level, the stack is:

1. **Command Centre UI** — React/Vite application with routed operational surfaces.
2. **Bridge layer** — browser-safe bridge calls into the execution fabric.
3. **Canonical state** — Supabase tables/views used as the system of record.
4. **Execution fleet** — Lambda and worker endpoints that do the real work.
5. **Evidence + telemetry** — metrics, worker state, logs, and portfolio completion views.

---

## What is already real in this repo

### 1. A real command-centre shell
The app already contains a broad routed surface for command-centre operations, including portfolio, agents, analytics, signals, systems, products, pricing, jobs, governance, bridge terminal, campaign, report factory, mission control, MAAT, R&D, tax, webops, workfamily, and other operational pages.

### 2. Live bridge-backed landing page
The landing page is not static marketing copy. It performs live checks and bridge queries for:
- bridge health
- Supabase reachability
- Lambda registry counts
- commercial portfolio counts
- Neural Ennead agent counts
- IP asset counts
- catalogue counts
- site and domain counts
- MAAT dashboard metrics
- portfolio completion summaries
- worker incident state

### 3. Evidence-oriented operational posture
The design pattern is clearly aimed at proving runtime truth rather than just showing mock dashboards. The landing page already treats live SQL through the bridge as the health source for bridge and Supabase, and reads worker state to expose degraded/down conditions.

### 4. Portfolio-wide surface area
This repo is positioned as the front-end control plane for the wider Tech 4 Humanity ecosystem rather than a single-product site. The route inventory and labels make that explicit.

---

## What the system does in practice

### Observe
Read health, counts, registries, and portfolio completion from canonical sources.

### Orient
Turn raw system state into operational views: healthy/degraded status, portfolio completion, finance summary, business-unit health, and worker alerts.

### Orchestrate
Provide a single operator surface for many execution domains across bridge, reporting, campaigns, finance, governance, and product operations.

### Prove
Anchor decisions and status in queryable tables/views instead of anecdotes.

---

## The actual architecture pattern

```text
Operator
  -> MCP Command Centre UI
      -> bridgeSQL / bridgeCount
          -> MCP Bridge / execution gateway
              -> Supabase views, registries, logs, queues, worker state
              -> Lambda fleet / agents / downstream automations
```

This means the UI is the visible layer of a deeper operating stack, not the whole system.

---

## What is still incomplete

The repo shows a serious control-plane structure, but there are still known closure gaps in the wider system pattern:

- README and repo documentation were lagging the actual build
- some closure/evidence loops remain outside this repo and need hardening end-to-end
- packaging and handoff still need more consistency
- some routes likely depend on views/tables/functions that must stay aligned with Supabase and bridge contracts
- the system is powerful, but reliability and proof paths still matter more than adding yet more surfaces

---

## The honest one-line description

**MCP Command Centre is the operator-facing control plane for the Tech 4 Humanity execution stack: a bridge-backed, evidence-aware front end for monitoring, steering, and proving cross-business AI, agent, portfolio, and financial operations.**

---

## Immediate next hardening moves

1. Replace the default repo README with a canonical system description.
2. Add a bridge contract document covering payloads, health checks, and failure modes.
3. Add an environment contract document covering required Supabase and bridge variables.
4. Add a route inventory mapped to backing data sources.
5. Add fail-fast CI checks so broken contracts do not drift into production.
