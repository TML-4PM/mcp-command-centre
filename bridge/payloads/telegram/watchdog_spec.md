# Telegram Bridge Runner — Persistence / Watchdog Spec

## Objective
Ensure the Telegram ingress remains continuously active, healthy, and MCP-compliant without manual intervention.

## Loop Model
BridgeRunner (or control plane) must run a repeating loop:

1. Sweep repository
2. Detect persistence_contract.json
3. Validate desired_state == active
4. Perform checks
5. Execute recovery if drift detected
6. Log evidence

## Checks
- Lambda exists and is deployed
- Handler uses index.mcp.js (not legacy index.js)
- Telegram webhook is set
- Bridge endpoint reachable
- Supabase table telegram_events exists
- Recent events processed (< 5 min window)

## Drift Conditions
- Lambda missing or outdated
- Webhook unset or mismatched
- Legacy payload usage detected
- No recent events (stalled ingestion)

## Recovery Actions
- Redeploy Lambda
- Re-run wire_webhook.sh
- Reapply DDL
- Reissue execute_request.json

## Success Condition
System is considered persistent when:
- All checks pass continuously
- No HITL required
- Commands execute end-to-end
- Evidence logs confirm activity

## Enforcement Principle
This is not a deployable artifact.
This is a continuously enforced service.

Treat failures as state drift, not errors.
