# SYMBIO / SYNAPSE Execution Doctrine v2.4

Status: CANONICAL EXECUTION DOCTRINE
Source: uploaded operator execution manual v2.4, 2026-04-24

## Locked System Order

WIP → Pen → Symbio → Gatekeeper → Synapse

## Non-negotiable Rules

- Nothing enters Symbio unless prepared in Pen.
- Nothing enters Synapse unless approved by Gatekeeper.
- No movement without receipts on both sides.
- No receipt = no state change.
- No Synapse write without gatekeeper_approved = true on the job record.
- All infrastructure references resolve via ops.infra_registry. Never hardcode.

## Layer Responsibilities

| Layer | Role | Does | Not allowed |
|---|---|---|---|
| WIP | intake, unresolved, incomplete work | capture, route, hold | building |
| Pen | pre-work: define, structure, prepare | define execution intent | dev implementation |
| Symbio | build + integrate in DEV | build, integrate, execute defined work | preparing/redefining work |
| Gatekeeper | admission control | validate, approve/reject, enforce | fixing |
| Synapse | production runtime | run, observe | editing |

## Infrastructure Registry

Canonical source: ops.infra_registry in Supabase project lzfgigiyqpuuxslsygjt.

Registry IDs are used instead of hardcoded values.

Key references:

| ID | Meaning |
|---|---|
| URL-001 | T4H Bridge Endpoint — primary Lambda invocation gateway |
| URL-002 | Supabase REST fallback |
| URL-004 | MCP Server EC2 |
| URL-005 | T4H Remote MCP |
| LAMBDA-001 | troy-sql-executor |
| LAMBDA-002 | troy-sql-executor-s2 — broken wrong Supabase URL |
| LAMBDA-003 | troy-orchestrator |
| DB-001 | Supabase project lzfgigiyqpuuxslsygjt |
| TABLE-001 | ops.work_queue |
| TABLE-002 | audit.receipts |
| VERCEL-001 | Vercel team team_IKIr2Kcs38KGo8Zs60yNtm7Y |
| GITHUB-001 | GitHub org TML-4PM |

## Receipt Rule

Receipts are control truth. No receipt = no movement.

Receipt format: `{LAYER}-{YYYYMMDD}-{SEQ4}`

Layers: WIP, PEN, SYM, GK, SYN

## Pen Receipt Rule

Pen outputs canonical JSON only. Free-form Pen output is rejected back to WIP.

Pen jobs that touch infrastructure must include infra_refs using ops.infra_registry IDs.

## Gatekeeper Rule

Gatekeeper validates:

- matches Pen definition
- build complete
- acceptance criteria satisfied
- audit receipt chain present
- infra_refs active in ops.infra_registry
- no duplication

Pass sets gatekeeper_approved = true and sends to Synapse.
Fail sets gatekeeper_approved = false and sends to WIP.

## Failure Handling

Incomplete, partial, broken, missing data, failed Gatekeeper, or broken infra refs all return to WIP.

Cycle count >= 3 escalates.
Past escalation_at without Pen receipt becomes STALE.

## AGL Execution Model

Observe → Evaluate → Decide → Act → Verify → Learn

System is not running unless all stages are active.

## Enforcement Priorities

1. Gatekeeper gate: enforce gatekeeper_approved on ops.work_queue before Synapse writes.
2. Pen schema validation: validate canonical JSON on audit.receipts insert.
3. WIP TTL escalation: scheduled stale/cycle enforcement.
4. Full RLS enforcement: block illegal state transitions without valid receipt chain.

## Usage Rule for LLMs and Agents

Before answering or acting on any system, product, template, repo, deployment, or capability question:

1. Check the Knowledge Spine / canonical registry first.
2. Check ops.infra_registry for infrastructure references.
3. Do not hardcode endpoints, keys, Lambdas, compute, or invocation shapes.
4. If missing or stale, create a registry gap instead of guessing.
5. No state change is complete until executed, verified, and receipted.
