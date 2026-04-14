# Control Tower Rehydration Project Pack

## Purpose
Apply the existing T4H control-tower, control-plane, CTEL, and SREP doctrine to the live command-centre estate without recreating concepts that already exist.

## Existing canon located

The existing architecture already defines Synal as a signal-driven operating system with a command layer made up of the Command Centre and control plane, above signal, task, action, flow, and proof layers. It explicitly places Command Centre as the command/control layer and Reality Ledger as the proof layer. The control-tower/control-plane issue described in the prior work is not absence of concepts, but lack of enforced entry gating and sweepability across legacy and new assets. Existing doctrine already names CTEL as the supervisory enforcement loop and SREP as the protocol to inventory, classify, bind, execute, prove, and recover legacy assets. See source extracts for the command layer and control-plane definitions, the control-tower problem statement, the three-plane model, the CTEL/SREP doctrine, and the operational canon. fileciteturn1file0 fileciteturn1file2 fileciteturn1file3 fileciteturn1file7 fileciteturn1file8 fileciteturn1file10 fileciteturn1file11 fileciteturn1file12 fileciteturn1file13

## Operating conclusion

Do not rebuild the control tower or control plane. Rehydrate and enforce the ones already defined:
- Command Centre = control plane / command layer
- Factors + Supabase + Bridge = data plane
- Command Centre UI / presentation surfaces = presentation plane
- CTEL = enforcement loop
- SREP = legacy recovery and execution sweep protocol
- Reality Ledger = proof and truth-state binding

## Level 35 / Wave 20 interpretation for this pack

This pack assumes:
- architecture level target >= 35
- automation maturity target >= Wave 20
- no HITL by default except where external authority, credentials, or destructive actions block autonomous execution
- closure claims only after runtime proof

## Execution scope

1. Rehydrate existing assets into one sweepable inventory.
2. Bind inventory rows to invoke paths, telemetry state, proof locations, and recovery paths.
3. Route all existing payloads, repos, jobs, widgets, and control surfaces through the control tower doctrine rather than creating parallel constructs.
4. Trigger /rehydrate, /sweep, /prove as one canonical bridge action.
5. Output a board-facing status paper and a bridge-runner payload.

## Canonical commands

- `/tower /rehydrate /sweep /prove`
- `finish it = forge + register + bind + sweep + prove + schedule + monitor + recover`
- `run everything = SREP execution sweep over all REAL and eligible PARTIAL assets`

## Required inventory classes

Per the existing SREP doctrine, the sweep inventory must cover:
- github repos
- bridge packs
- lambda functions
- eventbridge rules
- cron jobs
- supabase tables/views/functions
- ui widgets
- drive/notion handoff packs
- orphaned artifacts

## Required truth-state model

For each asset:
- REAL = exists and runnable
- PARTIAL = exists but missing one or more binding layers
- PRETEND = docs or code without runtime proof

## Mandatory completion gate

An asset cannot be marked complete unless the control tower can:
- see it
- classify it
- invoke it
- monitor it
- prove it
- recover it

## Deliverables in this pack

1. This project pack
2. Board paper
3. Bridge payload
4. Previously added closure register for the uploaded audit

## Notes

This pack does not claim that AWS, Supabase, EventBridge, cron, or bridge execution was performed from this chat. It packages the existing doctrine and the uploaded audit into bridge-ready artifacts inside the command-centre repo so the existing control-plane path can execute against them.