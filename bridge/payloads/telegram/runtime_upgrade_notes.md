# Runtime Upgrade — Canonical MCP Envelope

## Status
The current runtime (`index.js`) is still using the legacy bridge call shape:

```js
{ fn, payload }
```

## Required Upgrade
Replace with canonical MCP envelope:

```json
{
  "action": "invoke_function",
  "function_name": "troy-telegram-dispatch",
  "invocation_type": "RequestResponse",
  "payload": {...},
  "metadata": {...}
}
```

## Key Changes
- Add `request_id` (UUID) for traceability
- Add `timestamp_utc`
- Add `auth_context.channel = telegram`
- Standardise payload fields: `command`, `raw_text`, `context`

## Impact
After upgrade:
- Telegram becomes a first-class MCP client
- Unified contract across all ingress points
- Full audit + Reality Ledger compatibility

## Action
Update `invokeBridge()` to `invokeBridgeV2()` as defined in ChatGPT execution plan.

## Definition of Done
- All Telegram commands use MCP envelope
- Bridge accepts and processes envelope
- Events logged with request_id
- Command Centre reflects canonical execution
