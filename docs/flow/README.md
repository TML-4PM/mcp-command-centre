# FLOW

FLOW is the business-first movement engine for making sure work does not die.

It is not just a board.
It is not just a widget.
It is not just a Lambda.
It is not just a browser feature.

FLOW is one canonical operating sequence with multiple trigger modes, selectable autonomy, and multiple visible surfaces.

## Core idea

One canonical work object.
One shared sequence.
Many views.
Many trigger modes.
Selectable autonomy.
No silent death.

## Canonical sequence

```text
PARKING
→ DISCOVERY
→ PRE_SALE
→ SALES
→ ONBOARDING
→ DELIVERY
→ VALUE
→ EXPANSION
```

This is the visible business flow.

Underneath it, the system can still track technical conditions such as:
- HEALTHY
- STALE
- BLOCKED
- RESUMED
- VERIFIED

Those are enforcement mechanics, not the primary business language.

## What FLOW actually is

FLOW is a backend business movement engine that can be:
- triggered manually
- triggered by events
- triggered by schedules
- triggered by agents

and surfaced through:
- Command Centre
- Synal / browser surfaces
- API endpoints
- embedded widgets
- white-label client views

That means FLOW is universal at the engine level, not tied to a single interface.

## Why this exists

The problem was not lack of tasks.
The problem was that work sat in chats, ideas, partial builds, and handoffs until it quietly died.

FLOW fixes that by making every item:
- visible
- placed in sequence
- assigned a next movement
- reviewable
- pressure-tested when stale
- observable when missed or drained

## Operating contract

Every FLOW item must:
1. exist once as a canonical object
2. sit in the shared sequence
3. have a visible next action or scheduled review
4. have an owner or accountable surface
5. have movement pressure through `last_movement_at` or `next_review_at`
6. be readable in multiple business languages
7. support selectable autonomy where appropriate

### Correct failure wording

Do not say:

> anything else = system failure

Use:

> any item without movement, explanation, or scheduled review becomes an exception

That matches how a business actually works.

## Trigger modes

FLOW supports four trigger modes.

### 1. Manual trigger
A human creates or moves an item.

Examples:
- add an idea to Parking
- move a lead to Sales
- mark Delivery as complete
- set next action or review date

### 2. Event-driven trigger
A business event updates FLOW.

Examples:
- form submitted
- Stripe payment lands
- CRM stage changes
- booking created
- GitHub issue opened
- email arrives

### 3. Scheduled trigger
A timed sweep checks for stale, missed, or drained work.

Examples:
- 15-minute pressure sweep
- daily review check
- weekly drained-item scan

### 4. Agent / system trigger
An agent or orchestration layer creates or advances items.

Examples:
- agent creates an item from a chat
- agent suggests next action
- bridge runner writes back completion evidence
- browser capture turns unfinished work into a FLOW item

## Autonomy model

FLOW is hybrid by design.

It is not always automatic.
It is not always manual.

### Manual when
- humans decide business intent
- judgment is required
- explicit control matters

### Automatic when
- stale work must be surfaced
- logs and evidence must be written
- repeatable pressure rules apply
- safe transitions can be inferred

### User-chosen when
- a business, stage, or item should run as autonomous, gated, or human-led

Recommended operating split:

```text
PARKING / DISCOVERY / PRE_SALE / SALES
= mostly human-led with agent assistance

ONBOARDING / DELIVERY / VALUE / EXPANSION
= increasingly automated where safe

PRESSURE / LOGGING / MISS DETECTION
= always automatic
```

## Multi-language views

Same underlying item. Different lenses.

### Founder view
Parking → Discovery → Pre-sale → Sales → Onboarding → Delivery → Value → Expansion

### Sales view
Prospect → Qualified → Proposal / Won → Handoff → Customer → Expansion

### Delivery view
Queued → Active → Delivering → Verified

### System view
Healthy → Stale → Blocked → Resumed → Verified

### Content / AI chain view
Draft → Transform → Localise → Publish → Repurpose

## Simple workflow diagram

```text
                    ┌─────────────────────┐
                    │    NEW IDEA / JOB    │
                    └──────────┬──────────┘
                               │
                               v
┌──────────┐   ┌───────────┐   ┌──────────┐   ┌────────────┐
│ PARKING  │ → │ DISCOVERY │ → │ PRE_SALE │ → │   SALES    │
└──────────┘   └───────────┘   └──────────┘   └─────┬──────┘
                                                     │
                                                     v
                                               ┌────────────┐
                                               │ ONBOARDING │
                                               └─────┬──────┘
                                                     │
                                                     v
                                               ┌────────────┐
                                               │  DELIVERY  │
                                               └─────┬──────┘
                                                     │
                                                     v
                                               ┌────────────┐
                                               │   VALUE    │
                                               └─────┬──────┘
                                                     │
                                                     v
                                               ┌────────────┐
                                               │ EXPANSION  │
                                               └─────┬──────┘
                                                     │
                                                     └──────────────→ back into FLOW

Pressure across all stages:
- no next action
- review overdue
- stale movement
- drained item

These do not create a second board.
They trigger pressure, logging, and resume logic on the same item.
```

## Data and execution flow diagram

```text
Manual UI / Event / Schedule / Agent
                 │
                 v
          public.flow_items
                 │
                 ├── public.flow_events
                 ├── public.flow_run_log
                 │
                 ├── public.v_flow_board
                 ├── public.v_flow_pressure
                 ├── public.v_flow_onboarding_ramp
                 └── public.v_flow_drain_and_miss
                          │
                          v
                Command Centre / Synal / Widget / API
                          │
                          v
              Bridge / Lambda / EventBridge / Agents
                          │
                          v
            update movement, state, evidence, logs
```

## Main database objects

### Tables
- `public.flow_items`
- `public.flow_events`
- `public.flow_stage_aliases`
- `public.flow_run_log`

### Views
- `public.v_flow_board`
- `public.v_flow_pressure`
- `public.v_flow_onboarding_ramp`
- `public.v_flow_drain_and_miss`

## Surfaces

### Internal surfaces
- Command Centre board
- pressure / misses view
- onboarding ramp

### Optional surfaces
- Synal side panel
- browser capture UI
- embedded widget
- white-label client board
- API-only integrations

This is why FLOW can become a resale product.
The engine stays the same while the surface changes.

## What success looks like

You come back days later and see:
- what is parked
- what is moving
- what is feeding onboarding
- what is creating value
- what missed review
- what drained away
- what resumed
- what still has no next action

Not dead work.
Not hidden work.
Not duplicate work.

## Handoff expectation

Pen should use this README together with the implementation note in `docs/flow/FLOW_IMPLEMENTATION.md` and the original issue thread to complete the build and return closure evidence.
