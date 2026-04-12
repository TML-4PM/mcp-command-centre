# Spine Substrate

## Purpose

Spine is the mandatory runtime substrate for all real builds in the MCP Command Centre estate.

A build is considered real only when it inherits Spine rather than re-implementing its own runtime, governance, telemetry, retry logic, dashboards, and stage-gate behavior.

## What Spine provides

### Mandatory shared layers
- provider routing
- retry and failover
- cost governance
- run lifecycle management
- telemetry and metrics publishing
- truth and evidence binding
- stage-gate escalation
- dashboard feed publication
- closure and completion classification

### Build-specific layers that stay outside Spine
- domain prompts
- domain schemas
- source adapters
- output templates
- UI specifics
- business logic

## Architecture

```text
Spine
  ├─ runtime_engine
  ├─ provider_router
  ├─ retry_failover
  ├─ cost_governance
  ├─ telemetry
  ├─ stage_gate_engine
  ├─ truth_binding
  ├─ dashboard_publisher
  └─ closure_engine

Build Pack
  ├─ build.config.yaml
  ├─ adapter.py
  ├─ prompts/
  ├─ outputs/
  ├─ ui/
  └─ source_adapters/
```

## Core rule

Every new build should start on Spine.

No new autonomous build should create its own:
- direct provider execution path
- local retry logic
- custom budget logic
- bespoke dashboard feed
- isolated run-state machine

These belong to Spine.

## Shared runtime contract

Every Spine-native build must declare at least:

```yaml
build_key: example_build
build_type: agentic_app
runtime_mode: continuous
spine_required: true
governance_profile: default
truth_binding: required
stage_gates: enabled
budget_policy: default
dashboard_slug: example-build
```

## Standard run lifecycle

All builds must use the same lifecycle:

```text
created -> queued -> running -> stage_gate -> completed
                         -> failed
                         -> paused
```

## Standard telemetry events

All builds must emit:
- run_started
- provider_attempt
- provider_failed
- agent_completed
- stage_gate_raised
- budget_warning
- budget_stop
- output_persisted
- run_completed
- run_failed

## Subspines

Subspines are domain-specific operating layers built on top of Spine.

Examples:
- document_loop_subspine
- site_readiness_subspine
- campaign_execution_subspine
- browser_capture_subspine
- data_ingestion_subspine

Subspines may define domain helpers, but they must still inherit Spine behavior.

## Vertebrae

Reusable Spine modules are the vertebrae.

Minimum vertebrae:
- provider_router
- retry_failover
- cost_governance
- telemetry
- truth_binding
- stage_gates
- dashboard_publisher
- closure_engine

## Veins

Veins are the transport channels.

Examples:
- GitHub pack manifests
- bridge runner invoke envelopes
- Supabase writes
- EventBridge events
- dashboard API feeds
- notifications

## Enforcement rule

If a build does not mount on Spine, it is not considered production-governed.

## Reference implementation

The first canonical reference implementation is:
- `bridge_runner/packs/core5_continuous_loop_pack/`

This pack should be used to extract the shared spine layers into reusable modules and then applied across future builds.
