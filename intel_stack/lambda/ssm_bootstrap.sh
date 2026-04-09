#!/bin/bash
# SSM Parameter Bootstrap — Intel Stack
# Run once per account/env. Idempotent.
# Usage: bash ssm_bootstrap.sh prod
# Prereqs: aws-cli, correct IAM perms, Gmail OAuth tokens
set -euo pipefail

ENV="${1:-prod}"
PREFIX="/t4h/intel"
REGION="ap-southeast-2"

put() {
  aws ssm put-parameter \
    --region "$REGION" \
    --name "$PREFIX/$1" \
    --value "$2" \
    --type "$3" \
    --overwrite \
    --tags "Key=project,Value=intel-stack" "Key=env,Value=$ENV" \
    --no-cli-pager
  echo "  ✓ $PREFIX/$1"
}

echo "Bootstrapping SSM params for env=$ENV ..."

put "supabase_url"            "https://lzfgigiyqpuuxslsygjt.supabase.co"  "String"
put "supabase_key"            "${SUPABASE_KEY:?set SUPABASE_KEY}"          "SecureString"
put "gmail_client_id"         "${GMAIL_CLIENT_ID:?set GMAIL_CLIENT_ID}"    "SecureString"
put "gmail_client_secret"     "${GMAIL_CLIENT_SECRET:?}"                   "SecureString"
put "gmail_token"             "${GMAIL_TOKEN:?}"                           "SecureString"
put "gmail_refresh_token"     "${GMAIL_REFRESH_TOKEN:?}"                   "SecureString"

echo "Done. Verify:"
aws ssm get-parameters-by-path --path "$PREFIX" --region "$REGION" \
  --query "Parameters[].Name" --output table --no-cli-pager
