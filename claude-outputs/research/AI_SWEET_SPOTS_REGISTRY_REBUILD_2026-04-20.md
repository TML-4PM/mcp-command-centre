# AI Sweet Spots — Research Registry Rebuild & Site Architecture Lock

**Executor:** Claude (bridge-first)
**Session:** 2026-04-20 04:34–05:15 UTC
**State:** DEPLOYED · CANONICAL · BRIDGE-READY
**Owner:** Troy Latter (T4H Pty Ltd · ABN 70 666 271 272)

---

## 1. What was deployed

| Layer | Object | Row state | Status |
|---|---|---|---|
| Canonical study registry | `research.t4h_study_registry` | **56 studies** | LIVE · RLS · PK · trigger |
| Conflict ledger | `research.t4h_study_conflicts` | **5 conflicts logged** | LIVE |
| Program total view | `research.v_program_total_true` | computed live | LIVE |
| Bucket rollup | `research.v_rollup_by_bucket` | 7 buckets | LIVE |
| Type rollup | `research.v_rollup_by_type` | 10 types | LIVE |
| Site page mapping | `research.v_site_page_studies` | 4 pages · JSON payload | LIVE |
| Drift ledger | `research.v_study_number_drift` | 9 historical numbers resolved | LIVE |

Indexes: 7. Policies: 2 (service_role_all · public_read on `is_public=true`). Trigger: `trg_t4h_study_reg_touch` on update.

---

## 2. The canonical numbers (replaces every drifting figure on the site)

```sql
SELECT * FROM research.v_program_total_true;
```

| Metric | Value | Meaning |
|---|---|---|
| `n_validated` | **11,728** | ASS-1 (487) + ASS-2 (11,241). Rock-solid validated AI Sweet Spots research. |
| `n_validated_active` | **18,380** | Above + AISWEET-LI LinkedIn corpus (637) + BIO-CELL links (171) + EXT-PSYCHEDELICS (5,600) + EXT-SECOND-LANG (100) + DRA (44). |
| `n_all_additive` | **18,380** | All additive studies with declared N. |
| `n_range_max_ceiling` | **4,100** | Ceiling of planned/range studies not yet included above (BIO-HORM 200, BURN-AI 500, EDTECH 100, ALT-SS 400, EMP-DIS 1000, EXT-EEG 100, EXT-THRIVING-KIDS 300, EXT-HYBRID 400, EXT-ENTERPRISE 200, etc.) |
| `n_subset_reanalyses` | **1,901** | NEG-RESP (1,401) + EXT-CROSSOVER (500). **NOT added to totals** — these are re-analyses of ASS-2. |

**The one number that never moves: `n_validated = 11,728`.**

---

## 3. Drift ledger — every number that has appeared, resolved

| Number | Where it came from | Resolution |
|---|---|---|
| **4,247** | Site poster headline | DEPRECATED. Was the operational CRM panel (4,256 in `research_participant_registry`) mistaken for a study N. |
| **12,886** | Site poster "across 5 studies" | DEPRECATED. Approximate total. Replaced by computed `v_program_total_true`. |
| **8,394** | Internal Grok summary ("24 months") | SUSPECT. No match in `ass_study`. Do not reuse. |
| **2,847** | Internal LinkedIn range 2,847–4,247 | SUSPECT. Legacy draft count. Unrelated to NEG-RESP. |
| **1,401** | Negative Responders | VERIFIED as SUBSET of ASS-2. `is_additive=false`. |
| **1,500** | Fifth Quadrant | SEPARATE study, not AI Sweet Spots. |
| **4,256** | `research_participant_registry` row count | OPERATIONAL. CRM re-contact panel. Not a study N. |
| **11,241** | ASS-2 `sample_size` | CANONICAL (confirmed in `research.study_id_map`). |
| **11,728** | Computed | **CANONICAL.** Live sum of validated additive studies. |

---

## 4. Registry contents by spot bucket

| Bucket | Count | Validated N | Additive N (all) | Studies |
|---|---|---|---|---|
| **SWEET** | 3 | 11,728 | 11,728 | ASS-1, ASS-2, RCT-2026 |
| **BIO** | 6 | 0 | 5,600 | EXT-EEG-NEURAL, EXT-MEDICATION-AI, EXT-PSYCHEDELICS, ALT-SS, BIO-HORM, TEMP-CIRC, ASAI, BIO-CELL |
| **DARK** | 4 | 0 | 0 | NEG-RESP (subset), EMP-DIS, BURN-AI, PTSD-AI |
| **HUMAN** | 13 | 0 | 100 | CARE, EXT-CULTURAL-PSYCH, EXT-SECOND-LANG, EXT-THRIVING-KIDS, KIDS, COP-SHIFT, SM-S1..S9 |
| **APPLIED** | 3 | 0 | 144 | DRA, EDTECH-PILOT, EXT-ENTERPRISE, ENT |
| **EDGE** | 6 | 0 | 0 | COG-ERG, DIGA-STRAT, SYS-3, EXT-WORKFORCE-ROLES, EXT-HYBRID-INTEL |
| **PROGRAM** | 13 | 0 | 808 | CSO, EXT-COG-ASSESS, GAIN, GOVERNANCE, ISO-42001, EXT-POLICY-GOV, POSTER-SET, REVENUE, RD-ARTEFACT-PACK, RD-LASERDRONE, RD-MCP-BRIDGE, RD-NEURAL-ENNEAD, RD-RATPAK, OLYMPICS, AISWEET-LI |

---

## 5. Site page → studies mapping

The site should pull from `research.v_site_page_studies`. Current state:

| Page | Studies | Validated N | Total N | Content |
|---|---|---|---|---|
| `/insights` | 4 | **11,728** | 11,728 | ASS-1, ASS-2, EXT-CROSSOVER (subset), EXT-CULTURAL-PSYCH |
| `/papers` | 10 | 0 | 5,700+ | EXT-EEG, EXT-MEDICATION, EXT-PSYCHEDELICS, NEG-RESP, CARE, COG-ERG, DRA, AISWEET-LI, BIO-CELL, EXT-SECOND-LANG, ASAI, COP-SHIFT, DIGA-STRAT, SYS-3 |
| `/social-skills` | 9 | 0 | 0 | SM-S1..SM-S9 (social-media-harm research) |
| `/assessment` | 1 | 0 | 0 | EXT-COG-ASSESS (feeds the assessment tool) |

**Action required:** The Sweet Spots site needs to stop hardcoding numbers. Point each page at `research.v_site_page_studies` or a CCQ that wraps it.

---

## 6. Conflicts logged (open for Troy's review)

| Study ID | Type | Source A | Source B | Recommendation |
|---|---|---|---|---|
| `ASS-2` | NAME_MISMATCH | `ass_study`: "Multi-Site Validation" | `ass_study_cards`: "Negative Responder Decline Mechanisms" | Fix `ass_study_cards.ASS-2`. That name belongs on NEG-RESP. |
| `CSO` | NAME_MISMATCH | `ass_study`: "Cognitive Shift Observatory" | `ass_study_cards`: "Cognitive Style Optimisation Study" | Split into CSO-OBS and CSO-OPT. Different studies. |
| `EXT-THRIVING-KIDS` | DUPLICATE | `ass_study`: EXT-THRIVING-KIDS | `ass_study_cards`: KIDS | Merge. Retire `KIDS`. |
| `EXT-ENTERPRISE` | DUPLICATE | `ass_study`: EXT-ENTERPRISE | `ass_study_cards`: ENT | Merge. Retire `ENT`. |
| `GAIN` | NAME_MISMATCH | "GAIN Platform Live" | "GAIN — Gamified AI Natural Assessment" | ACCEPTED. Same platform, different phases. |

---

## 7. Site architecture — the nav restructure Troy asked for

**Current state:** Single poster page. Numbers floating. Studies unstructured.

**Proposed state:** Keep `aisweetspots.com` domain. Break top nav into spot buckets. Products live under each.

```
AI SWEET SPOTS (domain root)
│
├── Sweet Spots (where AI helps)
│   ├── Studies: ASS-1 · ASS-2 · EXT-CROSSOVER · RCT-2026 · ASS-CDI-001
│   ├── Products: Assessment · Insights · Reports · Coordination Dividend Index
│   └── Headline: 11,728 validated · 6 continents
│
├── Dark Spots (where AI harms)
│   ├── Studies: NEG-RESP (1,401) · EMP-DIS · BURN-AI · PTSD-AI
│   ├── Products: Risk assessment · Negative responder screening
│   └── Headline: 1,401 documented decline cases
│
├── Bio Spots (biology × AI)
│   ├── Studies: EXT-EEG-NEURAL · EXT-MEDICATION-AI · EXT-PSYCHEDELICS (5,600)
│   │            · ALT-SS · BIO-HORM · TEMP-CIRC · ASAI · BIO-CELL (171)
│   ├── Products: EEG signatures · Medication complement · Circadian AI
│   └── Headline: 5,771+ biology-AI participants
│
├── Human Spots (social · cultural · family)
│   ├── Studies: CARE · EXT-CULTURAL-PSYCH · EXT-SECOND-LANG (100)
│   │            · EXT-THRIVING-KIDS · SM-S1..S9 (social media harm)
│   ├── Products: Cultural safety protocols · Second-lang pilot · Thriving Kids
│   └── Headline: 9 social-harm signals · Māori cohort validated
│
├── Applied (where research meets business)
│   ├── Studies: DRA (44/500) · EDTECH-PILOT · EXT-ENTERPRISE
│   ├── Products: Drug Resilience Atlas · EdTech Pilot · Enterprise Framework
│   └── Headline: 44 DRA case studies · 500 target
│
├── Papers (/papers)   → AISWEET-LI (637) + research_publication_register (645)
├── Assessment (/assessment) → EXT-COG-ASSESS
└── About / Research Program → 9×9×9 map (100 topics · 8 arms)
```

**Removed pages (kept as research, not front-page):**
- Drug & Alcohol → now under **Applied** (DRA)
- Care protocols → now under **Human Spots** (CARE)
- Biology/living systems → now under **Bio Spots** (BIO-CELL)

---

## 8. Research universe map (what we're sitting on)

**Separate tables, separate concerns — DO NOT merge:**

| Table | Purpose | Rows |
|---|---|---|
| `research.t4h_study_registry` | **Canonical studies executed** (this build) | **56** |
| `public.research_topics` | **9×9×9 capability map** (9 layers × 10 topics) | **100** (90 in_core + 10 collection) |
| `public.research_arms` | 8 research arms (ass, bio, care, dcp, mns, ubi, xai, xover) | **8** |
| `public.research_lanes` | Lanes within each arm | **64** |
| `public.t4h_research_area` / `_subarea` | Site navigation structure | 15 / 84 |
| `public.t4h_research_asset` | Research artefacts (papers, decks, datasets) | **280** |
| `public.research_publication_register` | Published outputs incl. LinkedIn corpus | **645** (637 LI + 8 formal) |
| `public.research_participant_registry` | Operational CRM panel (NOT a study N) | 4,256 |

**The 43 novel-direction pipeline** (BIO-1..8, ARCH-1..5, TEMP-1..5, SOC-1..4, CLIN-1..6, ALT-1..4, THEO-1..5, COM-1..6) lives on the pipeline page but is NOT yet a structured table. Source: `https://sweetspots.workfamilyai.org/research/pipeline.html`. Landing it as `record_type='NOVEL'` in a unified registry is the next move.

---

## 9. What's NOT in the registry yet (and where to find it)

Found in Drive (20+ PDFs, partial reads):

| Document | Drive ID | Likely contribution |
|---|---|---|
| `Refining and validating - AI sweet spots, the main study` (5.5 MB) | `10MCWQ2Jj_8oAAXnWelZ_nd5tLAYls1ED` | Methodology lock for ASS-1/ASS-2 |
| `AI Sweet Spots_ Differential Cognitive Effects Across Human Populations` | `1eex7aBvDkK8-u_qy6BGdJ3bqROjwHwAC` | Population breakdowns — likely N by cohort |
| `AI_SWEET_SPOTS_METHODOLOGY_PACK` | `1kWjG4tV_YDHTeXKI6_hU3-IFZ86atg-f` | Full methodology |
| `Decision Record — AI Sweet Spots Surface Separation & Research Hub Formation` (2.6 MB) | `1p7Aj0d_y7HRcKLDZGwDFcpF_yfRyK1g6` | Site architecture plans (already read) |
| `ai-sweetspots-novel-ideas-register` | `1TN9bf1qrhSYx4PJ9LNnmg_oYDrJB7NU-` | The novel directions + 1,401 decline discussion |
| `Psychedelic-assisted` | `165Muu6MYFzqNLCLwouOV7pUhY89y6iwE` | EXT-PSYCHEDELICS source paper |
| `Survey methodology and templates for AI sweetspots` | `1Tqa8Y_CyKopH4X9EOvvhzcwLwxN8bowe` | Survey instruments |
| `AI SWEET SPOTS - V2 start` | `1tm7yuQBmNAD7ybYGJfU0sZS54tLE0EXV` | V2 research draft |

Drive parent folders of note: `1XqiRvsRz78rwNLcdsFADjK6AweECZO0k` (AI Sweet Spots research hub) · `0AKw0-5hmRBFaUk9PVA` (shared drive root).

---

## 10. Outstanding / next-actions

| # | Action | Tier | Owner |
|---|---|---|---|
| 1 | Fix `ass_study_cards.ASS-2` mis-label (should be NEG-RESP naming) | LOG | bridge |
| 2 | Reconcile `EXT-THRIVING-KIDS` ↔ `KIDS` (merge, retire one) | LOG | bridge |
| 3 | Reconcile `EXT-ENTERPRISE` ↔ `ENT` (merge, retire one) | LOG | bridge |
| 4 | Split `CSO` into `CSO-OBS` (Observatory) and `CSO-OPT` (Optimisation) | LOG | bridge |
| 5 | Read remaining ~15 Drive PDFs, extract structured N for validated studies | AUTO | bridge |
| 6 | Load 43 novel directions (BIO-1..8 etc.) into `research.t4h_study_registry` with `study_type='NOVEL'` | LOG | bridge |
| 7 | Link studies → `public.t4h_research_subarea` for 9×9×9 coverage view | AUTO | bridge |
| 8 | Verify `/insights` page actually queries the canonical view (not hardcoded 12,886) | GATED | frontend |
| 9 | Draft `/dark-spots`, `/bio-spots`, `/human-spots`, `/applied` page stubs | GATED | frontend |
| 10 | EXT-CULTURAL-PSYCH, EXT-MEDICATION-AI — get exact N from Drive PDFs and upgrade from `PARTIAL` to `VERIFIED` | LOG | bridge |

---

## 11. Acceptance criteria

- [x] One canonical registry table (`research.t4h_study_registry`) with RLS, PK, ts triggers
- [x] Additive vs subset logic explicit (`is_additive` + `n_parent_study_id`)
- [x] Program total computable live, never hardcoded (`v_program_total_true`)
- [x] Drift ledger documents every historical number and resolves it (`v_study_number_drift`)
- [x] Conflict detection table with 5 open conflicts
- [x] Site page → studies mapping view for frontend to consume
- [x] 7-bucket classification (SWEET/DARK/BIO/HUMAN/APPLIED/EDGE/PROGRAM) aligned to Troy's nav restructure
- [x] RDTI tagging at creation (`rdti_relevant`, `rdti_project_code`)
- [ ] 43 novel directions seeded (next session)
- [ ] 9×9×9 topic ↔ study cross-reference (next session)
- [ ] Site pages actually pulling from views (frontend ticket)

---

## 12. Evidence footprint

- All DDL idempotent (IF NOT EXISTS · ON CONFLICT DO UPDATE)
- All policies guarded (DO block with pg_policies check)
- Trigger body uses `$BODY$` dollar-quote (bridge-compatible)
- Primary source column on every row (`primary_source`)
- Secondary sources as JSONB array with confidence/canonical flags
- `evidence_status` enum: DISCOVERED · VERIFIED · CONFLICT · PRETEND · PARTIAL · REAL
- `last_verified_at` timestamp on every row

**Rollback:** `DROP TABLE research.t4h_study_registry CASCADE;` reverts the entire build. No side-effects on `public.ass_study`, `public.research_participant_registry`, or other production tables.

---

## 13. Files deployed this session

| Path | Role |
|---|---|
| `/home/claude/registry_ddl.sql` | Canonical DDL |
| `/home/claude/seed_ass.sql` | Seed wave 1 (38 studies from `public.ass_study`) |
| `/home/claude/seed_wave2.sql` | Seed wave 2 (9 extras + AISWEET-LI + BIO-CELL + DRA + conflicts) |
| `/home/claude/views.sql` | 5 rollup views |

---

**Final canonical number to take to the site: `11,728 validated participants · 18,380 across validated + active programmes · 56 studies in registry · 43 novel directions awaiting load · 100 subtopics in 9×9×9 map.`**

End of report.
