# T4H Execution & Asset Control Contract v2.1
*Status: LIVE · Verified 2026-04-22 · 13/16 REAL · 3 PARTIAL · 0 PRETEND*

> Canonical path: `core.contract_sections`  
> Verify: `SELECT * FROM core.v_contract_compliance;`  
> RPC: `ops.rpc_contract_verify()` · Cron job 251 @ :17 hourly  
> Entity: `t4h.contract.v2_1` · Broadcast id 225

---

## 0. Core principle

The system does not describe reality. It enforces reality.

An asset, workflow, or output is **REAL** iff:

1. Registered in `core.registry_entities`
2. Executed via bridge or pg_cron
3. Produces a verifiable artefact (row, file, log, broadcast)

Everything else is **PARTIAL** or **PRETEND**. PRETEND is a reject state.

---

## 1. Sixteen sections (backed, not declared)

| ID | Section | Kind | Backing | Status |
|---|---|---|---|---|
| S0 | Core principle | POLICY | — | REAL |
| S1 | Nothing exists unless registered | BACKED | `core.registry_entities` (539 rows) | REAL |
| S2 | First-30s value contract | POLICY | — | REAL |
| S3 | INPUT→CLASSIFY→ROUTE→EXECUTE→STORE→FEEDBACK→LOOP | BACKED | `cron.job` (160) + registry | REAL |
| S4 | Artefact + evidence + storage (Wave10) | BACKED | `ops.close_entity` + `t4h_canonical_changes` | REAL |
| S5 | Execute-first; clarify only on BLOCKED | POLICY | — | REAL |
| S6 | REAL/PARTIAL/PRETEND labels | BACKED | `core.contract_sections.status` | REAL |
| S7 | Minimum viable system | BACKED | registry + cron sync jobs | REAL |
| S8 | Prove invisible assets exist | POLICY | drift detector pending | **PARTIAL** |
| S9 | Auto drift + no-human execution | BACKED | `cron.job` (160 active) | REAL |
| S10 | Idempotent writes (BP 12) | BACKED | `public.email_idempotency` | REAL |
| S11 | Rollback-first (BP 11) | POLICY | `s3://arch-maturity/rollback/` | **PARTIAL** |
| S12 | Kill switch per build (BP 13) | BACKED | `public.cap_secrets` | REAL |
| S13 | RDTI tag at creation (BP 16) | POLICY | enforcement trigger pending | **PARTIAL** |
| S14 | Canonical change broadcast | BACKED | `t4h_canonical_changes` (70/7d) | REAL |
| S15 | AUTONOMOUS/LOG-ONLY/GATED/BLOCKED | BACKED | `registry_entities.autonomy_tier` | REAL |

### Enforcement rule

If an asset is not in `core.registry_entities` within 24 hours → **treated as non-existent**.

---

## 2. Execution chain

```
INPUT → CLASSIFY → ROUTE → EXECUTE → STORE → FEEDBACK → LOOP
```

| State | Action |
|---|---|
| MATCHED | keep |
| PARTIAL | enrich |
| MISSING | insert |
| DUPLICATE | merge / archive |

Archive ≠ delete.

---

## 3. Autonomy tiers (S15 — hard rule)

| Tier | Scope | Requires HITL |
|---|---|---|
| AUTONOMOUS | SELECTs, views, RPCs, indexes, reads | No |
| LOG-ONLY | INSERTs, UPDATEs, email | Log line only |
| GATED | DELETE, DROP, RLS, deploy, IAM | Dry-run → exec |
| BLOCKED | Payments, DNS, creds, legal | Explicit authority |

---

## 4. Proof of done

Nothing is complete without proof. Each done-state must bind:

```
ARTEFACT: name | type | location | status
EVIDENCE: trigger | steps | output | storage_record
```

Storage targets:

| Type | Location |
|---|---|
| Data | Supabase (S1: `lzfgigiyqpuuxslsygjt`) |
| Code | GitHub (`TML-4PM/*`) |
| Reports | Drive `1nX35fMgn5Z6s34Hq2u5r0rOogWIXBzgs` / S3 |
| UI | Vercel |

---

## 5. Build principles (v2.1 integration)

| # | Principle | Section |
|---|---|---|
| 11 | Rollback-first | S11 |
| 12 | Idempotent writes | S10 |
| 13 | Kill switch per build | S12 |
| 14 | Dependencies declared upfront | S3 |
| 15 | Cost gate before spend | S15 (GATED tier) |
| 16 | RDTI tag at creation | S13 |
| 17 | Failure path defined, not implied | S4 |

---

## 6. Quality bar (Wave10)

All 8 components required. Any missing ⇒ PARTIAL.

`runtime` · `value-loop` · `revenue` · `distribution` · `observability` · `recovery` · `evidence` · `lifecycle`

Plus: no TODOs · RLS all tables · PK + ts every table · assets registered · archive not delete.

---

## 7. Open PARTIALs (explicit, not hidden)

| Section | Gap | Next step |
|---|---|---|
| S8 First target | No invisible-asset drift detector | Build Vercel↔registry and GitHub↔registry diff views |
| S11 Rollback | Evidence index not machine-enforced | Add `core.rollback_snapshots` table + registry FK |
| S13 RDTI | Tag-at-creation not enforced | Add INSERT trigger on `registry_entities` requiring `metadata->>'is_rd'` |

---

## 8. Verification

```sql
-- Live compliance matrix
SELECT * FROM core.v_contract_compliance ORDER BY section_id;

-- Force re-verify
SELECT * FROM ops.rpc_contract_verify();

-- Audit trail
SELECT section_id, result_status, row_count, verified_at
FROM core.contract_verifications
ORDER BY verified_at DESC LIMIT 50;
```

Hourly auto-verify: `cron.job` id `251`, schedule `17 * * * *`.

---

## 9. Rollback

```sql
-- Drop the integration without losing registry
DROP VIEW IF EXISTS core.v_contract_compliance;
DROP FUNCTION IF EXISTS ops.rpc_contract_verify();
DROP TABLE IF EXISTS core.contract_verifications;
DROP TABLE IF EXISTS core.contract_sections;
SELECT cron.unschedule('contract-v2-verify-hourly');
UPDATE core.registry_entities SET status='retired' WHERE entity_key='t4h.contract.v2_1';
```

---

## 10. Who owns what

| Layer | Owner |
|---|---|
| Registry | Supabase (`core.registry_entities`) |
| Detection | SQL + verify_sql per section |
| Execution | Bridge + Lambda + pg_cron |
| Expansion | Claude/Gemini agents |
| Enforcement | Troy (policy gate on GATED+BLOCKED) |

---

*Generated by Claude via bridge `zdgnab3py0` · 2026-04-22 · commit pushed to `TML-4PM/mcp-command-centre/claude-outputs/contract/v2_1/`.*
