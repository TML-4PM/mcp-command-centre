# T4H Sandbox Mirror — Convention

**Problem:** `/mnt/user-data/outputs/` is sandbox-scoped. It resets between Claude tasks.
Files created there are ephemeral and cannot be referenced in later sessions.

**Solution:** Claude writes artifacts directly to persistent destinations:

| Destination | Location | When |
|---|---|---|
| **Google Drive** (primary) | `My Drive / Claude / sandbox-outputs-mirror/` — folder id `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` | Every artifact. Zero-config (Drive connector always available). |
| **GitHub** (optional) | `TML-4PM/claude-outputs` (or task-specific repo) | Text / code / reports that benefit from version history. Needs `GH_PAT` in session env or cap_secrets. |
| `/mnt/user-data/outputs/` | sandbox | **Do not use.** Left empty. Only exception: when `present_files` is needed for the Claude.ai preview, which requires the file to live there; in that case write to Drive first, then copy. |

## How Claude uses this

1. Create content in `/home/claude/...` (scratchpad — never shown to user).
2. Upload to Drive via `Google Drive:create_file` with `parentId=1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs`.
3. If GitHub is wanted, run `/home/claude/t4h_mirror.py <file> --dest github-only --path <path>` with `GH_PAT` exported.
4. Return the Drive `viewUrl` and GitHub `html_url` to Troy as the canonical references.

## Drive folder layout

```
Claude/
├── sandbox-outputs-mirror/           ← this folder, id 1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs
│   ├── README.md                     ← this file
│   ├── t4h_mirror.py                 ← the helper (reference copy)
│   ├── <session-date>/               ← one subfolder per session (optional)
│   └── ...
```

## GitHub setup (one-off, when you want it)

```bash
# From a Troy shell (not Claude sandbox), create the repo:
gh repo create TML-4PM/claude-outputs --private --description "Mirror of Claude artifacts"

# Store PAT in cap_secrets for bridge-side use:
INSERT INTO core.cap_secrets (key, value, description, created_at)
VALUES ('GITHUB_PAT_CLAUDE_MIRROR', '<PAT>', 'GitHub PAT for mirroring Claude outputs — contents:write only', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

Fine-grained PAT scopes required: `contents:write` on `TML-4PM/claude-outputs` only.
Classic PAT: `repo` (broader than needed — prefer fine-grained).

## Kill switch

To disable Drive writes in a session, unset `T4H_DRIVE_FOLDER`. To disable GitHub, unset `GH_PAT`.
Mirror tool always reports which destinations were hit in its JSON output.

## Evidence (this session)

- Drive folder created: `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` at 2026-04-19T11:30:04Z
- Owner: troy.latter@gmail.com
- Parent: `My Drive / Claude` (id `1GQsj4wy_oQJ3M65C2yAbM1kJeMJv9T-H`)

---

_Last updated: 2026-04-19 — session bootstrap._
