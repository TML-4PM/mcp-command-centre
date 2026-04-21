# Wave20 — First 30s Closer (v3)

**Status:** 34 READY · 8 BLOCKED (site_fix_404)  
**Canon:** `t4h_canonical_changes.id=237` severity HIGH broadcast_ok=true  
**Orchestration:** `WAVE20_REAL` — 729 agents · 372 lambdas · 171 cron · **0 pretend runs**  
**Snapshot:** 2026-04-21 22:44 UTC

---

## Pipeline state

| State | n |
|---|---|
| READY | 34 |
| DOMAIN_ONLY_404 | 8 |


**Total customer-facing:** 42  
**READY:** 34 (81%)

---

## 34 READY businesses (grouped)

### G1

| Business | Hero → CTA | Widget |
|---|---|---|
| **Augmented Humanity Coach** | AI coaching that remembers your last session → Try a 2-minute coaching moment | `ahc-hero-try` |
| **HoloOrg** | Run your business with a team of AI specialists → Meet your agent stack | `holoorg-hero-meet` |
| **Tech for Humanity** | The holding company behind 30 AI-first businesses → See the portfolio | `t4h-hero-portfolio` |
| **WorkFamilyAI** | Your AI work family — like colleagues, not chatbots → Pick your family | `wfai-hero-pick` |

### G2

| Business | Hero → CTA | Widget |
|---|---|---|
| **ConsentX** | Consent logging that stands up in court → See a live consent flow | `consentx-hero-demo` |
| **Far-Cage** | Escape the algorithmic cage — fair AI for small business → See the framework | `farcage-hero-framework` |
| **GC-BAT Core** | The neural-signal platform behind GCBAT products → See the stack | `gcbat-hero-stack` |
| **MyNeuralSignal** | Know your neural signal before it knows you → Run a signal check | `mns-hero-check` |
| **NEUROPAK** | Enterprise neural-signal deployment kit → Request a pack | `neuropak-hero-request` |
| **RATPAK** | Rapid Assessment Trial Pack — 1-week signal pilot → Start my pilot | `ratpak-hero-start` |

### G3

| Business | Hero → CTA | Widget |
|---|---|---|
| **AquaMe** | Water health for Australian homes → Test my water | `aquame-hero-test` |
| **CalmBound** | Bounded calm for nervous systems under AI load → Start the reset | `calmbound-hero-reset` |
| **Chemists Platform** | The operating system for independent pharmacies → Book a walkthrough | `chemists-hero-book` |
| **GAIN** | Measure the gain, not the grind → See your gain | `gain-hero-see` |
| **Global Tyres** | Tyre logistics that sees the whole continent → Request a quote | `gtyres-hero-quote` |
| **SmartPark** | Parking that pays for itself → See how it works | `smartpark-hero-how` |

### G4

| Business | Hero → CTA | Widget |
|---|---|---|
| **Enter Australia** | Land in Australia. Build here. Stay here. → Start my entry path | `ea-hero-start` |
| **Enter Australia Tech** | Help international founders land in Australia → Start my entry plan | `eat-hero-plan` |
| **House of Biscuits** | Artisan biscuits. Human hands. Australian grain. → See the range | `hob-hero-range` |
| **Oman Strategy** | Australia-Oman corridor strategy pack → Open the pack | `oman-hero-pack` |

### G5

| Business | Hero → CTA | Widget |
|---|---|---|
| **AI Oopsies** | The AI fails that cost real money — categorised → Browse the oopsies | `oopsies-hero-browse` |
| **Apex Predator Insurance** | Insurance for the risks insurers ignore → Get a quote | `apex-hero-quote` |
| **Rhythm Method** | Find your work rhythm, not someone else's schedule → Find my rhythm | `rhythm-hero-find` |
| **Spotto** | Spot the extreme before it spots you → Start spotting | `spotto-hero-start` |

### G6

| Business | Hero → CTA | Widget |
|---|---|---|
| **CV Engine** | A CV that passes the first ATS in 30 seconds → Score my CV | `cv-hero-score` |
| **Making You A Star** | Turn your work into your brand — automatically → Start my star path | `star-hero-start` |
| **Property Decision Pack** | Know if the property is actually worth it → Build a decision pack | `pdp-hero-build` |

### G7

| Business | Hero → CTA | Widget |
|---|---|---|
| **10 Day Media Map** | Map your 10-day media moment before competitors do → Build my map | `10dmm-hero-build` |
| **AI Era Thinking** | Thinking frameworks that assume AI is in the room → Read the frameworks | `aet-hero-read` |
| **Atlas Aus Pulse** | The pulse of Australian cognitive health → View the atlas | `aap-hero-view` |
| **LifeGraph Plus** | Graph your life. See the leverage. → Build my graph | `lgp-hero-build` |
| **Neural Market Intelligence** | Market intelligence that reads the neural signal → See the feed | `nmi-hero-feed` |
| **Neural Research Hub** | AI sweet spots — where neural signal meets product-market fit → Browse sweet spots | `nrh-hero-browse` |
| **SM 2.0 Tech4Humanity** | Social Media 2.0 — post once, signal everywhere → Try SM 2.0 | `sm2-hero-try` |

---

## 8 BLOCKED — `site_fix_404` work items

These are aspirational `*.tech4humanity.com` subdomains with no deployed host. Cannot be promoted to READY until site is deployed, redirected, or URL retired.

| Business | Dead URL |
|---|---|
| `apac-just-walk-out` | https://apac.justwalkout.tech4humanity.com |
| `justpoint` | https://justpoint.tech4humanity.com |
| `maat-money` | https://maat.tech4humanity.com |
| `predator-alert` | https://predatoralert.tech4humanity.com |
| `resilience-atlas` | https://resilienceatlas.tech4humanity.com |
| `stubborn-ai-fails` | https://stubbornfails.tech4humanity.com |
| `vuon-troi` | https://vuontroi.tech4humanity.com |
| `xces` | https://xces.tech4humanity.com |


**Disposition options (choose per URL):**
1. **Deploy placeholder** — minimal hero page on Vercel, 200 OK  
2. **Redirect to parent** — 301 to augmented-humanity-coach or tech-for-humanity  
3. **Retire URL** — remove from `v_domain_map_full`, mark business as `requires_domain` in registry

All 8 enqueued in `runtime.work_register` with `job_type='site_fix_404'`, `status='BLOCKED'`, `autonomy_tier='GATED'`. Human decision required on disposition.

---

## Architecture delivered this session

### Tables
- `cc.business_first_30s_content` — 34 rows, all SHIPPED

### Views
- `cc.v_customer_first_30s_v2` — URL fallback logic, infra/IP pseudo-entity filter, 6-state pipeline

### Widgets in `public.t4h_ui_snippet`
- `wave20-first-30s-closer` — pipeline dashboard (3,140 chars)
- `wave20-customer-first-30s` · `wave20-operational-orchestration` · `wave20-proof-of-done` — Wave20 base widgets
- 34 per-biz hero widgets (~950 chars each)

### Work register
- 8 site_fix_404 items BLOCKED awaiting human disposition

---

## Re-run / add-a-business pattern

```sql
insert into cc.business_first_30s_content
  (business_slug, hero_claim, primary_cta_label, primary_cta_url, proof_snippet, first_widget_slug, status)
values ('<slug>', '<claim>', '<cta>', '<url>', '<proof>', '<slug>-hero', 'SHIPPED');
```

Then re-run `15_per_biz_hero_widgets.sql` (idempotent). View auto-promotes to READY.

---

*All numbers queryable live from Supabase · bridge zdgnab3py0 · S1 lzfgigiyqpuuxslsygjt*  
*Generated 2026-04-21 22:44 UTC*
