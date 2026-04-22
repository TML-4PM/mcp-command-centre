# MCP Control Plane Expansion

## Purpose

Move the current MCP surface from a utility belt into a portfolio-grade control plane.

Current live MCP evidence shows a narrow read-heavy surface:

- `health_check`
- `supabase_schema_read`
- `supabase_sql_read`
- `supabase_sql_write_gated`
- `github_repo_inspect`
- `github_file_read`
- `gdrive_search`
- `gdrive_file_read`
- `vercel_project_inspect`
- `vercel_deployments_list`
- `aws_lambda_inspect`
- `aws_lambda_logs_read`
- `aws_s3_list`

That proves the bridge is alive, but not yet operating as a true execution, evidence, governance, and recovery plane.

## North Star

The MCP layer must support:

1. registry
2. runtime
3. reality evidence

Without those three layers, the system can inspect but cannot reliably govern, close, prove, or monetise work.

---

## Capability Expansion Set

### 1. Orchestration

- `run_workflow`
- `route_task`
- `schedule_job`
- `retry_failed_task`
- `cancel_execution`
- `parallel_execute`

### 2. Observability and reality binding

- `log_event`
- `record_metric`
- `attach_evidence`
- `get_execution_trace`
- `classify_reality_state`
- `emit_alert`

### 3. Revenue and commercial

- `create_stripe_product`
- `create_checkout_session`
- `record_transaction`
- `link_usage_to_billing`
- `generate_invoice`
- `calculate_roi`

### 4. Distribution and publishing

- `publish_content`
- `send_email_campaign`
- `post_to_linkedin`
- `trigger_outreach_sequence`
- `track_engagement`
- `capture_lead`

### 5. Agent runtime

- `spawn_agent`
- `assign_agent_task`
- `get_agent_status`
- `terminate_agent`
- `scale_agent_pool`
- `load_agent_pack`

### 6. Knowledge and memory

- `create_knowledge_node`
- `link_knowledge_nodes`
- `search_knowledge_graph`
- `summarise_context`
- `version_knowledge`
- `promote_to_canonical`

### 7. Governance and consent

- `check_permission`
- `request_consent`
- `log_consent_event`
- `mask_sensitive_data`
- `audit_access`

### 8. Data transformation

- `transform_data_schema`
- `validate_payload`
- `clean_dataset`
- `merge_datasets`
- `deduplicate_records`

### 9. Asset lifecycle

- `register_asset`
- `version_asset`
- `archive_asset`
- `delete_asset_safe`
- `generate_download_bundle`

### 10. Testing and simulation

- `run_test_suite`
- `simulate_workflow`
- `validate_output`
- `compare_runs`
- `chaos_test`

### 11. Command Centre read layer

- `get_system_status`
- `get_kpi_snapshot`
- `get_active_runs`
- `get_blockers`
- `generate_board_report`

### 12. Self-healing autonomy

- `detect_failure_pattern`
- `auto_create_task`
- `auto_assign_fix`
- `auto_retry_with_variation`
- `escalate_to_human`
- `learn_from_failure`

---

## High-value anti-drift additions

These close portfolio-scale gaps fast:

- `resolve_identity_context`
- `enforce_rate_limit`
- `compute_operation_hash`
- `detect_duplicate_execution`
- `claim_work_item`
- `release_work_item`
- `publish_board_pack`
- `sync_drive_manifest`
- `materialise_dashboard_view`
- `reconcile_registry_vs_runtime`
- `close_execution_loop`
- `backfill_missing_evidence`
- `score_capability_maturity`
- `promote_capability_version`
- `deprecate_capability`
- `bind_task_to_calendar`
- `create_cal_booking`
- `sync_mailbox_route`
- `run_retention_policy`
- `export_audit_bundle`

---

## Control-plane design rules

### 1. Registry-first

Every MCP capability must exist in a capability registry with:

- canonical name
- version
- owner
- runtime target
- auth mode
- autonomy tier
- input contract
- output contract
- evidence requirements
- failure policy
- retirement status

### 2. Runtime-bound

Every execution must produce:

- execution id
- operation hash
- requested actor
- resolved identity context
- target system
- timestamps
- outcome
- rollback reference if applicable

### 3. Reality-bound

Every materially important MCP action must produce evidence:

- logs
- external ids
- changed record ids
- screenshots or attachments where relevant
- trace link
- classified reality state: `REAL`, `PARTIAL`, or `PRETEND`

### 4. Autonomy tiering

Suggested default tiers:

- `AUTO`: read, inspect, classify, enqueue, simulate
- `LOG`: append-only writes, telemetry, non-destructive registration
- `GATED`: deletes, schema mutation, publish, send, deploy, consent-sensitive actions
- `BLOCKED`: payments movement, IAM/credential actions, legal attestations without human approval

### 5. Idempotency first

All write-path capabilities should support:

- `operation_key`
- `operation_hash`
- duplicate detection
- retry state
- execution lease or claim lock where concurrency matters

---

## Recommended implementation order

### Phase 1 — make the current bridge operationally honest

Implement first:

- `log_event`
- `attach_evidence`
- `get_execution_trace`
- `classify_reality_state`
- `compute_operation_hash`
- `detect_duplicate_execution`
- `reconcile_registry_vs_runtime`
- `get_system_status`
- `get_active_runs`
- `get_blockers`

### Phase 2 — close the loop

- `run_workflow`
- `route_task`
- `retry_failed_task`
- `cancel_execution`
- `claim_work_item`
- `release_work_item`
- `close_execution_loop`
- `backfill_missing_evidence`

### Phase 3 — monetise and distribute

- `create_stripe_product`
- `create_checkout_session`
- `record_transaction`
- `link_usage_to_billing`
- `publish_content`
- `send_email_campaign`
- `track_engagement`
- `capture_lead`

### Phase 4 — scale agent runtime and governance

- `spawn_agent`
- `assign_agent_task`
- `scale_agent_pool`
- `load_agent_pack`
- `check_permission`
- `request_consent`
- `audit_access`
- `run_retention_policy`

---

## Minimum contract additions

Each MCP capability should expose metadata sufficient for Command Centre rendering:

```json
{
  "capability_name": "run_workflow",
  "capability_version": "1.0.0",
  "autonomy_tier": "GATED",
  "reality_requirement": "evidence_required",
  "idempotent": true,
  "supports_dry_run": true,
  "supports_rollback": true,
  "writes_state": true,
  "emits_metrics": true,
  "owner": "control-plane"
}
```

---

## Blunt view

Stopping at file tools would create a larger pile of scripts.

A real control plane needs to:

- register work
- execute work
- observe work
- recover work
- govern work
- monetise work
- prove work

That is the line between helpers and an operating system.
