#!/bin/bash
set -e

echo "Deploying Telegram BridgeRunner Lambda"

sam build
sam deploy \
  --stack-name telegram-bridge-runner \
  --capabilities CAPABILITY_IAM \
  --resolve-s3

echo "Deployment complete"
