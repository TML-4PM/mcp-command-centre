#!/bin/bash
set -euo pipefail

STACK=troy-bridgerunner-github-poller
REGION=ap-southeast-2
ACCOUNT=140548542136
S3_BUCKET=troy-sam-deployments-${ACCOUNT}

echo "==> Deploying $STACK to $REGION"
echo "==> Kill switch: aws events disable-rule --name troy-bridgerunner-github-poll-30s --region $REGION"

sam build --template-file template.yaml

sam deploy \
  --stack-name "$STACK" \
  --region "$REGION" \
  --s3-bucket "$S3_BUCKET" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DryRun=true \
  --no-fail-on-empty-changeset

echo "==> Deployed. DRY_RUN=true — validate logs then set DRY_RUN=false to activate."
