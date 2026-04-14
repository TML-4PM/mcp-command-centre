#!/bin/bash

set -e

echo "🔍 Running runtime validation..."

if [ -z "$BRIDGE_API_KEY" ]; then
  echo "❌ Missing BRIDGE_API_KEY"
  exit 1
fi

if [ -z "$BRIDGE_URL" ]; then
  echo "❌ Missing BRIDGE_URL"
  exit 1
fi

RESPONSE=$(curl -s -X POST "$BRIDGE_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $BRIDGE_API_KEY" \
  -d '{"fn":"troy-sql-executor","sql":"SELECT 1"}')

if [[ "$RESPONSE" != *"1"* ]]; then
  echo "❌ Bridge validation failed"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Bridge validation passed"
