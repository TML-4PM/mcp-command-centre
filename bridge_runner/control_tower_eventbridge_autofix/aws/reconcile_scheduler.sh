#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGION="${AWS_REGION:-ap-southeast-2}"
ACCOUNT="${AWS_ACCOUNT_ID:-140548542136}"
BUS="${EVENT_BUS_NAME:-t4h-control-tower}"
QUEUE="${DLQ_NAME:-t4h-control-tower-dlq}"
SCHEDULE_NAME="${SCHEDULE_NAME:-t4h-site-scan-hourly}"
RULE_NAME="${RULE_NAME:-t4h-site-violation-detected}"

PATTERN_VIOLATION="${SCRIPT_DIR}/event_patterns/site_violation_detected.json"
TARGET_HOURLY="${SCRIPT_DIR}/scheduler_hourly_input.json"

if [ ! -f "$PATTERN_VIOLATION" ]; then
  echo "Missing event pattern: $PATTERN_VIOLATION" >&2
  exit 1
fi

if [ ! -f "$TARGET_HOURLY" ]; then
  echo "Missing scheduler target: $TARGET_HOURLY" >&2
  exit 1
fi

echo "=== Ensure EventBridge bus ==="
aws events describe-event-bus --name "$BUS" --region "$REGION" >/dev/null 2>&1 || \
  aws events create-event-bus --name "$BUS" --region "$REGION" >/dev/null

echo "=== Ensure DLQ ==="
aws sqs get-queue-url --queue-name "$QUEUE" --region "$REGION" >/dev/null 2>&1 || \
  aws sqs create-queue --queue-name "$QUEUE" --region "$REGION" >/dev/null

QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE" --region "$REGION" --query 'QueueUrl' --output text)
DLQ_ARN=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text --region "$REGION")
echo "DLQ ready: $DLQ_ARN"

echo "=== Reconcile EventBridge rule + target ==="
aws events put-rule \
  --name "$RULE_NAME" \
  --event-bus-name "$BUS" \
  --event-pattern "file://${PATTERN_VIOLATION}" \
  --state ENABLED \
  --region "$REGION" >/dev/null

aws events put-targets \
  --rule "$RULE_NAME" \
  --event-bus-name "$BUS" \
  --targets "Id=autofix-router,Arn=arn:aws:lambda:${REGION}:${ACCOUNT}:function:t4h-autofix-router" \
  --region "$REGION" >/dev/null

echo "=== Reconcile scheduler ==="
if aws scheduler get-schedule --name "$SCHEDULE_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws scheduler update-schedule \
    --name "$SCHEDULE_NAME" \
    --schedule-expression "rate(1 hour)" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "file://${TARGET_HOURLY}" \
    --state ENABLED \
    --region "$REGION" >/dev/null
  echo "Updated scheduler: $SCHEDULE_NAME"
else
  aws scheduler create-schedule \
    --name "$SCHEDULE_NAME" \
    --schedule-expression "rate(1 hour)" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "file://${TARGET_HOURLY}" \
    --state ENABLED \
    --region "$REGION" >/dev/null
  echo "Created scheduler: $SCHEDULE_NAME"
fi

echo "=== Proof ==="
aws scheduler get-schedule --name "$SCHEDULE_NAME" --region "$REGION" \
  --query '{Name:Name,State:State,Expression:ScheduleExpression,TargetArn:Target.Arn,TargetRoleArn:Target.RoleArn}'

echo "=== Reconcile complete ==="
