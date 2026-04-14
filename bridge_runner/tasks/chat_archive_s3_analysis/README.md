# chat_archive_s3_analysis

Bridge Runner task: pulls LLM chat archive from Google Drive, uploads to S3, splits, analyses, optionally indexes to Supabase.

## Architecture

```
Google Drive (file_id: 1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs)
  → stream download
  → S3 raw/
  → binary split → S3 split/
  → streaming analysis
  → S3 analysis/
  → Supabase chat_archive_index (optional)
```

## Outputs

| File | Description |
|------|-------------|
| `INITIAL_ANALYSIS.md` | Human-readable summary |
| `conversation_summary.csv` | All conversations with scores |
| `top_open_loops.json` | Unfinished thread candidates (priority-sorted) |
| `inventory.json` | Run metadata |
| `top_keywords.json` | Frequency map |
| `intent_clusters.json` | Conversation counts by intent group |
| `top_entities.json` | Lambda names, URLs, S3 URIs extracted |

## Priority Score

`priority = loop_score × 0.5 + recency × 20 + min(char_count/10000, 10)`

Higher = act on this first.

## Run

```bash
# one-shot
./run_chat_archive_pipeline.sh

# continuous (every 30 min)
./run_chat_archive_pipeline.sh --loop

# force re-analysis even if source unchanged
FORCE_REANALYSIS=1 ./run_chat_archive_pipeline.sh
```

## Required env

```bash
export CHAT_ARCHIVE_S3_BUCKET=your-bucket
export GOOGLE_APPLICATION_CREDENTIALS=/opt/bridge/secrets/google-sa.json
```

## Optional env

```bash
export CHAT_ARCHIVE_S3_PREFIX=llm-chat-archives
export GOOGLE_DRIVE_FILE_ID=1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs
export AWS_REGION=ap-southeast-2
export CHAT_ARCHIVE_INTERVAL_SECONDS=1800
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_KEY=...
export SUPABASE_ARCHIVE_TABLE=chat_archive_index
export FORCE_REANALYSIS=0
```

## Install

```bash
pip install -r requirements.txt
```
