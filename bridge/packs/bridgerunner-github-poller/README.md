# troy-bridgerunner-github-poller

Polls `TML-4PM/mcp-command-centre` for new commits to `bridge/payloads/`.
Fires a bridge dispatch event on any matching change.

## Files

| File | Purpose |
|---|---|
| `index.js` | Lambda handler — poll, diff, dispatch |
| `template.yaml` | SAM/CFN stack |
| `deploy.sh` | Deploy script (starts dry-run) |

## Runtime

- Trigger: EventBridge rate(1 minute)
- State: SSM `/bridgerunner/github/last_sha`
- Kill switch: `DRY_RUN=true` env OR disable EventBridge rule `troy-bridgerunner-github-poll-30s`

## Deploy sequence

```bash
# 1. Ensure SSM params exist
aws ssm put-parameter --name /t4h/github/token --value <PAT> --type SecureString --overwrite
aws ssm put-parameter --name /t4h/bridge/endpoint --value <BRIDGE_URL> --type String --overwrite
aws ssm put-parameter --name /t4h/bridge/api_key --value <KEY> --type SecureString --overwrite

# 2. Deploy (dry-run first)
./deploy.sh

# 3. Validate CloudWatch logs — confirm no_change or triggered logs
# 4. Activate: update stack with DryRun=false
aws cloudformation update-stack --stack-name troy-bridgerunner-github-poller \
  --use-previous-template \
  --parameters ParameterKey=DryRun,ParameterValue=false \
  --capabilities CAPABILITY_IAM
```

## Wave10 gap

`wave10=false` — this Lambda is infrastructure plumbing, not a revenue/product entity.
Register manually if needed after deploy proves out.

## Registry

- `entity_key`: `lambda.troy-bridgerunner-github-poller`
- `status`: `queued` → `active` after deploy
- `autonomy_tier`: `GATED`
