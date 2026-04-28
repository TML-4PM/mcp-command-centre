# Ecosystem Unification Pack — Supabase + Command Centre

Status: PARTIAL/DEPLOYABLE PACK
Date: 2026-04-29
Owner: COAX-G2
Target: unify Supabase state, Command Centre visibility, Bridge execution receipts, Pen handoff and ecosystem control.

## Kill Objective

Create one canonical control spine so work stops leaking between bookmarks, LLM chats, GitHub, Bridge, Command Centre, Supabase, Stripe, sites, tasks and agents.

## Core Rule

Nothing is complete unless it has:

1. Canonical row in Supabase.
2. Execution task linked to the row.
3. Bridge or worker receipt.
4. Reality Ledger classification: REAL, PARTIAL, PRETEND, BLOCKED or ARCHIVED.
5. Command Centre visibility.
6. Next action or closed terminal state.

## Delivered Files

- `supabase_ecosystem_unification.sql` — canonical schema, enums, tables, views, helper functions and seed rows.
- `bridge_payload_ecosystem_unification.json` — Bridge-ready invocation envelope.
- `command_centre_ecosystem_status_widget.html` — embeddable Command Centre widget for ecosystem state visibility.
- `README.md` — operating explanation and promotion instructions.

## Canonical Tables

- `ecosystem_entities` — businesses, systems, repos, sites, products, agents, sources and widgets.
- `ecosystem_tasks` — executable work items with state, priority and owner.
- `ecosystem_executions` — every Bridge/worker run with structured output.
- `ecosystem_receipts` — evidence objects for GitHub commits, deploys, logs, Bridge responses and external proofs.
- `ecosystem_links` — graph edges between entities, tasks, executions and receipts.
- `reality_ledger` — evidence-bound truth layer.

## Runtime Loop

```text
SOURCE EVENT
→ canonical entity
→ task
→ bridge execution
→ receipt
→ reality ledger
→ command centre widget
→ next task or terminal state
```

## Initial Promotion Path

1. Apply SQL to Supabase.
2. Store widget in `t4h_ui_snippet` with slug `ecosystem-status`.
3. Configure Bridge to call the payload in `bridge_payload_ecosystem_unification.json`.
4. Wire Command Centre to read the supplied views.
5. Run smoke proof: insert test entity → task → execution → receipt → ledger → widget.

## Proof Gate

Target state remains PARTIAL until the SQL is applied, the widget is served, and at least one execution receipt round-trip is written to Supabase.

## Current Hard Truth

This pack is now durable in GitHub. It is not yet runtime-proven until Supabase and Bridge execute it.
