#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-2}"
ACCOUNT_ID="${ACCOUNT_ID:?Set ACCOUNT_ID}"
SCHEDULE_NAME="${SCHEDULE_NAME:-mcp-command-centre-sweep}"
ROLE_NAME="${ROLE_NAME:-Amazon_EventBridge_Scheduler_Invoke_APIGW}"
API_ID="${API_ID:-m5oqj21chd}"
API_STAGE="${API_STAGE:-lambda}"
API_METHOD="${API_METHOD:-POST}"
API_PATH="${API_PATH:-/lambda/invoke}"
SCHEDULE_EXPRESSION="${SCHEDULE_EXPRESSION:-rate(15 minutes)}"

TARGET_ARN="arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/${API_STAGE}/${API_METHOD}${API_PATH}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

TMP_TARGET_FILE="$(mktemp)"
trap 'rm -f "$TMP_TARGET_FILE"' EXIT

INPUT_JSON="$(python3 - <<'PY'
import json
from pathlib import Path
payload = json.loads(Path('aws/scheduler_payload_control_tower.json').read_text())
print(json.dumps(payload, separators=(',', ':')))
PY
)"

cat > "$TMP_TARGET_FILE" <<EOF
{
  "Arn": "${TARGET_ARN}",
  "RoleArn": "${ROLE_ARN}",
  "Input": ${INPUT_JSON}
}
EOF

echo "Using target ARN: ${TARGET_ARN}"
echo "Using role ARN:   ${ROLE_ARN}"
echo "Using schedule:   ${SCHEDULE_NAME}"
echo "Using expression: ${SCHEDULE_EXPRESSION}"

if aws scheduler get-schedule --region "${REGION}" --name "${SCHEDULE_NAME}" >/dev/null 2>&1; then
  aws scheduler update-schedule \
    --region "${REGION}" \
    --name "${SCHEDULE_NAME}" \
    --schedule-expression "${SCHEDULE_EXPRESSION}" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "file://${TMP_TARGET_FILE}" \
    --state ENABLED
  echo "Updated schedule: ${SCHEDULE_NAME}"
else
  aws scheduler create-schedule \
    --region "${REGION}" \
    --name "${SCHEDULE_NAME}" \
    --schedule-expression "${SCHEDULE_EXPRESSION}" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "file://${TMP_TARGET_FILE}" \
    --state ENABLED
  echo "Created schedule: ${SCHEDULE_NAME}"
fi

aws scheduler get-schedule --region "${REGION}" --name "${SCHEDULE_NAME}"
