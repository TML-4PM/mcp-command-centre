# MCP Command Centre — Real Hub Contract

Production path:
Operator, UI, or agent -> Vercel bridge or direct API Gateway invoke -> troy-code-pusher

Retired path:
EventBridge Scheduler, EventBridge Rules, and cron-based orchestration are retired for this hub.
Do not create, update, or rely on scheduled triggers for command-centre execution.

Canonical repo:
TML-4PM/mcp-command-centre

Canonical function:
troy-code-pusher

Canonical bridge payload:
aws/bridge_payload_control_tower.json

Canonical bridge invoke script:
aws/invoke_bridge_control_tower.sh

Reality rules:
System is REAL only when the bridge endpoint exists, accepts authenticated invoke requests, executes troy-code-pusher successfully, and writes execution evidence.
