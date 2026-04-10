# Bridge Runner Pack — Control Tower + EventBridge Autofix

This pack turns the Site Registry / Control Tower concept into a bridge-ready deployment bundle.

Contents
- bridge_runner_payload.json — canonical invoke envelope
- bridge_runner_payload.yaml — YAML variant
- supabase/001_control_tower.sql — schema, views, triggers
- vercel/pages/api/sites.ts — frontend API route
- vercel/pages/api/health.ts — simple health probe
- aws/aws_cli_bootstrap.sh — bus, schedule group, queue, rules, and targets
- aws/scheduler_hourly_input.json — scheduler payload
- aws/scheduler_nightly_input.json — scheduler payload
- aws/event_patterns/site_violation_detected.json
- aws/event_patterns/site_autofix_completed.json
- lambdas/shared_events.py — EventBridge emitter
- lambdas/t4h_site_scan_launcher.py
- lambdas/t4h_autofix_router.py
- lambdas/t4h_autofix_health_refresh.py
- lambdas/t4h_autofix_reality_recalc.py
- frontend/control_tower_page.tsx — shareable / operational page
- ops/file_tree.txt — implementation layout

Notes
- Safe autofix only.
- No destructive mutation.
- Replace placeholder ARNs, account IDs, URLs, and DSNs before execution.
