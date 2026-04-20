# WIRE-IN — How a Future Claude Session Installs the Mirror Tool

**Canonical source of truth:** `t4h_mirror.py` in Drive folder `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs`, file id `1uetFxHD1J9i8EBGoNHX7xaOEWmFwXdQ5`.

**Session bootstrap sequence** (runs once per Claude session, after the DNS pin):

1. Call `tool_search` with query `google drive download` to load `Google Drive:download_file_content`.
2. Invoke `Google Drive:download_file_content` with `fileId=1uetFxHD1J9i8EBGoNHX7xaOEWmFwXdQ5`.
3. Base64-decode the returned `blob` and write to `/home/claude/t4h_mirror.py`.
4. `chmod +x /home/claude/t4h_mirror.py` and add `/home/claude` to PATH (or call by full path).
5. Export `T4H_DRIVE_FOLDER=1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` in the session.
6. If GitHub leg is wanted: export `GH_PAT` (from cap_secrets `GITHUB_PAT_CLAUDE_MIRROR` once Troy provisions it) and `T4H_GH_REPO=TML-4PM/claude-outputs`.

## One-block bash implementation (paste-ready)

The orchestrator (Claude) should invoke `Google Drive:download_file_content` directly; this block assumes the base64 has been written to `/tmp/mirror.b64`:

```bash
set -e
# DNS pin for bridge (standing convention)
getent hosts zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com >/dev/null 2>&1 || \
  echo "52.62.9.147 zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com" | sudo tee -a /etc/hosts >/dev/null 2>&1 || true

# Install mirror tool (content fetched by orchestrator via Drive connector)
base64 -d /tmp/mirror.b64 > /home/claude/t4h_mirror.py
chmod +x /home/claude/t4h_mirror.py

# Export canonical config
export T4H_DRIVE_FOLDER=1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs
export T4H_GH_REPO=TML-4PM/claude-outputs
# export GH_PAT=...   # optional — pull from cap_secrets when available

# Smoke
python3 /home/claude/t4h_mirror.py --help >/dev/null && echo "[mirror] wired in"
```

## Usage after wire-in

```bash
# Drive only (default folder, default title):
python3 /home/claude/t4h_mirror.py /path/to/artifact.pdf --dest drive-only

# Drive only with custom title / session path:
python3 /home/claude/t4h_mirror.py /path/to/artifact.pdf --dest drive-only \
  --path "2026-04-19_session-bootstrap/artifact.pdf"

# GitHub only (requires GH_PAT):
python3 /home/claude/t4h_mirror.py /path/to/artifact.pdf --dest github-only \
  --path "reports/artifact.pdf"

# Both:
python3 /home/claude/t4h_mirror.py /path/to/artifact.pdf --path "reports/artifact.pdf"
```

Output is always structured JSON so the orchestrator can parse and report back.

## Self-verification

After wire-in, the orchestrator should run the following smoke and confirm three passes:

```bash
echo "wire-in smoke $(date -u +%FT%TZ)" > /tmp/wiretest.txt
python3 /home/claude/t4h_mirror.py /tmp/wiretest.txt --dest drive-only
python3 /home/claude/t4h_mirror.py /tmp/wiretest.txt --dest github-only  # expect "skipped" if no PAT
python3 /home/claude/t4h_mirror.py /tmp/wiretest.txt                     # both modes
```

Expected: three JSON payloads, each with `sha256` matching the file, and `github` either `ok:true` (PAT set) or `skipped:true` (no PAT).

## Precedence

This document supersedes prior ad-hoc handling of `/mnt/user-data/outputs/`. The sandbox outputs directory remains available only for the Claude.ai `present_files` preview path — write to Drive first, copy to outputs second if preview is needed.

---

_Wire-in doc created 2026-04-19 — session bootstrap._
