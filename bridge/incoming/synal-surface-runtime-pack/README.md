# Synal Surface Runtime Bridge Pack

Status: READY_TO_DEPLOY
Mode: bridge-runner
Target: Synal multi-surface runtime
Contract: no-HITL default, dry-run first, validate, repair, gated write only where authority is required

## Objective
Deploy the next production-ready Synal surface plan as a unified runtime across these delivery surfaces:
- browser extension
- web applet
- widget
- browser proper
- desktop
- app store app

## Core doctrine
Do not build each surface as an isolated product.
Build one shared runtime with multiple shells.
The system of record is:
- identity layer
- bridge client
- task queue
- closure/evidence binding
- reality classification
- telemetry/command centre
- agent runtime

Everything else is an entry point or distribution shell.

## Required output from Bridge Runner
1. Validate current repo/state against this pack.
2. Create or update canonical implementation folder(s) for Synal surfaces.
3. Emit production-ready architecture spec, file tree, manifests, contracts, and starter code stubs where missing.
4. Bind every surface to a shared bridge invoke envelope.
5. Bind every surface to evidence logging and REAL/PARTIAL/PRETEND classification.
6. Produce closure record and status update.
7. Return deploy status, confidence score, blockers, and exact next writes if any authority is missing.

## Mandatory surfaces
### 1. Browser extension
Required:
- manifest v3
- background service worker
- content scripts
- side panel
- command palette
- permissions model
- auth/session handoff
- bridge client
- evidence capture hooks

### 2. Web applet
Required:
- lightweight web shell
- authenticated task launcher
- workflow forms
- bridge task dispatch
- result rendering
- telemetry hooks

### 3. Widget layer
Required:
- embeddable JS widget shell
- config registry lookup
- realtime/poll fallback
- role-aware rendering
- command centre widgets
- evidence/truth-state badges

### 4. Browser proper
Required:
- future-state Chromium shell strategy
- capture primitives
- trusted runtime hooks
- extension migration path
- security posture

### 5. Desktop app
Required:
- Tauri-first architecture
- local worker loop
- notifications
- secure secret storage
- filesystem access model
- background sync
- queue execution
- evidence logging

### 6. App store app
Required:
- signed wrapper strategy
- permissions minimisation
- privacy declarations
- store-safe shell using shared backend power
- distribution notes for macOS first

## Implementation priority
1. Desktop app shell
2. Shared runtime core
3. Thin browser extension
4. Widget layer
5. Web applets
6. Browser proper strategy
7. App store packaging

## Shared runtime modules
- auth
- bridge
- queue
- ledger
- telemetry
- agent-runner
- config
- evidence
- command-centre integration

## Delivery standard
Wave 10 minimum.
Level 35+ architecture target.
No placeholders presented as done.
Anything not evidenced must be marked PARTIAL.

## Expected artefacts
- architecture.md
- surface-matrix.md
- deploy-checklist.md
- bridge-manifest.json
- starter file tree
- closure record

## Success condition
Bridge Runner can pick this up, assess current state, scaffold missing operational layers, and return a deployable Synal runtime pack with evidence-backed status.
