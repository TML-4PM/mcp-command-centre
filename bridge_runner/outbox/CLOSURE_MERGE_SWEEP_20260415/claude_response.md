# Systems Architect Review: T4H Closure/Merge Pack

## 1. Canonical Merge Decisions + Rationale

### A. Merge Map Assessment

| Decision Category | Count | Assessment |
|---|---|---|
| KEEP | 18 | Appropriate — these represent distinct functional boundaries |
| MERGE | 14 | Correct consolidation of naming variants |
| DEPRECATE | 1 | Insufficient — see gaps below |

**Rationale for key decisions:**

| Artefact Group | Verdict | Rationale |
|---|---|---|
| Build Closure Board → Canonical Closure System | ✓ MERGE | Board was UI-layer name for same underlying engine |
| SOS consolidation (5 items) | ✓ MERGE | True duplicates — same concept, different naming epochs |
| Canonical Closure Doctrine → separate from System | ✓ KEEP SEPARATE | Doctrine = policy/rules; System = implementation. Correct separation |
| ops.shared_scratchpad_entry → SOS namespace | ✓ MERGE | Namespace hygiene — single canonical prefix |
| Supabase policy/schema/metadata packs → Canonical Architecture Spec | ⚠️ REVIEW | Risk of over-consolidation — schema != policy != enforcement |

---

## 2. Gaps/Risks Not Covered

### A. Missing Canonical Objects

| Gap | Why Required |
|---|---|
| **Error/Exception Taxonomy** | No canonical error classification for closure failures |
| **Ownership Registry** | Who owns each artefact? No explicit registry |
| **Version/Migration Ledger** | How do old names map to new at runtime? No contract |
| **Test Fixture Registry** | No canonical test harness for closure validation |
| **Deprecation Enforcement Hook** | How are deprecated names blocked at write-time? |

### B. Dangerous Ambiguities

| Term | Problem |
|---|---|
| "closure" | Overloaded: thread closure, build closure, loop closure, revenue closure |
| "canonical" | Used as prefix for 4+ unrelated domains — loses meaning |
| "pack" | Inconsistent granularity — some packs are docs, some are schemas, some are jobs |
| "loop" vs "system" vs "engine" | No clear taxonomy distinguishing these |

### C. Structural Risks

1. **Supabase consolidation too aggressive**: Merging schema + policy + metadata into single "Canonical Architecture Spec" conflates design-time docs with enforcement logic
2. **No explicit deprecation timeline**: "DEPRECATE" without sunset date = zombie artefacts
3. **SOS handoff queues merged but no idempotency contract**: `ops.sos_handoff_queue` and `ops.shared_handoff_queue` may have divergent semantics
4. **No cross-reference integrity check**: What ensures nothing still points to deprecated names?

---

## 3. Duplicate Patterns Identified

### True Duplicates (safe to merge)
- `Open-thread closure contract` ↔ `Open Thread Discovery and Closure Contract`
- `Shared Scratch Pad across LLMs` ↔ `Cross-LLM Working Memory` ↔ `Bridge Shared Memory Layer`
- `ops.shared_scratchpad_entry` ↔ `ops.sos_context_bundle` (likely same schema, different epochs)

### Near-Duplicates (merge with caution)
- `Build Closure Board` ↔ `Canonical Closure Engine` — Board may have had distinct UI state not in Engine
- `Canonical Supabase policy pack` ↔ `Canonical metadata enforcement pack` — Policy = rules; Metadata = data contracts. Verify no semantic loss

### Complementary Layers (DO NOT merge)
- `Closure Doctrine` ↔ `Canonical Closure System` — Policy vs Implementation
- `Runtime Lock Pack` ↔ `Runtime Audit Pack` — Prevention vs Detection
- `Registry Seed Pack` ↔ `Architecture Spec` — Bootstrap data vs Schema definition

---

## 4. Next Executable Action

**Immediate (before any code changes):**

```
ACTION: Create deprecation enforcement gate

WHERE: CI pipeline + Supabase write policies
WHAT: 
  1. Enumerate all deprecated names in machine-readable list
  2. Add pre-commit hook rejecting deprecated name usage
  3. Add RLS policy blocking inserts with deprecated artefact_type values
  4. Emit warning log for any runtime reference to deprecated names

OUTPUT: deprecation_enforcement_spec.md with implementation contract
OWNER: [assign]
DUE: Before any merge execution
```

**Secondary:**

| Priority | Action |
|---|---|
| P1 | Split "Canonical Architecture Spec" into: Schema Spec, Policy Spec, Enforcement Spec |
| P1 | Create explicit `artefact_ownership` table with canonical owner per artefact |
| P2 | Define `closure` term taxonomy: thread-closure, build-closure, loop-closure, commercial-closure |
| P2 | Add version column to all ops.* tables for migration traceability |
| P3 | Create test fixture registry under `Canonical Registry Seed Pack` |

---

## Summary Assessment

**Merge map is 80% correct.** Primary risks:
1. Over-consolidation of Supabase-related artefacts
2. No enforcement mechanism for deprecation
3. "Closure" term pollution unaddressed
4. Missing ownership and migration ledgers

**Do not execute merges until deprecation gate is live.**