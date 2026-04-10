# SYNAL CANON
**Locked 2026-04-10**

## Definition
Synal is an asset-indexed, signal-driven operating system that converts human behaviour into executable actions and verifies them with proof.

## Master brand
- Brand: **Synal**
- All extensions: **[Product] by Synal**
- WorkFamilyAI/AHC = application layer (not browser surface)

## Six canonical nouns
Signals · Tasks · Flows · Actions · Proof · Command

## Asset categories → primitive coverage
| Category | Primitive | Role |
|---|---|---|
| browser | Signal | Capture |
| extensions | Signal→Task | Inline bridge |
| apps | Task→Flow | Interaction |
| agents | Flow→Action | Execution |
| services | Action→Proof | Runtime |
| widgets | Proof→Command | Visibility |
| augmentation | Signal enhanced | Enhancement |

## Runtime lifecycle
UNREGISTERED → REGISTERED → WIRED → ACTIVE → PROVING → REAL
Failure: → ERROR / STALLED / PRETEND

## Core rule
No action without proof. No done without evidence.

## Extension contract
**Allowed:** capture context, send SynalEvent, open task, submit decision
**Forbidden:** orchestration, long-running jobs, direct proof mutation, independent task logic

## Telemetry contract (4 layers)
1. SESSION — when + context (session_id, user_id, timezone, device)
2. ACTION — what user did (event_type, extension_id, timestamp)
3. CONTEXT — what they were on (url, domain, tab_count, window_count)
4. OUTCOME — what happened (success, latency_ms, value_score, intent)

## Extension family (launch cadence)
| Month | Extension | Focus |
|---|---|---|
| 1 | Snaps by Synal | Capture |
| 2 | Auditor by Synal | Understand |
| 3 | Research by Synal | Summarise |
| 4 | Lead by Synal | Acquire |
| 5 | Workflow by Synal | Act |

## Freemium model
- Free: core snap + unlimited telemetry + basic storage
- Paid: analytics, reports, pattern detection, agentic actions, cross-session memory

## Repos
- mcp-command-centre: primary Synal pack (SQL, lambdas, extension, bridge)
- ai-evolution-program: secondary/bridge manifests

## Supabase
- S1 (lzfgigiyqpuuxslsygjt): Synal runtime — ALL writes here
- S2 (pflisxkcxbzboxwidywf): NO WRITES

## Schema state (2026-04-10)
- synal schema: 9 tables, 4 enums, 5 views, 8 functions, RLS enabled
- 6 seed assets: all REAL, health=100
- Smoke test: signal→task→flow→action→proof VERIFIED

