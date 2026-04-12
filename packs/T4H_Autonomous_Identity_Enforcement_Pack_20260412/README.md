# T4H Autonomous Identity + Style Enforcement Pack

This pack turns the “8 files to master Claude” idea into a T4H-grade execution layer.

## What this pack does
- Creates a canonical identity layer
- Creates a style enforcement engine
- Creates prompt contracts and global rules
- Adds execution logs and quality telemetry
- Adds a Python Lambda for runtime style scanning
- Adds a Command Centre widget for visibility
- Adds bridge-ready invoke envelopes

## Core principle
This is not a personal productivity folder model.

This is an enforcement spine:
identity -> prompt contract -> output -> style scan -> reality classification -> telemetry

## Files
- `sql/001_identity_and_voice.sql`
- `sql/002_style_prompt_rules.sql`
- `sql/003_execution_and_telemetry.sql`
- `lambda/t4h_style_filter_lambda.py`
- `widgets/t4h_identity_style_widget.html`
- `bridge/bridge_ready_payloads.json`
- `docs/IMPLEMENTATION_RUNBOOK.md`

## Recommended install order
1. Apply SQL 001
2. Apply SQL 002
3. Apply SQL 003
4. Deploy Lambda
5. Register Lambda in bridge registry
6. Publish widget snippet to `t4h_ui_snippet`
7. Run smoke tests from runbook
