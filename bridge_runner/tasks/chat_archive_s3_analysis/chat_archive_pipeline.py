#!/usr/bin/env python3
"""
chat_archive_pipeline.py
Drive → S3 → split → analysis → Supabase index
Runs once or loops forever (--loop). Idempotent. Hash-gated.

Required env:
  CHAT_ARCHIVE_S3_BUCKET
  GOOGLE_APPLICATION_CREDENTIALS

Optional env:
  CHAT_ARCHIVE_S3_PREFIX         (default: llm-chat-archives)
  CHAT_ARCHIVE_ANALYSIS_PREFIX   (default: analysis)
  GOOGLE_DRIVE_FILE_ID           (default: 1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs)
  AWS_REGION                     (default: ap-southeast-2)
  CHAT_ARCHIVE_INTERVAL_SECONDS  (default: 1800)
  SUPABASE_URL                   (optional: write index to Supabase)
  SUPABASE_SERVICE_KEY           (optional: required if SUPABASE_URL set)
  SUPABASE_ARCHIVE_TABLE         (default: chat_archive_index)
  FORCE_REANALYSIS               (set to 1 to skip hash gate)
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import os
import re
import sys
import time
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional, Tuple

import boto3

try:
    from googleapiclient.discovery import build as gdrive_build
    from googleapiclient.http import MediaIoBaseDownload
    from google.oauth2 import service_account as gsa
    GDRIVE_OK = True
except ImportError:
    GDRIVE_OK = False

try:
    import requests as _requests
    REQUESTS_OK = True
except ImportError:
    REQUESTS_OK = False

LOGGER = logging.getLogger("chat_archive_pipeline")

# ---------------------------------------------------------------------------
# T4H domain keywords for intent clustering
# ---------------------------------------------------------------------------
INTENT_CLUSTERS: Dict[str, List[str]] = {
    "infrastructure": ["lambda", "supabase", "s3", "aws", "vercel", "cloudformation", "sam", "rds", "vpc", "iam", "bridge", "api gateway"],
    "finance": ["bas", "gst", "ato", "rdti", "div7a", "basiq", "invoice", "revenue", "tax", "fbt", "psi", "super", "payroll"],
    "product": ["snaps", "synal", "workfamilyai", "holoorg", "valdocco", "outcomready", "apexpredator", "girlmath", "consentx"],
    "agent": ["orchestrator", "agent", "autonomous", "fleet", "runner", "executor", "pipeline", "workflow"],
    "data": ["schema", "table", "view", "migration", "rpc", "query", "supabase", "postgres", "index"],
    "compliance": ["rdti", "board", "director", "evidence", "audit", "r&d", "ausindustry", "ato", "asic"],
    "build": ["deploy", "push", "commit", "github", "release", "manifest", "docker", "container"],
    "open_loop": ["todo", "follow up", "next step", "incomplete", "not finished", "wire", "fix", "needed"],
}

OPEN_LOOP_PATTERNS = [
    (r"\bTODO\b", 3),
    (r"\bnot\s+done\b", 2),
    (r"\bfollow\s+up\b", 2),
    (r"\bnext\s+step\b", 2),
    (r"\bnot\s+finished\b", 2),
    (r"\bincomplete\b", 2),
    (r"\bstill\s+need\b", 2),
    (r"\bwire\s+up\b", 2),
    (r"\bfix\s+this\b", 2),
    (r"\bneeds?\s+to\b", 1),
    (r"\bcontinue\b", 1),
    (r"\bblocked\b", 1),
    (r"\bpending\b", 1),
    (r"\bunfinished\b", 2),
    (r"\bopen\s+loop\b", 3),
    (r"\bnot\s+wired\b", 3),
    (r"\bnot\s+live\b", 2),
    (r"\bPARTIAL\b", 2),
    (r"\bPRETEND\b", 3),
]

STOP_WORDS = {
    "the", "and", "for", "that", "this", "with", "you", "your", "have", "from",
    "are", "was", "but", "not", "all", "our", "can", "use", "need", "into",
    "then", "they", "them", "just", "like", "what", "when", "where", "how",
    "why", "too", "out", "get", "got", "run", "now", "yes", "its", "it's",
    "also", "some", "will", "would", "could", "should", "been", "being",
    "here", "there", "their", "these", "those", "make", "made",
}


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)sZ %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


def sha256_file(path: Path, block: int = 8 * 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(block)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def load_state(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(path: Path, state: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------------------
# Google Drive
# ---------------------------------------------------------------------------

def build_drive_service() -> Any:
    if not GDRIVE_OK:
        raise RuntimeError("google-api-python-client not installed")
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path:
        raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS required")
    scopes = ["https://www.googleapis.com/auth/drive.readonly"]
    creds = gsa.Credentials.from_service_account_file(creds_path, scopes=scopes)
    return gdrive_build("drive", "v3", credentials=creds, cache_discovery=False)


def fetch_drive_metadata(service: Any, file_id: str) -> Dict[str, Any]:
    return (
        service.files()
        .get(fileId=file_id, fields="id,name,mimeType,size,modifiedTime,md5Checksum")
        .execute()
    )


def download_drive_file(service: Any, file_id: str, target: Path) -> None:
    req = service.files().get_media(fileId=file_id)
    with target.open("wb") as fh:
        dl = MediaIoBaseDownload(fh, req, chunksize=16 * 1024 * 1024)
        done = False
        while not done:
            status, done = dl.next_chunk()
            if status:
                LOGGER.info("Drive download %.1f%%", status.progress() * 100)


# ---------------------------------------------------------------------------
# S3
# ---------------------------------------------------------------------------

def s3_upload(s3: Any, bucket: str, key: str, path: Path, meta: Optional[Dict[str, str]] = None) -> str:
    extra: Dict[str, Any] = {}
    if meta:
        extra["Metadata"] = meta
    s3.upload_file(str(path), bucket, key, ExtraArgs=extra)
    uri = f"s3://{bucket}/{key}"
    LOGGER.info("Uploaded %s", uri)
    return uri


def upload_directory(s3: Any, bucket: str, prefix: str, local_dir: Path) -> List[str]:
    uris = []
    for p in sorted(local_dir.iterdir()):
        if p.is_file():
            key = f"{prefix}/{p.name}"
            uris.append(s3_upload(s3, bucket, key, p))
    return uris


# ---------------------------------------------------------------------------
# File handling
# ---------------------------------------------------------------------------

def split_binary(source: Path, out_dir: Path, chunk_mb: int = 50) -> List[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.bin"):
        old.unlink()
    chunk = chunk_mb * 1024 * 1024
    parts: List[Path] = []
    with source.open("rb") as f:
        idx = 0
        while True:
            data = f.read(chunk)
            if not data:
                break
            p = out_dir / f"{source.stem}.part_{idx:05d}.bin"
            p.write_bytes(data)
            parts.append(p)
            idx += 1
    return parts


def detect_json(raw: Path, extracted: Path) -> Path:
    if raw.suffix.lower() == ".json":
        return raw
    if zipfile.is_zipfile(raw):
        with zipfile.ZipFile(raw) as zf:
            zf.extractall(extracted)
        candidates = sorted(extracted.rglob("*.json"), key=lambda p: p.stat().st_size, reverse=True)
        if not candidates:
            raise RuntimeError("No JSON in zip")
        return candidates[0]
    raise RuntimeError(f"Unsupported: {raw.name}")


# ---------------------------------------------------------------------------
# Streaming JSON parser — robust chunked buffer
# ---------------------------------------------------------------------------

def stream_json_array(path: Path, read_size: int = 2 * 1024 * 1024) -> Iterator[Dict[str, Any]]:
    """Stream top-level JSON array without loading full file into memory."""
    dec = json.JSONDecoder()
    buf = ""
    in_array = False

    with path.open("r", encoding="utf-8", errors="replace") as f:
        while True:
            raw = f.read(read_size)
            if not raw:
                break
            buf += raw

            # Cap buffer to prevent unbounded growth on malformed large objects
            if len(buf) > 200 * 1024 * 1024:
                LOGGER.warning("Buffer exceeded 200MB — skipping malformed region")
                buf = buf[-1 * 1024 * 1024:]
                in_array = True

            if not in_array:
                stripped = buf.lstrip()
                if not stripped:
                    continue
                if stripped[0] != "[":
                    raise RuntimeError("Expected top-level JSON array")
                buf = stripped[1:]
                in_array = True

            while buf:
                buf = buf.lstrip()
                if not buf:
                    break
                if buf[0] == ",":
                    buf = buf[1:]
                    continue
                if buf[0] == "]":
                    return
                try:
                    obj, idx = dec.raw_decode(buf)
                    if isinstance(obj, dict):
                        yield obj
                    buf = buf[idx:]
                except json.JSONDecodeError:
                    break  # need more data


def safe_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    return json.dumps(v, ensure_ascii=False)


def collect_messages(conv: Dict[str, Any]) -> List[str]:
    texts: List[str] = []
    mapping = conv.get("mapping")
    if not isinstance(mapping, dict):
        return texts
    for node in mapping.values():
        if not isinstance(node, dict):
            continue
        msg = node.get("message")
        if not isinstance(msg, dict):
            continue
        author_role = msg.get("author", {}).get("role", "")
        content = msg.get("content", {})
        if not isinstance(content, dict):
            continue
        parts = content.get("parts", [])
        if isinstance(parts, list):
            for part in parts:
                if isinstance(part, str) and part.strip():
                    texts.append(f"[{author_role}] {part.strip()}")
    return texts


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_open_loops(text: str) -> int:
    score = 0
    for pattern, weight in OPEN_LOOP_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            score += weight
    return score


def score_recency(update_time_str: str) -> float:
    """Return 0-1 recency score. 1 = today, 0 = very old."""
    try:
        ts = float(update_time_str)
        now = datetime.now(timezone.utc).timestamp()
        age_days = (now - ts) / 86400.0
        # half-life ~90 days
        return max(0.0, min(1.0, 1.0 / (1.0 + age_days / 90.0)))
    except (ValueError, TypeError):
        return 0.0


def classify_intents(text: str) -> List[str]:
    lowered = text.lower()
    matched = []
    for intent, keywords in INTENT_CLUSTERS.items():
        if any(kw in lowered for kw in keywords):
            matched.append(intent)
    return matched or ["general"]


def top_keywords(texts: Iterable[str], limit: int = 50) -> List[Tuple[str, int]]:
    counter: Counter[str] = Counter()
    for text in texts:
        for token in re.findall(r"[A-Za-z][A-Za-z0-9_\-]{2,}", text.lower()):
            if token not in STOP_WORDS:
                counter[token] += 1
    return counter.most_common(limit)


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract T4H-relevant entities from text."""
    entities: Dict[str, List[str]] = {
        "lambdas": list(set(re.findall(r"troy-[a-z][a-z0-9\-]{2,}", text))),
        "urls": list(set(re.findall(r"https?://[^\s\)\"']{10,80}", text)))[:20],
        "s3_uris": list(set(re.findall(r"s3://[^\s\)\"']{5,80}", text)))[:10],
        "arns": list(set(re.findall(r"arn:aws:[^\s\"']{10,80}", text)))[:10],
    }
    return entities


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

def analyze(json_path: Path, analysis_dir: Path) -> Dict[str, Any]:
    analysis_dir.mkdir(parents=True, exist_ok=True)

    inv_path = analysis_dir / "inventory.json"
    csv_path = analysis_dir / "conversation_summary.csv"
    loops_path = analysis_dir / "top_open_loops.json"
    md_path = analysis_dir / "INITIAL_ANALYSIS.md"
    kw_path = analysis_dir / "top_keywords.json"
    intents_path = analysis_dir / "intent_clusters.json"
    entities_path = analysis_dir / "top_entities.json"

    total = 0
    total_msg = 0
    total_chars = 0
    top_volume: List[Dict[str, Any]] = []
    open_loops: List[Dict[str, Any]] = []
    all_texts: List[str] = []
    intent_counts: Counter[str] = Counter()
    all_entities: Dict[str, Counter] = {
        "lambdas": Counter(),
        "urls": Counter(),
        "s3_uris": Counter(),
    }

    fields = [
        "conversation_id", "title", "create_time", "update_time",
        "message_count", "char_count", "open_loop_score", "recency_score",
        "intents", "priority_score",
    ]

    with csv_path.open("w", newline="", encoding="utf-8") as csvf:
        writer = csv.DictWriter(csvf, fieldnames=fields)
        writer.writeheader()

        for conv in stream_json_array(json_path):
            total += 1
            if total % 500 == 0:
                LOGGER.info("Processed %d conversations…", total)

            conv_id = safe_str(conv.get("id"))
            title = safe_str(conv.get("title"))
            create_time = safe_str(conv.get("create_time"))
            update_time = safe_str(conv.get("update_time"))

            msgs = collect_messages(conv)
            joined = "\n".join(msgs)
            msg_count = len(msgs)
            char_count = len(joined)
            loop_score = score_open_loops(joined)
            recency = score_recency(update_time)
            intents = classify_intents(joined)

            # Priority = weighted combo
            priority = round(
                loop_score * 0.5 + recency * 20 + min(char_count / 10000, 10),
                2,
            )

            total_msg += msg_count
            total_chars += char_count
            all_texts.append(joined)
            for intent in intents:
                intent_counts[intent] += 1

            ents = extract_entities(joined)
            for k in ["lambdas", "urls", "s3_uris"]:
                for v in ents.get(k, []):
                    all_entities[k][v] += 1  # type: ignore

            row = {
                "conversation_id": conv_id,
                "title": title,
                "create_time": create_time,
                "update_time": update_time,
                "message_count": msg_count,
                "char_count": char_count,
                "open_loop_score": loop_score,
                "recency_score": round(recency, 3),
                "intents": "|".join(intents),
                "priority_score": priority,
            }
            writer.writerow(row)

            top_volume.append(dict(row))
            top_volume = sorted(top_volume, key=lambda x: x["char_count"], reverse=True)[:200]

            if loop_score > 0:
                open_loops.append({
                    **row,
                    "sample": joined[:3000],
                })

    # Sort open loops by priority
    open_loops = sorted(open_loops, key=lambda x: (x["priority_score"], x["open_loop_score"]), reverse=True)
    kw_list = top_keywords(all_texts)

    inventory = {
        "generated_at": utc_now_iso(),
        "source_file": str(json_path),
        "conversation_count": total,
        "message_count": total_msg,
        "char_count": total_chars,
        "open_loop_count": len(open_loops),
        "avg_messages_per_conv": round(total_msg / total, 2) if total else 0,
        "avg_chars_per_conv": round(total_chars / total, 2) if total else 0,
        "top_intents": intent_counts.most_common(10),
    }

    inv_path.write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding="utf-8")
    loops_path.write_text(json.dumps(open_loops[:500], indent=2, ensure_ascii=False), encoding="utf-8")
    kw_path.write_text(json.dumps(kw_list, indent=2, ensure_ascii=False), encoding="utf-8")
    intents_path.write_text(json.dumps(dict(intent_counts.most_common()), indent=2), encoding="utf-8")

    top_ents = {k: v.most_common(20) for k, v in all_entities.items()}
    entities_path.write_text(json.dumps(top_ents, indent=2), encoding="utf-8")

    # Markdown report
    lines = [
        "# Chat Archive — Initial Analysis",
        "",
        f"Generated: {inventory['generated_at']}",
        f"Source: `{json_path.name}`",
        "",
        "## Summary",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Conversations | {total} |",
        f"| Messages | {total_msg} |",
        f"| Characters | {total_chars:,} |",
        f"| Open loops | {len(open_loops)} |",
        f"| Avg messages/conv | {inventory['avg_messages_per_conv']} |",
        "",
        "## Intent Distribution",
        "",
    ]
    for intent, count in intent_counts.most_common():
        lines.append(f"- **{intent}**: {count}")

    lines += ["", "## Priority Open Loops (top 20)", ""]
    for item in open_loops[:20]:
        lines.append(
            f"- `{item['title'] or item['conversation_id'][:12]}` "
            f"| loop={item['open_loop_score']} | priority={item['priority_score']} "
            f"| intents={item['intents']}"
        )

    lines += ["", "## Highest Volume Conversations (top 20)", ""]
    for item in top_volume[:20]:
        lines.append(
            f"- `{item['title'] or '[untitled]'}` "
            f"| chars={item['char_count']:,} | msgs={item['message_count']} "
            f"| recency={item['recency_score']}"
        )

    lines += ["", "## Top Keywords", ""]
    for word, count in kw_list[:40]:
        lines.append(f"- {word}: {count}")

    lines += ["", "## Top Lambda References", ""]
    for name, count in all_entities["lambdas"].most_common(20):
        lines.append(f"- `{name}`: {count}")

    md_path.write_text("\n".join(lines), encoding="utf-8")

    return {
        "inventory_path": str(inv_path),
        "csv_path": str(csv_path),
        "open_loops_path": str(loops_path),
        "md_path": str(md_path),
        "keywords_path": str(kw_path),
        "intents_path": str(intents_path),
        "entities_path": str(entities_path),
        "inventory": inventory,
    }


# ---------------------------------------------------------------------------
# Supabase writer (optional)
# ---------------------------------------------------------------------------

def write_to_supabase(
    url: str,
    key: str,
    table: str,
    inventory: Dict[str, Any],
    open_loops: List[Dict[str, Any]],
) -> bool:
    if not REQUESTS_OK:
        LOGGER.warning("requests not installed — skipping Supabase write")
        return False
    import requests

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    payload = {
        "run_id": inventory["generated_at"],
        "source_file": inventory["source_file"],
        "conversation_count": inventory["conversation_count"],
        "message_count": inventory["message_count"],
        "open_loop_count": inventory["open_loop_count"],
        "top_open_loops": open_loops[:50],
        "top_intents": inventory.get("top_intents", []),
        "created_at": inventory["generated_at"],
    }

    try:
        r = requests.post(f"{url}/rest/v1/{table}", headers=headers, json=payload, timeout=30)
        if r.status_code in (200, 201):
            LOGGER.info("Supabase write OK → %s", table)
            return True
        LOGGER.warning("Supabase write failed %s: %s", r.status_code, r.text[:200])
        return False
    except Exception as exc:
        LOGGER.warning("Supabase write error: %s", exc)
        return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--bucket", required=True)
    p.add_argument("--prefix", default=os.getenv("CHAT_ARCHIVE_S3_PREFIX", "llm-chat-archives"))
    p.add_argument("--analysis-prefix", default=os.getenv("CHAT_ARCHIVE_ANALYSIS_PREFIX", "analysis"))
    p.add_argument("--state-dir", required=True)
    p.add_argument("--log-json", default=None)
    p.add_argument("--drive-file-id", default=os.getenv("GOOGLE_DRIVE_FILE_ID", "1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs"))
    p.add_argument("--chunk-size-mb", type=int, default=50)
    p.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL", ""))
    p.add_argument("--supabase-key", default=os.getenv("SUPABASE_SERVICE_KEY", ""))
    p.add_argument("--supabase-table", default=os.getenv("SUPABASE_ARCHIVE_TABLE", "chat_archive_index"))
    p.add_argument("--force", action="store_true", default=os.getenv("FORCE_REANALYSIS", "0") == "1")
    return p.parse_args()


def main() -> int:
    setup_logging()
    args = parse_args()

    state_dir = Path(args.state_dir)
    workspace = state_dir.parent / "workspace"
    raw_dir = workspace / "raw"
    extracted_dir = workspace / "extracted"
    split_dir = workspace / "split"
    analysis_dir = workspace / "analysis"

    for d in [state_dir, raw_dir, extracted_dir, split_dir, analysis_dir]:
        d.mkdir(parents=True, exist_ok=True)

    state_file = state_dir / "pipeline_state.json"
    state = load_state(state_file)

    s3 = boto3.client("s3", region_name=os.getenv("AWS_REGION", "ap-southeast-2"))
    service = build_drive_service()

    LOGGER.info("Fetching Drive metadata for %s", args.drive_file_id)
    meta = fetch_drive_metadata(service, args.drive_file_id)
    raw_name = meta.get("name") or f"{args.drive_file_id}.json"
    raw_path = raw_dir / raw_name

    LOGGER.info("Downloading %s", raw_name)
    download_drive_file(service, args.drive_file_id, raw_path)

    raw_sha = sha256_file(raw_path)
    changed = raw_sha != state.get("raw_sha256")
    LOGGER.info("sha256=%s changed=%s force=%s", raw_sha, changed, args.force)

    if not changed and not args.force:
        LOGGER.info("Source unchanged — skipping full analysis (use --force to override)")
        out = {
            "status": "skipped_no_change",
            "generated_at": utc_now_iso(),
            "raw_sha256": raw_sha,
        }
        if args.log_json:
            Path(args.log_json).parent.mkdir(parents=True, exist_ok=True)
            Path(args.log_json).write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(json.dumps(out, indent=2))
        return 0

    raw_key = f"{args.prefix}/raw/{raw_name}"
    raw_uri = s3_upload(s3, args.bucket, raw_key, raw_path, {
        "source": "google_drive",
        "drive_file_id": args.drive_file_id,
        "sha256": raw_sha,
    })

    main_json = detect_json(raw_path, extracted_dir)

    parts = split_binary(main_json, split_dir / main_json.stem, args.chunk_size_mb)
    split_uris = []
    for part in parts:
        key = f"{args.prefix}/split/{main_json.stem}/{part.name}"
        split_uris.append(s3_upload(s3, args.bucket, key, part))

    LOGGER.info("Running analysis on %s", main_json)
    result = analyze(main_json, analysis_dir)

    analysis_uris = []
    for fname in [
        "inventory.json", "conversation_summary.csv", "top_open_loops.json",
        "INITIAL_ANALYSIS.md", "top_keywords.json", "intent_clusters.json", "top_entities.json",
    ]:
        fp = analysis_dir / fname
        if fp.exists():
            key = f"{args.prefix}/{args.analysis_prefix}/{fname}"
            analysis_uris.append(s3_upload(s3, args.bucket, key, fp))

    # Optional Supabase write
    sb_ok = False
    if args.supabase_url and args.supabase_key:
        loops_data = json.loads(Path(result["open_loops_path"]).read_text(encoding="utf-8"))
        sb_ok = write_to_supabase(
            args.supabase_url, args.supabase_key,
            args.supabase_table, result["inventory"], loops_data,
        )

    state.update({
        "last_run_utc": utc_now_iso(),
        "drive_file_id": args.drive_file_id,
        "drive_name": raw_name,
        "drive_modified_time": meta.get("modifiedTime"),
        "raw_sha256": raw_sha,
        "raw_s3_uri": raw_uri,
        "split_count": len(parts),
        "analysis_uris": analysis_uris,
        "changed": changed,
        "supabase_write": sb_ok,
    })
    save_state(state_file, state)

    payload = {
        "status": "ok",
        "generated_at": utc_now_iso(),
        "drive_file_id": args.drive_file_id,
        "drive_name": raw_name,
        "raw_sha256": raw_sha,
        "changed": changed,
        "raw_s3_uri": raw_uri,
        "split_count": len(parts),
        "analysis_uris": analysis_uris,
        "supabase_write": sb_ok,
        "inventory": result["inventory"],
    }

    if args.log_json:
        Path(args.log_json).parent.mkdir(parents=True, exist_ok=True)
        Path(args.log_json).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
