# Deploy Order

## Objective

Remove the final manual step by letting Bridge Runner execute the activation sequence directly from GitHub.

## Order

1. Apply `sql/001_command_centre_reality_activation.sql`
2. Deploy `lambda/command_centre_reality_verifier.py`
3. Deploy `lambda/bridge_pack_executor.py`
4. Wire the bridge invoke route to `bridge_runner/auto_bridge_executor_payload.json`
5. Publish `ui/config.example.js` as `config.js`
6. Publish `ui/app.js`
7. Run one bridge invocation against the auto executor payload
8. Confirm `public.reality_ledger` and `cc.*` views are live

## Expected outcome

- schema applied
- runtime verifier deployed
- bridge executor deployed
- first verification run completed
- ledger updated to REAL/PARTIAL based on evidence
