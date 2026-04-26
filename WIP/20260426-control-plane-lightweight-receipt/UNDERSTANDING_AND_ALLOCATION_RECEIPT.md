# Lightweight Control Plane Understanding and Allocation Receipt

Receipt ID: CC-LIGHT-CONTROL-20260426-001
Date: 2026-04-26
Repo: TML-4PM/mcp-command-centre
Status: HANDOFF RECEIPT ONLY
Production impact: NONE
Human-in-the-loop requirement: NONE for non-destructive planning, inventory, reporting, and alert design
Enhancement posture: YES by default for safe, non-destructive improvements

## Plain-English understanding

This receipt captures the agreed reset.

We are not starting with a large GitHub build. We are starting with a lightweight control-plane understanding and allocation note.

The core issue is not GitHub versus Vercel versus Lovable. The core issue is lack of operational visibility across the whole estate.

The estate includes Lovable sites, Vercel projects/deployments, GitHub repos/assets, S3/static HTML/JSX assets, Supabase tables/functions/buckets/policies, bridge execution, queues, and active browser/chat workstreams.

Supabase is the likely common source and control ledger, but it is not currently audited well enough to safely understand what touches what.

No one should make broad production changes without knowing dependency and blast radius.

## Explicit constraint

This receipt does not touch production.

This receipt does not create or modify Supabase tables.

This receipt does not deploy code.

This receipt does not assume that GitHub, Vercel, or Lovable is the system of record.

This receipt only records the agreed lightweight plan and allocation model.

## Minimum agreement

1. No production changes from this step.
2. No destructive actions.
3. No human-in-the-loop needed for discovery, inventory design, reporting design, alert design, or handoff creation.
4. All safe enhancements are approved by default.
5. The system should prefer lightweight visibility first, then deeper build work only after the estate map exists.
6. A receipt must be created whenever work is handed off, accepted, completed, blocked, or escalated.
7. If the bridge, queue, scheduler, or worker is down, that must become visible quickly.
8. Unknown dependency is a blocking state, not permission to guess.
9. Active workstreams on similar topics should have one lead thread or deliberate fork.
10. Every workstream should resolve to run, own, fork, merge, close, archive, or retire.

## What should be allocated

### 1. Chief of Staff allocation lane

Purpose: allocate the work to the right lanes and keep it moving without letting all of it collapse into one giant task.

Required action:
- Create or assign owners for Architect/CTO, Data Analyst, Website, Marketing/Portfolio, Operations, and Alerting lanes.
- Track what has been allocated, accepted, blocked, and closed.

### 2. Architect / CTO lane

Purpose: define the lightweight control-plane model.

Required action:
- Define the minimal registry model.
- Define source hierarchy.
- Define safe-change rules.
- Define dependency and blast-radius check rules.
- Define what counts as REAL, PARTIAL, UNKNOWN, or RETIRED.

### 3. Data Analyst lane

Purpose: make Supabase visible.

Required action:
- Inventory Supabase tables, views, functions, buckets, policies, and recently touched assets.
- Identify unknown, shared, risky, orphan, and active objects.
- Produce a daily Supabase heatmap.

### 4. Website / Front-end lane

Purpose: map the site estate.

Required action:
- Inventory Lovable, Vercel, GitHub, S3, HTML, JSX, and static pages.
- Identify duplicates, dead assets, unfinished pages, live surfaces, and likely business alignment.
- Map which sites appear to touch Supabase.

### 5. Marketing / Portfolio lane

Purpose: keep commercial meaning attached to the technical estate.

Required action:
- Map each site or asset to the 30-business portfolio where possible.
- Identify high-value assets, reusable copy, duplicate brands, and missed monetisation opportunities.

### 6. Operations / Thread Governor lane

Purpose: prevent duplicate or conflicting active workstreams.

Required action:
- Identify current active threads and browser/window workstreams where available.
- Group similar topics.
- Nominate a lead thread or deliberate fork.
- Close or archive duplicate drift.

### 7. Alerting / Reliability lane

Purpose: make bridge, queue, worker, scheduler, and processing failures visible.

Required action:
- Define minimum alerts for bridge down, queue backed up, no jobs processed, scheduler missed run, worker heartbeat stale, and repeated failures.
- Use available AWS/Supabase/Vercel/GitHub signal sources.
- Create a daily and near-real-time alert posture.

## Minimum alert set

These are required because the user should not discover hours later that nothing processed.

1. Bridge health alert
   - Trigger: bridge unavailable or no successful health check in defined interval.

2. Queue backlog alert
   - Trigger: queue depth above threshold or oldest item older than threshold.

3. No-processing alert
   - Trigger: queue exists but processed count does not move for defined interval.

4. Worker heartbeat alert
   - Trigger: Mac/EC2/Lambda/worker heartbeat stale.

5. Scheduler missed-run alert
   - Trigger: expected EventBridge/cron run did not produce a receipt.

6. Repeated failure alert
   - Trigger: same function, lane, or workflow fails repeatedly.

7. Receipt silence alert
   - Trigger: active build window but no receipts emitted.

8. Estate-risk alert
   - Trigger: change attempted against unknown Supabase dependency.

## Lightweight first deliverable

Do not start with a heavy build.

Start with:

1. A single daily estate status report.
2. A single health and queue alert definition.
3. A single work allocation board or issue set.
4. A single receipt schema proposal.
5. A single thread ownership rule.

## Recommended first practical implementation

Phase 1: lightweight evidence capture only.

- GitHub receipt files and issues are acceptable as a temporary coordination rail.
- Supabase should become the eventual ledger, but do not start by editing production Supabase.
- Use GitHub handoff receipt as the non-production coordination artefact.

Phase 2: read-only discovery.

- Inventory sources without changing them.
- Classify UNKNOWN explicitly.

Phase 3: alerting.

- Add bridge/queue/worker/scheduler alert definitions and then implement via existing AWS/Supabase channels.

Phase 4: Command Centre surface.

- Show estate, queue, bridge, alerts, and active-thread status.

## Definition of done for this handoff

This receipt is done when it is present in GitHub and can be used by another agent or chief-of-staff lane to allocate work.

The wider initiative is done only when:

- estate status is visible,
- Supabase dependency risk is visible,
- bridge/queue/worker/scheduler health is visible,
- active thread ownership is visible,
- receipt silence is detectable,
- and bad or duplicate workstreams can be closed or archived safely.

## Current reality status

Status: PARTIAL

Reason: understanding and allocation receipt has been lodged, but no runtime alerting, Supabase audit, estate inventory, or Command Centre dashboard has been proven from this receipt alone.

## Closing instruction

Allocate this rather than expand it into one giant task.

Preferred next owner: Chief of Staff / Operations coordinator.

Preferred immediate action: split into lanes, confirm owners, and start read-only inventory plus bridge/queue/worker alert design.
