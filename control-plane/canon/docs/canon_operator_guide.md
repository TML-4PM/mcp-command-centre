# Canon Operator Guide

## Purpose

This guide defines how the universal canon is injected, rebound, quarantined, logged, and surfaced through the command centre.

## Commands

- `/canon` soft inject
- `/canon-rebind` re-evaluate prior answer against canon
- `/canon-quarantine` stop unsafe trust and recover
- `/canon-check` detect drift and apply lowest necessary correction
- `/canon-sync` refresh active prompt profiles
- `/canon-nightly` audit alignment and repeated drift

## Prompt assembly order

1. Universal canon
2. Model overlay if applicable
3. Canon command if triggered
4. Active task payload

## Drift conditions

- missing registry logic
- missing evidence logic
- false completion claims
- missing runtime path
- missing recovery path
- missing telemetry
- missing closure logic
- ignored autonomy tier
- ignored support-state transition

## Session states

- ALIGNED
- DRIFTING
- REBOUND
- QUARANTINED

## Reality Ledger expectation

Every canon intervention must emit evidence containing:
- session key
- model family
- trigger hits
- drift score
- command applied
- resulting alignment state
- classification

## Notes

Quarantine should be treated as gated when destructive or governance-sensitive actions are involved.
