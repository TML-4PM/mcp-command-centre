# Signal Surface Build Agreement Receipt

Receipt ID: SIGNAL-SURFACE-BUILD-20260426-AGREED-001
Date: 2026-04-26
Status: AGREED (Awaiting User OK)

## What is being built

A lightweight system with two components:

1. Signal Surface Demo (browser-based, TV-mirroring ready)
   - Single web page
   - Simulated content panel
   - Overlay showing helpful moment prompts
   - Four interchangeable scenarios:
     - Wedding (human/emotional)
     - Sport (fast/critical)
     - Twitch (social/chaotic)
     - IoT/Home (real-world/quiet)

2. Alert Backbone
   - Detects absence of activity (no processing)
   - Heartbeat-based monitoring
   - Alert via AWS (CloudWatch → SNS → phone)

## What is NOT included

- No production system changes
- No Supabase modifications
- No Samsung/native TV builds
- No heavy infrastructure

## Principles

- Same system, different places (no overpivot)
- Human-safe language (non-creepy)
- Stateless execution (send → close → exit)
- Single permission per session
- Alerts over dashboards

## Execution Plan

Phase 1: Demo
- Build minimal web-based Signal Surface

Phase 2: Alerts
- Implement "no activity" alert

Phase 3: Optional
- Link alerts into demo

## Outcome

- Visual demo usable immediately via screen mirroring
- Alert system preventing silent failure

## Ownership Model

- After approval: execution moves to GitHub / Bridge / Dev
- No return dependency
- No session ownership retained

## Reality Status

READY TO BUILD

---

Awaiting explicit OK before build begins.
