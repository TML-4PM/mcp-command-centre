# SQL Control Plane Deployment

## Components

- troy_sql_guardrail.py
- troy_sql_replay.py

## Deploy steps (manual or via Bridge Runner)

1. Package lambda

zip -r troy_sql_guardrail.zip troy_sql_guardrail.py
zip -r troy_sql_replay.zip troy_sql_replay.py

2. Deploy to AWS Lambda

aws lambda create-function \
  --function-name troy-sql-guardrail \
  --runtime python3.11 \
  --handler troy_sql_guardrail.lambda_handler \
  --zip-file fileb://troy_sql_guardrail.zip \
  --role <your-role-arn>

aws lambda create-function \
  --function-name troy-sql-replay \
  --runtime python3.11 \
  --handler troy_sql_replay.lambda_handler \
  --zip-file fileb://troy_sql_replay.zip \
  --role <your-role-arn>

3. Wire into bridge

Agent → Bridge → Guardrail → Executor

4. Ensure audit table exists

create table sql_execution_audit (...);

## Next

- Connect to Supabase audit store
- Add retries + DLQ
- Add metrics export
