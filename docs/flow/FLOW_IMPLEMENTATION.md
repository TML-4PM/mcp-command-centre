# FLOW Implementation Note

This document translates FLOW into an executable system.

It must be read with the understanding that FLOW is:
- a hybrid trigger system
- a selectable autonomy system
- a multi-surface engine

not just a scheduled Lambda loop.

## System components

```text
Supabase (source of truth)
→ Views (board / pressure / onboarding / drain)
→ Command Centre / other surfaces
→ Bridge Runner
→ Lambda (flow_orchestrator)
→ EventBridge (scheduler)
→ External events (CRM, Stripe, forms, etc)
→ Agents / browser capture
```

## Lifecycle loop

```text
capture (manual / event / agent)
→ place in FLOW
→ assign next action or review
→ move forward (manual or automated)
→ detect stall (scheduled)
→ resume / flag / advance
→ deliver value
→ expand
→ re-enter flow
```

## Trigger model

### Manual trigger
User creates or updates a FLOW item.

### Event trigger
External systems call API or Bridge.

### Scheduled trigger
EventBridge runs pressure sweeps.

### Agent trigger
Agents create or update items.

All four must be supported.

## Execution flow diagram

```text
[Manual / Event / Agent]
          │
          v
     flow_items
          │
          ├──────────────┐
          │              │
          v              v
EventBridge        External triggers
   (schedule)           (API)
          │              │
          └──────┬───────┘
                 v
        flow_orchestrator
                 │
       ┌─────────┼─────────┐
       │         │         │
       v         v         v
   evaluate   decide    log run
                 │
                 v
           update item
                 │
                 v
           write event
                 │
                 v
             Supabase
                 │
                 v
        Command Centre / UI
```

## Key decisions enforced

### No next action
→ BLOCKED

### Review overdue
→ RESUMED + suggested stage

### Stale movement
→ RESUMED

### Active and healthy
→ no change

## Data responsibilities

### flow_items
- single source of truth
- holds stage, value, ownership

### flow_events
- business movement log

### flow_run_log
- execution trace log
- required for observability

### stage_aliases
- multi-language mapping

## API layer

Must expose:

- `GET /api/flow/board`
- `GET /api/flow/pressure`
- `GET /api/flow/onboarding`
- `GET /api/flow/drain-miss`
- `GET /api/flow/run-log`

## Surfaces

### Required
- Command Centre FLOW board
- Command Centre pressure/miss view

### Optional
- Synal panel
- browser extension capture
- embedded widget
- API-only integrations

## Deployment checklist

- migrations applied
- RLS active
- lambda deployed
- eventbridge scheduled
- API endpoints live
- widget inserted
- at least 4 stages populated

## Proof of execution

System is not complete until:
- a stale item is detected
- orchestrator runs
- run log is written
- event is written
- UI shows updated state

## Reality alignment

This is not just a Kanban board.

It is:
- a business lifecycle engine
- enforced by automation
- observable through logs and pressure views
- extensible across multiple trigger sources

## Final note

If items can still disappear, the system is not working.

If items move, log, and surface automatically across multiple triggers, the system is working.
