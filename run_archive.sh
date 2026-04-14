#!/usr/bin/env bash
# run_archive.sh — fully-populated runner for chat_archive_pipeline
# Clone repo then: bash run_archive.sh [--loop]
set -euo pipefail

TASK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/bridge_runner/tasks/chat_archive_s3_analysis"

# ── 1. Write Google SA JSON (base64-encoded for safety) ────────────────────
python3 -c "import base64,sys; open('/tmp/google-sa-t4h.json','wb').write(base64.b64decode(sys.argv[1]))" \
  "eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsICJwcm9qZWN0X2lkIjogIm1jcC1icmlkZ2UtNDc4MDAyIiwgInByaXZhdGVfa2V5X2lkIjogIjg0MzI0NzY1NGRkYmE3NGY5Mjk4NTQ5MDJhOWYzYWJjMmM4NzE5NmQiLCAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdkFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLWXdnZ1NpQWdFQUFvSUJBUUNqTUtnRGVsaEQzY0VWXG5DOGE4emluTWkrMTBOU2JKVDU2NGlXZ2ZDY1BsVmlhK3BLVjFEaFErQVYzQSswNkVUSmcvUmpZQTAyQ09jM3dNXG5lNExWV2xtb1kzTFY3U3kyaDZMb2NpZWVldjFqVHNmNnpINlJDYkFUdSs4bDU5RUVGV29sUEhKbDJsUEdTUGhVXG5xcGRxVWV0NnFqTVU0cUpZcWgrdmRFWHI0YWlNUmdvRGhtK1VHa3NaeHA3MjlITldmTXN2UEdxTm9oWDdqRkdtXG52V3A3RFd0Y1dKTUgxVS8yeXZWVURxNndJWCtZdXN4MVVPRUtpQ2VucHJNOFpGK25EN2YvcW9Sd0xXQU16M0hYXG5YVmR0MmM0bUNBRUY4QVpRY1lVY3czeGRWSU5yVFJxZjNFaFJBOU1laU1nRnd6NFVJTW1XMjJDL3lFay90WUdzXG40blRacDJwWEFnTUJBQUVDZ2dFQU42cUx6Vy9vOXZHSWdSamN5Si9jMDBqeURYOXFCU2F6UWtpZzYyR0Y0TSt6XG45TGt1TlpGQloydEk0MkQyUmh2b25VRGlnQUthdjh6MkJqNEZnYWpKeDY1d3lEZVkxb1RMRmRhRzNFRWcrVVN3XG40OFRvOGFtbjFmdDRGdXFPT29IaGpPVWpNc280WkgyVXRERGk2S0ljSE9JOC9ZVlhrcjRwZzh5Nll6MjlKR2ZlXG5VZFcrSU5kQVdlaTh4YjBhMXNtMzdON3hPenRreU0vMFdCeXMvOWNFZ3pDV1BYQnErekoxd2YxUGc3SVdVV1VjXG5UVzAzVGtFY0Y2dit6ck0vUWtRazkrNURMRmV0M0JzWlpJRnh3Q1g1OEpyQllMTjhnclFYblZyb0VYSDdUM3JIXG5lakw0cW94UGhvNHNJZ3RaWXNJRXFDUElJUFpFL3JaRXdPVWxjRGNOR1FLQmdRRFRXTDdxNTNUZm5taklRajVYXG5XbzBBcGxFVkNkbGd2U1BtaVNuVDF4OXBnSlhqRHpJOXVDWmpGQUhRVkRxR3dNdHRwajZlRC9BSTJUYkxxT1AzXG5ERGNJcXg2OHVyZWF1VE5WcGNzVklCTUxNMDNMWUVnYWRKbmFxVG1NQnIweVRWeTZKREplLzUrYStFMWlsbzJ5XG5qQXRpNE04OHFJbEFVSklBVmVHd1E1NlNHUUtCZ1FERnF6c2hsMFNYVEcwMFRENE1DNHpHWFpQWnVzL1pBbmFVXG4rQ2REYmR5elJYamo0VGtVS1ZhZDc5VStackdtR0xGdGltTFhpQThmektmTEFqVGtzbXVLSnhaYzROVm5lVnFVXG5lS3lvTnJwZ095cU1Gbit5TmV4UEZQTmZQQXBtVTBMU044T0JzMC9lbHhDNStLZGlLQjlrdW0yaWEwS1ArVnNoXG5ZeXBhOUhmTjd3S0JnRHRKR2NVclNFMnlVaEpiQXNIZVZNOXAyRFRlbm12VW9zMTRqSk13TlUrVEVuaXZPcGkxXG5uNDhMZmJiQzZlZ0REUTJsSk11U0RQTnVlMENHRCt5dE1JTHQvYUZUZjAyWHhoNndjMWRwdCszY1ptWTJqQU5mXG4wZ2pVajZBSUErcW9hT3FPWE5McFFneG11czU5RFNLWXhsam1WenZjeXlPUGRtVkJzaDJQMmx1QkFvR0FScjJXXG45ZGlLNVpLbWFsYjJ4WnpFanFFaXJvTWFxMUVrV3YvTUhXZU4ybUo4ZHlFOUtpZjVKYUNWTWpYU1VkejRjbmxhXG5Fa1JSRlZKS29tNXh1MzdXMmFSUGJvSFFIYTNpYXN3ZERqNDN5UVNqbjJyVjNGTkw5S2xNeDhKVy9uUEJzRFhnXG5zK1FXSzFUbzJZVlJjZUZtQ3NobFFBRWUyeU9rSjNpenljVS9zdVVDZ1lCNHlzb3VhQVFvQ2xsdzI1Z3ozbUE0XG42RW10OEVPdDZETWM4bDdGMFZZaUhzZGtPYnN2TEVKVW5kUkpQR0doQm5xVFc5TzJGQUN3RWJEc3VOd3lzMzRHXG45QWZGb251dld2VEJPdHloa1kxVWhVZ2czOHgyWXZQTjd6aTdUWi9IMWNhVXR2MFZFVUJmYWJZZUkxbzRkVVRQXG5rUlFvTUpxRWxld1BpY0NWNFd6bGFRPT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsICJjbGllbnRfZW1haWwiOiAiZ2RyaXZlLWNyYXdsZXJAbWNwLWJyaWRnZS00NzgwMDIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAiY2xpZW50X2lkIjogIjExNzEzNjE3NDg5ODgzOTg3MDc3NiIsICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2dkcml2ZS1jcmF3bGVyJTQwbWNwLWJyaWRnZS00NzgwMDIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIn0="
chmod 600 /tmp/google-sa-t4h.json
echo "[setup] Google SA → /tmp/google-sa-t4h.json"

# ── 2. Env ──────────────────────────────────────────────────────────────────
export CHAT_ARCHIVE_S3_BUCKET=troylatter-sydney-downloads
export CHAT_ARCHIVE_S3_PREFIX=llm-chat-archives
export CHAT_ARCHIVE_ANALYSIS_PREFIX=analysis
export GOOGLE_DRIVE_FILE_ID=1V76A56knqISMEzU9GgqcRrNOxwbAi-Fs
export AWS_REGION=ap-southeast-2
export CHAT_ARCHIVE_INTERVAL_SECONDS=1800
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/google-sa-t4h.json
export SUPABASE_URL=https://lzfgigiyqpuuxslsygjp.supabase.co
export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q
export SUPABASE_ARCHIVE_TABLE=chat_archive_index
export FORCE_REANALYSIS=${FORCE_REANALYSIS:-0}

# ── 3. Deps ─────────────────────────────────────────────────────────────────
if ! python3 -c "import boto3,googleapiclient,requests" 2>/dev/null; then
  echo "[setup] Installing deps…"
  pip3 install -q boto3 google-api-python-client google-auth google-auth-httplib2 requests
fi

# ── 4. Run ──────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--loop" ]]; then
  echo "[runner] Loop mode — interval ${CHAT_ARCHIVE_INTERVAL_SECONDS}s"
  exec "$TASK_DIR/run_chat_archive_pipeline.sh" --loop
else
  exec "$TASK_DIR/run_chat_archive_pipeline.sh"
fi
