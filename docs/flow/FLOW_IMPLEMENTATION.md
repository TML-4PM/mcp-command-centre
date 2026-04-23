# FLOW Implementation Note

This document translates FLOW into an executable system.

It should be read together with the README and the GitHub issue.

## System components

```text
Supabase (source of truth)
→ Views (board / pressure / onboarding)
→ Command Centre UI
→ Bridge Runner
→ Lambda (flow_orchestrator)
→ EventBridge (scheduler)
```

## Lifecycle loop

```text
create item
→ assign stage
→ set next action
→ move forward
→ detect stall
→ resume or flag
→ deliver value
→ expand
→ re-enter flow
```

## Execution flow diagram

```text
[User / Agent]
        │
        v
   flow_items (insert/update)
        │
        v
EventBridge (15 min)
        │
        v
flow_orchestrator (Lambda)
        │
        ├── evaluate pressure
        ├── decide action
        ├── update item
        └── write event
        │
        v
Supabase updated state
        │
        v
Command Centre refresh
```

## Key decisions enforced

### 1. No next action
→ BLOCKED

### 2. Review overdue
→ RESUMED + suggested next stage

### 3. Stale movement
→ RESUMED

### 4. Active and healthy
→ no change

## Data responsibilities

### flow_items
- single source of truth
- holds state, value, ownership

### flow_events
- audit log
- enables replay and evidence

### stage_aliases
- enables multi-language views

## API layer (expected)

### GET /api/flow/board
Returns `v_flow_board`

### GET /api/flow/pressure
Returns `v_flow_pressure`

### GET /api/flow/onboarding
Returns `v_flow_onboarding_ramp`

## Minimal UI expectation

One board.
Eight columns.
Cards showing:
- title
- owner
- next action

No duplication.

## Deployment checklist

- migrations applied
- RLS active
- lambda deployed
- eventbridge scheduled
- widget inserted
- API endpoints live
- at least 4 stages populated

## Proof of execution

System is not complete until:
- an item becomes stale
- the sweep detects it
- lambda resumes or flags it
- event is written
- UI reflects change

## Reality alignment

This is not a Kanban board.

It is:
- a business lifecycle
- enforced by automation
- observable in real time

## Final note

If items can still disappear, the system is not working.

If items move without humans noticing, the system is working.
