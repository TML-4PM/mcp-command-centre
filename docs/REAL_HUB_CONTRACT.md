# MCP Command Centre — Real Hub Contract

Production path:
EventBridge Scheduler -> API Gateway invoke -> troy-code-pusher

Secondary/manual path:
Operator or UI -> Vercel bridge -> API Gateway invoke

Canonical repo:
TML-4PM/mcp-command-centre

Canonical function:
troy-code-pusher

Canonical scheduler payload:
aws/scheduler_payload_control_tower.json

Security rules:
- No secrets in source
- BRIDGE_API_KEY from environment only
- SCHEDULER_SECRET from environment only

Reality rules:
System is REAL only when scheduler exists, is enabled, invokes correctly, and writes execution evidence
