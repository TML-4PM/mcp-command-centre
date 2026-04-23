# FLOW

FLOW is the business-first operating model for making sure work does not die.

It replaces fragmented task tracking with one shared sequence that can be read by different people in different languages without duplicating the underlying work item.

## Core idea

One canonical work object.
One shared sequence.
Many views.
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

## Why this exists

The problem was not lack of tasks.
The problem was that work sat in chats, ideas, partial builds, and handoffs until it quietly died.

FLOW fixes that by making every item:
- visible
- placed in sequence
- assigned a next movement
- reviewable
- pressure-tested when stale

## Operating contract

Every FLOW item must:
1. exist once as a canonical object
2. sit in the shared sequence
3. have a visible next action
4. have an owner or accountable surface
5. have movement pressure through `last_movement_at` or `next_review_at`
6. be readable in multiple business languages

### Correct failure wording

Do not say:

> anything else = system failure

Use:

> any item without movement, explanation, or scheduled review becomes an exception

That matches how a business actually works.

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

Exception pressure:
- no next action
- review overdue
- stale movement

These do not create a second board.
They trigger pressure and resume logic on the same item.
```

## Data flow diagram

```text
User / Agent / Sales / System
            │
            v
      public.flow_items
            │
            ├── public.flow_events
            │
            ├── public.v_flow_board
            ├── public.v_flow_pressure
            └── public.v_flow_onboarding_ramp
                     │
                     v
            Command Centre widget
                     │
                     v
            Bridge / Lambda / EventBridge
                     │
                     v
            updates movement, state, evidence
```

## Main database objects

### Tables
- `public.flow_items`
- `public.flow_events`
- `public.flow_stage_aliases`

### Views
- `public.v_flow_board`
- `public.v_flow_pressure`
- `public.v_flow_onboarding_ramp`

## Automation pattern

### Sweep
EventBridge runs a pressure sweep every 15 minutes.

### Lambda
`flow_orchestrator` reads a FLOW item, evaluates pressure, and decides whether to:
- do nothing
- flag missing action
- resume stale work
- advance the item

### Bridge envelope
The orchestrator is bridge-ready and receives a standard invocation envelope.

## Command Centre

The Command Centre should render a single FLOW board from `v_flow_board`.

It should also expose:
- pressure list from `v_flow_pressure`
- onboarding ramp from `v_flow_onboarding_ramp`

## What success looks like

You come back days later and see:
- what is parked
- what is moving
- what is feeding onboarding
- what is creating value
- what needs attention

Not dead work.
Not hidden work.
Not duplicate work.

## Handoff expectation

Pen should use this README together with the implementation note in `docs/flow/FLOW_IMPLEMENTATION.md` and the original issue thread to complete the build and return closure evidence.
