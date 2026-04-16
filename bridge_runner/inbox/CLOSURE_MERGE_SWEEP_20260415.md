# Closure Merge Sweep — Canonical Merge Map + Multi-LLM Request Pack

Date: 2026-04-15
Purpose: collapse duplicate closure/control-plane artefacts into canon, then fan out a deep-search review to GPT, Claude, and Perplexity. Responses should land in one central location for bridge-runner summarisation and write-back.

---

## 1) Canonical merge map

| existing artefact name | keep/merge/deprecate | canonical replacement |
|---|---|---|
| Build Closure Control Plane | KEEP | `Canonical Closure System` |
| ops.build_closure_register | KEEP | `Canonical Closure System / ops.build_closure_register` |
| runtime.closure_jobs | KEEP | `Canonical Closure System / runtime.closure_jobs` |
| ops.build_dependencies | KEEP | `Canonical Closure System / ops.build_dependencies` |
| reality.build_evidence_binding | KEEP | `Canonical Closure System / reality.build_evidence_binding` |
| Command Centre closure widget | KEEP | `Canonical Closure System / cc.closure_widget` |
| Build Closure Board | MERGE | `Canonical Closure System` |
| Canonical Closure Engine | MERGE | `Canonical Closure System` |
| Canonical Closure Doctrine | KEEP | `Closure Doctrine` |
| Open Thread Discovery and Closure Contract | KEEP | `Open Thread Discovery and Closure Loop` |
| Open-thread closure contract | MERGE | `Open Thread Discovery and Closure Loop` |
| Closure board / closure board language | DEPRECATE | `Canonical Closure System` |
| Shared Scratch Pad across LLMs and bridge | MERGE | `Shared Operational Scratchpad (SOS)` |
| Shared Operational Scratchpad | KEEP | `Shared Operational Scratchpad (SOS)` |
| Cross-LLM Working Memory | MERGE | `Shared Operational Scratchpad (SOS)` |
| Bridge Shared Memory Layer | MERGE | `Shared Operational Scratchpad (SOS)` |
| ops.shared_scratchpad_entry | MERGE | `SOS / ops.shared_operational_scratchpad_entry` |
| ops.shared_handoff_queue | MERGE | `SOS / ops.shared_operational_scratchpad_handoff` |
| ops.sos_handoff_queue | MERGE | `SOS / ops.shared_operational_scratchpad_handoff` |
| ops.sos_context_bundle | MERGE | `SOS / ops.shared_operational_scratchpad_bundle` |
| ops.sos_decision_log | MERGE | `SOS / ops.shared_operational_scratchpad_decision_log` |
| Canonical Supabase Implementation Pack | KEEP | `Canonical Architecture Spec` |
| Canonical Supabase policy/enforcement pack | MERGE | `Canonical Architecture Spec` |
| Canonical schema doc | MERGE | `Canonical Architecture Spec` |
| Canonical metadata enforcement pack | MERGE | `Canonical Architecture Spec` |
| Registry seed pack | KEEP | `Canonical Registry Seed Pack` |
| Runtime state registry / event taxonomy / evidence class registry | KEEP | `Canonical Registry Seed Pack` |
| Runtime lock pack | KEEP | `Runtime Lock and Integrity Pack` |
| Runtime execution audit pack | KEEP | `Runtime Audit and Recovery Pack` |
| Recovery / replay / DLQ pack | KEEP | `Runtime Audit and Recovery Pack` |
| Widget/runtime/surface taxonomy memo | MERGE | `Surface and Widget Taxonomy Standard` |
| UI snippet / widget registry doctrine | KEEP | `Surface and Widget Taxonomy Standard` |
| Product activation loop / revenue closure loop | KEEP | `Commercial Closure Loop` |
| Front Door / landing summary views | KEEP | `Command Centre Front Door` |

---

## 2) Canonical end-state names

Use these as the only legal names going forward:

1. **Closure Doctrine**
2. **Open Thread Discovery and Closure Loop**
3. **Canonical Closure System**
4. **Shared Operational Scratchpad (SOS)**
5. **Canonical Architecture Spec**
6. **Canonical Registry Seed Pack**
7. **Runtime Lock and Integrity Pack**
8. **Runtime Audit and Recovery Pack**
9. **Surface and Widget Taxonomy Standard**
10. **Commercial Closure Loop**
11. **Command Centre Front Door**

---

## 3) Review questions for all LLMs

Each model must answer all of these:

1. Which artefacts are true duplicates versus complementary layers?
2. Which names should be retained as canonical?
3. Which names should be deprecated immediately?
4. Are there missing canonical objects that should exist but are not explicitly named?
5. What migration mapping is required from old names to canonical names?
6. What is the minimum production table/view set to operationalise the canonical closure stack?
7. What is still dangerously ambiguous in the current vocabulary?
8. What should bridge-runner summarise back as the final keep/merge/deprecate outcome?

---

## 4) Standard response format required from each LLM

Return exactly these sections:

### A. Merge map
A three-column table:
`existing artefact name | keep/merge/deprecate | canonical replacement`

### B. Duplicate analysis
- true duplicates
- near-duplicates
- complementary layers that should NOT be merged

### C. Canonical vocabulary
- approved canonical names
- deprecated names
- ambiguous terms to ban or restrict

### D. Operationalisation minimum
- required tables
- required views
- required loops/jobs
- required evidence bindings

### E. Hard recommendations
- top 10 actions to collapse sprawl and force canon

### F. Risks
- top 10 risks if duplicates remain alive

---

## 5) Central response location contract

All responses should be written into this repo under:

`bridge_runner/outbox/closure_merge_sweep/20260415/`

Use one file per model:

- `gpt_response.md`
- `claude_response.md`
- `perplexity_response.md`
- `bridge_runner_summary.md`

If that exact path does not exist, create it.

---

## 6) Bridge-runner summary contract

Bridge-runner must:

1. ingest all three model responses
2. deduplicate repeated findings
3. produce a single ranked summary
4. emit:
   - final canonical merge map
   - approved canonical vocabulary
   - banned/deprecated names
   - operational minimum stack
   - unresolved disagreements across models
5. write the result to:
   - `bridge_runner/outbox/closure_merge_sweep/20260415/bridge_runner_summary.md`
6. send a concise summary back into the chat thread

---

## 7) Prompt for GPT

You are reviewing a duplicated control-plane / closure / scratchpad architecture. Search deeply across available artefacts, docs, repos, and notes. Do not assume that repeated names represent separate systems. Determine which artefacts are duplicates, which are complementary layers, and which should be deprecated. Produce a canonical merge map using exactly these columns: `existing artefact name | keep/merge/deprecate | canonical replacement`. Then provide duplicate analysis, canonical vocabulary, operationalisation minimum, hard recommendations, and risks. Your job is not to preserve legacy phrasing. Your job is to reduce sprawl and force one canonical operating model.

Write your response to:
`bridge_runner/outbox/closure_merge_sweep/20260415/gpt_response.md`

---

## 8) Prompt for Claude

Review the closure, control-plane, scratchpad, runtime, and canonical-schema artefacts as one operating estate. Search deeply and compare them semantically, not just by title. Identify true duplicates, near-duplicates, and complementary layers. Recommend one canonical naming system and a migration path from all repeated variants. Output a strict three-column merge map: `existing artefact name | keep/merge/deprecate | canonical replacement`, followed by duplicate analysis, canonical vocabulary, operationalisation minimum, hard recommendations, and risks. Be blunt where names are redundant or misleading.

Write your response to:
`bridge_runner/outbox/closure_merge_sweep/20260415/claude_response.md`

---

## 9) Prompt for Perplexity

Search deeply for all relevant artefacts in the available corpus and compare repeated closure/control-plane concepts. Your task is to determine whether repeated names refer to the same underlying subsystem or genuinely distinct layers. Produce a canonical merge map with exactly these columns: `existing artefact name | keep/merge/deprecate | canonical replacement`. Then return duplicate analysis, canonical vocabulary, operationalisation minimum, hard recommendations, and risks. Focus on factual grounding from the available material and surface contradictions clearly.

Write your response to:
`bridge_runner/outbox/closure_merge_sweep/20260415/perplexity_response.md`

---

## 10) Non-negotiable rules

- Do not create new canon unless it resolves duplication or missing structure.
- Do not keep multiple names alive for the same thing.
- Do not merge distinct layers that have different truth, runtime, or evidence roles.
- Treat Supabase canonical records as higher authority than stale prose unless evidence proves otherwise.
- Any deprecated object must include a replacement mapping.
- Prefer one durable operating model over many clever descriptions.


<!-- runner-trigger: 2026-04-16T00:02:58Z -->