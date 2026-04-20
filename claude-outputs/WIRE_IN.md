# WIRE-IN v2 — Non-Sandbox File Creation & Use

_Updated 2026-04-20 post-validation. Supersedes v1._

## TL;DR

For every file Claude produces, route to **both**:
1. **Google Drive** (primary, zero-config)
2. **GitHub** `TML-4PM/mcp-command-centre/claude-outputs/` (secondary, versioned)

`/mnt/user-data/outputs/` is **not the default** anywhere — only used for the Claude.ai `present_files` preview path.

## Canonical IDs

| Thing | Value |
|---|---|
| Drive folder | `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` (`My Drive/Claude/sandbox-outputs-mirror/`) |
| Mirror tool (Drive) | `1uetFxHD1J9i8EBGoNHX7xaOEWmFwXdQ5` |
| GitHub repo | `TML-4PM/mcp-command-centre`, branch `main`, path prefix `claude-outputs/` |
| Write-capable PAT | `cap_secrets.GITHUB_PAT` (93B, fine-grained, exp 2026-07-16) |
| Read-only PAT | `cap_secrets.GITHUB_TOKEN` (93B — cannot PUT, 403s. Use GITHUB_PAT for writes) |
| Supabase URL | `https://lzfgigiyqpuuxslsygjt.supabase.co` |
| Service key | `cap_secrets.SUPABASE_SERVICE_KEY` (also in `troy-sql-executor` Lambda env) |

## Session bootstrap

1. DNS-pin the bridge (standing sandbox bootstrap).
2. Confirm Drive connector loaded via `tool_search("google drive")`.
3. For writes: pull `GITHUB_PAT` + `SUPABASE_SERVICE_KEY` via bridge:
   ```sql
   select key, value from public.cap_secrets
   where key in ('GITHUB_PAT','SUPABASE_SERVICE_KEY') and is_deprecated=false
   ```
4. **Do NOT write artifacts to `/mnt/user-data/outputs/`.** Write to `/home/claude/` as scratchpad, then push to Drive + GitHub.

## Heredoc footgun — NEVER use bash heredoc for base64

**Proven regression**: `cat > f <<'EOF'` with long single-line base64 corrupts content. Decoded `t4h_mirror.py` ended with `__main  ` (spaces) instead of `__main__` (underscores) → `main()` silently skipped at runtime.

**Use Python for every b64 read/write:**
```python
import base64, pathlib
# Encode
b64 = base64.b64encode(pathlib.Path("/path/to/file").read_bytes()).decode()
# Decode
pathlib.Path("/path/to/file").write_bytes(base64.b64decode(b64))
```

## Drive push (primary path)

```python
# Directly invoke Google Drive:create_file tool with parentId = the mirror folder.
# Content is base64 of raw bytes. Set disableConversionToGoogleType=true for markdown/code.
```

## GitHub push (secondary — versioned history)

```python
import base64, json, urllib.request as R, urllib.parse as P
REPO, BRANCH = "TML-4PM/mcp-command-centre", "main"
def gh(method, path, body=None, pat=PAT):
    data = json.dumps(body).encode() if body else None
    req = R.Request(f"https://api.github.com{path}", data=data, method=method,
        headers={"Authorization":f"Bearer {pat}","Accept":"application/vnd.github+json",
                 "Content-Type":"application/json","User-Agent":"t4h-mirror/2.0"})
    try:
        with R.urlopen(req, timeout=30) as r: return r.status, json.loads(r.read() or b"null")
    except R.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, e.read().decode()[:300]

def push(local_bytes, repo_path):
    # Idempotent: look up existing sha first
    code, existing = gh("GET", f"/repos/{REPO}/contents/{P.quote(repo_path)}?ref={BRANCH}")
    sha = existing.get('sha') if code == 200 and isinstance(existing, dict) else None
    body = {
        "message": f"mirror: {repo_path} ({len(local_bytes)} bytes)",
        "content": base64.b64encode(local_bytes).decode(),
        "branch": BRANCH,
    }
    if sha: body["sha"] = sha
    return gh("PUT", f"/repos/{REPO}/contents/{P.quote(repo_path)}", body)
```

All mirror paths should go under `claude-outputs/` in the repo. For dated artifacts use `claude-outputs/sessions/YYYY-MM-DD/filename.ext`.

## Bridge SQL — what works, what doesn't

**Reads**: work via `{fn:"troy-sql-executor", payload:{sql:"..."}}`. Returns `{success, rows, count, command}`.

**Writes**: work when the SQL is valid. A `sql_error` response means the SQL failed — could be schema mismatch, constraint violation, or permission issue. The bridge hides error detail (bug: it masks `run_sql`'s real error message and sqlstate behind an opaque `"sql_error"`).

**Workaround for debugging SQL errors**: bypass the bridge and call Supabase `run_sql` RPC directly with the service key. You get the real error + sqlstate:
```python
# Direct run_sql RPC — exposes real error details
req = R.Request(f"{SB_URL}/rest/v1/rpc/run_sql", data=json.dumps({"query": sql}).encode(),
    headers={"apikey":SB_KEY, "authorization":f"Bearer {SB_KEY}", "content-type":"application/json"})
```

## Canonical change broadcast

After any material infrastructure change, INSERT into `public.t4h_canonical_changes`. A trigger auto-broadcasts to Telegram + cross-LLM scratchpad. Required columns:

```sql
INSERT INTO public.t4h_canonical_changes
    (change_type, title, summary, affected, author, broadcast_to, severity, memory_key, evidence_ref)
VALUES (
    'SYSTEM_CHANGE',  -- or MILESTONE/SCHEMA_CHANGE/BUSINESS_CHANGE/IP_CHANGE/
                      --    PRODUCT_CHANGE/FINANCIAL_CHANGE/BLOCKER/DECISION
    '<one-line title>',
    '<longer summary>',
    ARRAY['tag1','tag2']::text[],
    'claude',
    ARRAY['telegram','scratchpad']::text[],  -- default is {claude,gemini,telegram}
    'NORMAL',  -- or LOW/HIGH/CRITICAL
    '<memory_key>',
    '<url or ref>'
)
```

## Rollback

```sql
-- DB: mark superseded (append-only, don't delete)
UPDATE public.t4h_canonical_changes SET severity='LOW'
WHERE memory_key = 'claude_mirror_bootstrap_20260419';
```
```
# Drive
Delete folder 1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs
# GitHub
# No rollback needed — contents API keeps git history; can revert commits if needed
```

## Evidence (this bootstrap)

- Drive folder: https://drive.google.com/drive/folders/1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs
- GitHub tree: https://github.com/TML-4PM/mcp-command-centre/tree/main/claude-outputs
- Canonical change: `t4h_canonical_changes.id = 176`, `broadcast_ok = true`, broadcast at 2026-04-20T04:57:42Z
- Bridge SQL reads: working (`{success:true, rows:[...], count:N, command:"SELECT"}`)
- Bridge SQL writes: working for valid SQL
- Python b64 roundtrip: sha256 byte-identical both directions
