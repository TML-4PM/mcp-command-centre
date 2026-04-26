# RECEIPT — MCPHUB-REMOTE-EC2-2026-04-26-01

- **Status:** OPEN
- **Layer:** symbio.ops
- **Source:** the-pen
- **Executor:** bridge_runner
- **Owner:** Troy Latter
- **Date:** 2026-04-26
- **Session:** claude.ai (this session had bridge access)

## Finding

Remote MCP endpoint configured in Claude connector as:
`http://16.176.223.193:3000/api/mcp`

Confirmed via this session:
- `troy-ec2-manager` bridge invoke → returns `ok:true` but ignores all action params; hardcoded to `overnight-default` response regardless of payload. Routing is broken.
- T4H Remote MCP server (`health_check`) → hard error mid-session; MCP process crashed on EC2 during run.
- Direct bridge endpoint `https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke` → alive and responding.
- EC2 instance `i-09f18f2e1123a5702` (ap-southeast-2a) → SSM commands sent but output unverifiable (manager does not route them).
- External reachability of `16.176.223.193:3000` → NOT tested this session; prior session confirmed timeout/packet loss from Troy's Mac.

## Root Causes Identified

| Issue | Root Cause |
|---|---|
| MCP server down | Process on EC2 crashed; no supervisor (pm2/systemd) restarting it |
| ec2-manager broken | Lambda handler hardcoded to `overnight-default`; ignores `action` param entirely |
| No SSM output confirmation | ec2-manager never routes `ssm-command` — all payloads hit the same dead branch |
| CloudWatch logs inaccessible | T4H MCP server has no AWS credentials attached |

## Required Actions

1. **Fix ec2-manager Lambda** — add action routing: `describe`, `ssm_run`, `start`, `stop`. Source is in `TML-4PM/mcp-command-centre` — not found in tree, likely deployed direct to AWS without repo sync.
2. **Restart MCP process on EC2** — SSH or SSM into `i-09f18f2e1123a5702`, confirm process on port 3000, add pm2/systemd supervisor.
3. **Verify public IP** — current IP may have changed if instance was stopped/started. Get current `PublicIpAddress` from EC2 describe.
4. **Fix SG** — confirm inbound TCP 3000 open from bridge runner IP.
5. **Update Claude connector** — only after endpoint responds: recreate connector with stable URL.
6. **Attach AWS creds to T4H MCP server** — enables CloudWatch log reads, Lambda inspect.

## Evidence This Session

- Lead inserted: `id: 6fbbe20a-b9c8-4151-9ac1-430a6af2677b` (public.leads, brand=t4h, state=DISCOVERY)
- Queue confirmed: `ops.work_queue` has 15 WIP jobs, 302 archived
- `troy-worker` confirmed alive but drains `execution_tasks` (not `ops.work_queue`)
- Bridge endpoint confirmed alive via direct curl

## Close Condition

Close only when:
- EC2 MCP process is supervised and running
- `troy-ec2-manager` routes actions correctly and SSM output is confirmed
- Claude connector recreated pointing at stable, reachable endpoint
- Old IP `16.176.223.193:3000` removed from all active connectors/configs

