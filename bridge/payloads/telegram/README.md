# BridgeRunner Pack — Telegram Ingress

This folder contains the fixed BridgeRunner pack for Telegram ingress.

## Contents
- `telegram_bridge_pack_fixed.zip` — packaged deployable bundle
- `index.js` — corrected Lambda handler
- `template.yaml` — SAM template
- `deploy.sh` — deploy helper
- `wire_webhook.sh` — Telegram webhook registration helper
- `ddl_telegram_events.sql` — table DDL

## Notes
- Fixed Lambda handler/file mismatch by standardising on `index.js`
- Fixed Supabase method handling so PATCH requests are honored
- Retained original bridge payload assumption `{ fn, payload }` with `x-api-key`
- If live bridge now expects the newer canonical invoke envelope, update bridge call shape before production cutover

## Suggested use
Deploy the bundle, wire the webhook, then test `/start`, `/help`, and `/health`.
