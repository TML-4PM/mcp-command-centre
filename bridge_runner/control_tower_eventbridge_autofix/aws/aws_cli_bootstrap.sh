#!/usr/bin/env bash
# aws_cli_bootstrap.sh — provision EventBridge bus, scheduler, SQS pipe for control tower
set -euo pipefail
REGION="ap-southeast-2"
ACCOUNT="140548542136"
BUS="t4h-control-tower"
QUEUE="t4h-control-tower-dlq"
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/troy-lambda-deployer-role"

echo "=== 1. Create EventBridge bus ==="
aws events create-event-bus --name "$BUS" --region "$REGION" 2>/dev/null || echo "bus exists"

echo "=== 2. Create DLQ ==="
aws sqs create-queue --queue-name "$QUEUE" --region "$REGION" 2>/dev/null || echo "queue exists"
DLQ_ARN=$(aws sqs get-queue-attributes   --queue-url "https://sqs.${REGION}.amazonaws.com/${ACCOUNT}/${QUEUE}"   --attribute-names QueueArn --query Attributes.QueueArn --output text --region "$REGION")

echo "=== 3. EventBridge rule: SiteViolationDetected → autofix_router ==="
aws events put-rule   --name "t4h-site-violation-detected"   --event-bus-name "$BUS"   --event-pattern file://event_patterns/site_violation_detected.json   --state ENABLED --region "$REGION"
aws events put-targets   --rule "t4h-site-violation-detected"   --event-bus-name "$BUS"   --targets "Id=autofix-router,Arn=arn:aws:lambda:${REGION}:${ACCOUNT}:function:t4h-autofix-router"   --region "$REGION"

echo "=== 4. Hourly scheduler → site_scan_launcher ==="
aws scheduler create-schedule   --name "t4h-site-scan-hourly"   --schedule-expression "rate(1 hour)"   --flexible-time-window Mode=OFF   --target file://scheduler_hourly_input.json   --region "$REGION" 2>/dev/null || echo "scheduler exists"

echo "=== Done ==="
