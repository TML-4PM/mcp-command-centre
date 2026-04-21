#!/usr/bin/env bash
set -euo pipefail

BRIDGE_URL="${BRIDGE_URL:?Set BRIDGE_URL}"
API_KEY="${BRIDGE_API_KEY:?Set BRIDGE_API_KEY}"

PAYLOAD=$(cat aws/bridge_payload_control_tower.json)

curl -X POST "$BRIDGE_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$PAYLOAD"

echo "Bridge invoke sent"
