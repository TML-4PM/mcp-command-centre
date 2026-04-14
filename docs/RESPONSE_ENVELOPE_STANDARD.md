# Bridge Response Envelope Standard

## Purpose

Standardise all responses from the bridge so UI, agents, and logs can rely on a consistent structure.

---

## Required structure

Every response should follow:

```json
{
  "ok": true,
  "rows": [],
  "count": 0,
  "error": null,
  "request_id": "uuid",
  "duration_ms": 0
}
```

---

## Field definitions

- `ok`: boolean indicating success or failure
- `rows`: array of result rows (always present, even if empty)
- `count`: numeric count of rows or computed value
- `error`: null or error message
- `request_id`: trace identifier for debugging and logs
- `duration_ms`: execution time

---

## Why this matters

Without this:
- UI parsing becomes fragile
- debugging becomes slow
- multi-agent orchestration becomes unreliable

With this:
- all consumers behave consistently
- logs can be correlated
- failures are explicit

---

## Migration path

1. update proxy to normalize responses
2. update bridge functions to return envelope
3. update UI to rely only on envelope

---

## Bottom line

The system must move from:

"whatever JSON came back"

to

"strict, versioned response contract"
