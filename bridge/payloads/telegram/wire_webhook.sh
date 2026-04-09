#!/bin/bash
set -euo pipefail

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "TELEGRAM_BOT_TOKEN is required"
  exit 1
fi

if [ -z "${WEBHOOK_URL:-}" ]; then
  echo "WEBHOOK_URL is required"
  exit 1
fi

SECRET_PART=""
if [ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ]; then
  SECRET_PART=$(printf '&secret_token=%s' "$TELEGRAM_WEBHOOK_SECRET")
fi

curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}${SECRET_PART}" \
  | tee /tmp/telegram_set_webhook_response.json

echo

echo "Webhook registration attempted."
echo "Response saved to /tmp/telegram_set_webhook_response.json"
