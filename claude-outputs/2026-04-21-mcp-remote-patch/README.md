# Render env vars — t4h-remote-mcp-server-clean service

Generated: 2026-04-21 for MCP control plane consolidation.

## Fix sequence

1. Render dashboard → `t4h-remote-mcp-server-clean` service
2. Settings → Repository → change to `TML-4PM/t4h-remote-mcp-server`
3. Settings → Branch → `main`
4. Settings → Dockerfile path → `./Dockerfile` (or leave if render.yaml is detected)
5. Environment tab → set the vars listed below
6. Manual Deploy → Deploy latest commit
7. After success: ChatGPT connector → Refresh → should show 13 tools
8. Apply patches `INSERT_1_config.ts` + `INSERT_2_tools.ts` to `src/index.ts` in main repo, commit, redeploy → 18 tools

## Env vars to set (values fetched separately — see chat or cap_secrets)

| Var | Source | Notes |
|---|---|---|
| `MCP_AUTH_TOKEN` | `cap_secrets.MCP_AUTH_TOKEN` (rotated 2026-04-21) | bearer for MCP auth |
| `MCP_PUBLIC_READONLY` | literal `false` | enables gated writes |
| `SUPABASE_URL` | `cap_secrets.SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `cap_secrets.SUPABASE_SERVICE_ROLE_KEY` | |
| `SUPABASE_DB_URL` | `cap_secrets.SUPABASE_DB_URL` | enables direct pg pool (faster) |
| `SUPABASE_SQL_RPC` | literal `run_sql` | canonical RPC name |
| `GITHUB_TOKEN` | `cap_secrets.GITHUB_PAT` (write) | code expects var name GITHUB_TOKEN |
| `VERCEL_TOKEN` | `cap_secrets.VERCEL_TOKEN` | |
| `AWS_REGION` | literal `ap-southeast-2` | |
| `AWS_ACCESS_KEY_ID` | `cap_secrets.AWS_ACCESS_KEY_ID` | |
| `AWS_SECRET_ACCESS_KEY` | `cap_secrets.AWS_SECRET_ACCESS_KEY` | |
| `T4H_BRIDGE_URL` | literal bridge URL | for new t4h_bridge_invoke tool |
| `T4H_BRIDGE_KEY` | `bk_tOH8P5...` (or from cap_secrets) | bridge x-api-key |

Values pulled live via bridge in originating Claude session. Not committed to repo (GitHub secret scanner blocks).

## After deploy — validation

```
curl https://t4h-remote-mcp-server-clean.onrender.com/healthz
# expect: {"ok":true,"name":"t4h-remote-mcp-server","version":"1.0.4",...}
```

ChatGPT + Claude.ai both refresh their connector → 18 tools visible.
