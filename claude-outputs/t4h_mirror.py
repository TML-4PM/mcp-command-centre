#!/usr/bin/env python3
"""
t4h_mirror.py — Non-sandbox file creation for Troy / T4H.

Purpose
-------
Stop writing artifacts to /mnt/user-data/outputs/ (sandbox, resets between tasks).
Instead write directly to:
  1. Google Drive  (primary, always-on, via Claude's Drive connector)
  2. GitHub        (secondary, versioned, needs GH_PAT in env)

Usage from a Claude bash session
--------------------------------
    export T4H_DRIVE_FOLDER=1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs   # Claude/sandbox-outputs-mirror
    export T4H_GH_REPO=TML-4PM/claude-outputs                    # create once, then reuse
    export GH_PAT=ghp_xxxxx                                      # classic or fine-grained w/ contents:write
    python3 t4h_mirror.py ./some_file.pdf
    python3 t4h_mirror.py ./some_file.pdf --dest drive-only
    python3 t4h_mirror.py ./some_file.pdf --dest github-only
    python3 t4h_mirror.py ./some_file.pdf --path reports/2026-04/some_file.pdf

Notes
-----
- Drive upload goes via the Claude Drive connector, not this script directly.
  This script is a shim — call it to stage content, then the orchestrator
  (Claude) invokes Google Drive:create_file with the staged base64.
- GitHub push uses the contents API (PUT /repos/{owner}/{repo}/contents/{path}),
  idempotent via sha lookup. Safe to re-run.
- Nothing here writes to /mnt/user-data/outputs/.
"""
from __future__ import annotations
import argparse, base64, hashlib, json, mimetypes, os, sys
from pathlib import Path
from urllib import request, parse, error

DRIVE_FOLDER = os.environ.get("T4H_DRIVE_FOLDER", "1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs")
GH_REPO      = os.environ.get("T4H_GH_REPO",      "TML-4PM/claude-outputs")
GH_BRANCH    = os.environ.get("T4H_GH_BRANCH",    "main")
GH_PAT       = os.environ.get("GH_PAT", "")


def stage_for_drive(fp: Path, rel: str | None = None) -> dict:
    """Produce the payload for Claude's Google Drive:create_file tool."""
    data = fp.read_bytes()
    mime, _ = mimetypes.guess_type(fp.name)
    return {
        "title": rel or fp.name,
        "mimeType": mime or "application/octet-stream",
        "parentId": DRIVE_FOLDER,
        "content_b64": base64.b64encode(data).decode("ascii"),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def push_to_github(fp: Path, path_in_repo: str) -> dict:
    """Idempotent PUT to GitHub contents API. Returns {ok, url, sha, action}."""
    if not GH_PAT:
        return {"ok": False, "error": "GH_PAT not set", "skipped": True}

    owner_repo = GH_REPO
    api = f"https://api.github.com/repos/{owner_repo}/contents/{parse.quote(path_in_repo)}"
    hdr = {
        "Authorization": f"Bearer {GH_PAT}",
        "Accept":        "application/vnd.github+json",
        "User-Agent":    "t4h-mirror/1.0",
    }
    # Lookup existing sha for idempotent overwrite
    sha = None
    try:
        req = request.Request(f"{api}?ref={GH_BRANCH}", headers=hdr, method="GET")
        with request.urlopen(req, timeout=15) as r:
            existing = json.loads(r.read())
            sha = existing.get("sha")
    except error.HTTPError as e:
        if e.code != 404:
            return {"ok": False, "error": f"lookup {e.code}: {e.read().decode()[:200]}"}
    except Exception as e:
        return {"ok": False, "error": f"lookup {type(e).__name__}: {e}"}

    data = fp.read_bytes()
    body = {
        "message": f"mirror: {path_in_repo} ({len(data)} bytes)",
        "content": base64.b64encode(data).decode("ascii"),
        "branch":  GH_BRANCH,
    }
    if sha:
        body["sha"] = sha

    req = request.Request(api, data=json.dumps(body).encode(), headers={**hdr, "Content-Type": "application/json"}, method="PUT")
    try:
        with request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
            return {
                "ok":     True,
                "url":    resp.get("content", {}).get("html_url"),
                "sha":    resp.get("content", {}).get("sha"),
                "action": "updated" if sha else "created",
            }
    except error.HTTPError as e:
        return {"ok": False, "error": f"put {e.code}: {e.read().decode()[:200]}"}
    except Exception as e:
        return {"ok": False, "error": f"put {type(e).__name__}: {e}"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=Path)
    ap.add_argument("--path", default=None, help="path inside repo / title in drive")
    ap.add_argument("--dest", choices=["both", "drive-only", "github-only"], default="both")
    args = ap.parse_args()

    if not args.file.exists():
        print(f"ERROR: {args.file} not found", file=sys.stderr)
        sys.exit(2)

    rel = args.path or args.file.name
    report = {"file": str(args.file), "rel": rel, "bytes": args.file.stat().st_size}

    if args.dest in ("both", "drive-only"):
        report["drive_staged"] = stage_for_drive(args.file, rel)
        # print truncated — orchestrator reads structured output
        report["drive_staged"].pop("content_b64", None)
        report["drive_note"]   = "content_b64 suppressed from stdout; orchestrator calls Google Drive:create_file"

    if args.dest in ("both", "github-only"):
        report["github"] = push_to_github(args.file, rel)

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
