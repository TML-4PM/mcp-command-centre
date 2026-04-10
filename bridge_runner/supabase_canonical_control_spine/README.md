# Bridge Runner Pack — Supabase Canonical Control Spine

This pack establishes the canonical Supabase control spine for Tech 4 Humanity and prepares it for bridge-runner execution.

Contents
- bridge_runner_payload.json — canonical invoke envelope for bridge execution
- bridge_runner_payload.yaml — YAML variant
- docs/canonical_supabase_standard.md — authoritative narrative standard
- supabase/001_canonical_spine.sql — schemas, enums, registry, evidence, runtime, closure, UI, integration, commercial foundations
- supabase/002_seed.sql — canonical seed records and starter widgets
- supabase/003_rls.sql — baseline RLS enablement and service-role policies
- ops/file_tree.txt — implementation layout
- ops/run_order.md — execution order and operator notes

Purpose
- make Supabase the canonical source for control, state, evidence, closure, UI registry, and integration governance
- stop schema drift and status drift
- bind all meaningful systems to REAL / PARTIAL / PRETEND classification
- expose command-centre-ready truth surfaces

Execution doctrine
- run 001 first
- run 002 second
- run 003 third
- then backfill live systems into `ops.system_registry`
- then bind evidence with `select audit.fn_bind_reality_state('<object_key>');`

Notes
- non-destructive foundation pack
- safe to apply before deeper domain backfill
- replace request IDs / timestamps if required by your runner
- adjust RLS for end-user roles later; this pack only lays down the service-role baseline
