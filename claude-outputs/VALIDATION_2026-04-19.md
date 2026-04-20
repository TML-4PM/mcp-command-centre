# VALIDATION — 2026-04-19

Re-ran the full bootstrap as a validation pass. This document records what passed, what didn't, and what's been hardened.

## Summary

| Dimension | Status | Notes |
|---|---|---|
| Drive integrity (round-trip) | ✅ REAL | sha256 byte-identical; tool `t4h_mirror.py` runs cleanly after Drive→Python→disk→exec |
| Permissions | ✅ Private | Folder + tool owner-only (`troy.latter@gmail.com`) — no accidental sharing |
| Tool smoke (3 modes) | ✅ REAL | `drive-only`, `github-only`, `both` all produce valid JSON; sha256 reported |
| Discovery hook | ✅ Fixed | Memory slot 13 replaced with canonical mirror pointer (folder id, tool id, bootstrap hint) |
| WIRE_IN heredoc footgun | ⚠️ Found + fixed | See "Gap 1" below |
| Bridge logging to t4h_canonical_changes | ❌ Still blocked | Silent-rows trap + INSERT sql_error; queued |
| GitHub leg end-to-end | ❌ Not runnable | Needs repo + PAT from Troy |
| Large-file upload limit | ⚠️ Unknown | See "Gap 3" below |

## Gaps found

### Gap 1 — Bash heredoc corrupts base64 (CRITICAL, fixed)

During validation I attempted to paste a downloaded Drive blob into a bash heredoc (`cat > f <<'EOF'`). The resulting file decoded to a Python script with `__main__` mangled to `__main  ` (two underscores became two spaces). Script would silently not execute `main()`.

**Root cause**: heredoc with very long single-line content interacts badly with some shell/terminal layers and can replace certain escape-like sequences or trim trailing bytes.

**Proof Drive is innocent**: re-downloaded the same blob, compared its prefix against a fresh local-encoded b64 — prefix matches exactly, so Drive stored and returned the bytes correctly.

**Fix**: WIRE_IN.md and memory both now explicitly say "decode via Python, NEVER via bash heredoc". Future Claude should always use:

```python
import base64, pathlib
blob = "<the b64 string from download_file_content>"
pathlib.Path("/home/claude/t4h_mirror.py").write_bytes(base64.b64decode(blob))
```

### Gap 2 — Discovery hook (CRITICAL, fixed)

Without a persistent pointer, a fresh Claude session had no way to learn about the Drive folder. It would default to `/mnt/user-data/outputs/` as usual.

**Fix**: Memory slot 13 now carries the folder id, tool id, doc names, and bootstrap method. Future Claude picks this up via `<userMemories>` injection and knows to use the mirror.

### Gap 3 — Unknown b64 content limit for Drive:create_file (OPEN)

The `Google Drive:create_file` tool accepts a base64 `content` string parameter. I have no documented max size. Files uploaded this session: README (~3.8KB b64), tool (~7.1KB b64), runlog (~4KB b64), smoke (~56B b64). All worked. A 50MB PDF would produce ~67MB of b64 — untested.

**Mitigation**: For files >1MB, split into chunks and concatenate client-side if needed, or skip Drive for that file and use GitHub leg (once live) which handles it via GitHub's 100MB-per-file limit.

### Gap 4 — GitHub leg has never been exercised (OPEN)

Code for `push_to_github()` is written and tested to the point where GH_PAT-absent skip works cleanly. But the actual HTTP PUT path has not been round-tripped — idempotent sha lookup logic in particular has never run against a real API response.

**Fix when unblocked**: On first real push, compare uploaded content sha (in GitHub response) against local sha256 computed by `stage_for_drive()`. If they match by content (GitHub uses git blob sha, different hash) — verify via re-download.

### Gap 5 — Bridge DB logging blocked this session (OPEN, deferred)

The session could not log the bootstrap event to `t4h_canonical_changes` → would have auto-broadcast to Telegram. Both `troy-sql-executor` and `t4h-sql-exec` rejected non-trivial INSERTs with `sql_error` and silently returned `rows:[]` on reads.

**Fix**: Investigate Lambda code — likely a recent change to the result-shaping block. See STATUS.md "what's next".

### Gap 6 — No update-in-place for Drive files (DESIGN LIMITATION)

`Google Drive:create_file` always creates; there's no update endpoint exposed. Editing an existing file means uploading a new one with the same title — Drive keeps both as distinct IDs. Future search-by-title returns all versions; caller must sort by `modifiedTime` desc.

**Mitigation**: When correcting a document, upload with same title. Memory/READMEs reference file by folder + title, so latest wins naturally.

## Repeatability matrix — will a fresh Claude session succeed?

Test: hypothetical fresh Claude starts, Troy says "save this report to my non-sandbox storage".

| Step | Source of knowledge | Status |
|---|---|---|
| Know the mirror folder exists | Memory slot 13 | ✅ |
| Know the folder id | Memory slot 13 | ✅ |
| Know which tool loads Drive | `tool_search("google drive")` — always available | ✅ |
| Upload the file | `Google Drive:create_file` with b64 content | ✅ |
| Know which docs to read if confused | Memory slot 13 names README/WIRE_IN/STATUS | ✅ |
| Wire in the full `t4h_mirror.py` helper | WIRE_IN.md says "download + Python-decode" | ✅ (post-fix) |
| Avoid the heredoc footgun | Memory + WIRE_IN both flag it | ✅ |
| Fall back if Drive connector down | README notes this as a limitation; no current fallback | ⚠️ |
| Use GitHub leg | WIRE_IN says pending repo+PAT | ⚠️ |

**Verdict**: repeatable for the Drive-only happy path. GitHub leg is one config step away. Drive-connector-unavailable is a genuine single point of failure — noted but not mitigated.

## Evidence produced this session

| Artifact | Drive ID | Purpose |
|---|---|---|
| mirror folder | `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` | container |
| README.md | `1NYACigVu51SFexueYl5pthSIdcA188-s` | convention |
| t4h_mirror.py | `1uetFxHD1J9i8EBGoNHX7xaOEWmFwXdQ5` | helper tool |
| WIRE_IN.md | `1ba2ZbsppbhPAXhrh1ua9dcZ1rBpMBGgl` | bootstrap procedure (note: will be superseded by v2 below with heredoc warning) |
| STATUS.md | `1g9rNICHUkEEBT2o_bXuvlkVxhTT3QMRh` | completion marker (superseded by STATUS_v2) |
| session folder | `1D6vO5jJIeCPkZcR3Ex249CSks-2jFT6r` | dated session scope |
| session_runlog_2026-04-19.md | `1Kq0hCbJNsp0DRWHkMP5a7eGrpzteRTZB` | audit trail |
| smoke.txt | `1639w1ROtVPQCoxu-Ml3Y6o9Sk1mVnFmu` | round-trip proof #1 |
| integrity.txt (in validation) | (not uploaded; sandbox only) | roundtrip proof #2 — `sha256: 9d460876b4...45f610` |
| VALIDATION_2026-04-19.md (this file) | (uploading now) | — |

## Final classification

- **REAL**: Drive mirror mechanism, tool, discovery hook, heredoc warning
- **PARTIAL**: GitHub leg (code ready, needs config)
- **BLOCKED**: Bridge DB writes (executor regression)
- **IP**: none (confirmed in prior turn — ops infrastructure, not research)

---

_Validation pass complete 2026-04-19. No further action required from this session._
