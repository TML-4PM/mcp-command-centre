# Wave20 — First 30s Closer

**Milestone:** 0 → 9 READY in one pass  
**Canonical change:** `t4h_canonical_changes.id=234` · severity HIGH · broadcast_ok=true  
**Snapshot:** 2026-04-21 19:34 UTC

---

## State pipeline

| State | n |
|---|---|
| LIVE_NO_CONTENT | 25 |
| MISSING | 16 |
| READY | 9 |
| DOMAIN_ONLY | 8 |

**Total tracked:** 58  
**READY:** 9

---

## 9 READY businesses

| Business | Landing | Hero | CTA | Widget slug |
|---|---|---|---|---|
| **Apex Predator Insurance** | `apexpredatorinsurance.com` | Insurance for the risks insurers ignore | Get a quote | `apex-hero-quote` |
| **AquaMe** | `www.aquame.com.au` | Water health for Australian homes | Test my water | `aquame-hero-test` |
| **Augmented Humanity Coach** | `augmentedhumanity.coach` | AI coaching that remembers your last session | Try a 2-minute coaching moment | `ahc-hero-try` |
| **ConsentX** | `consentx.org` | Consent logging that stands up in court | See a live consent flow | `consentx-hero-demo` |
| **CV Engine** | `cv.tech4humanity.com` | A CV that passes the first ATS in 30 seconds | Score my CV | `cv-hero-score` |
| **HoloOrg** | `—` | Run your business with a team of AI specialists | Meet your agent stack | `holoorg-hero-meet` |
| **Property Decision Pack** | `property-decision-pack-web.vercel.app` | Know if the property is actually worth it | Build a decision pack | `pdp-hero-build` |
| **SmartPark** | `smartpark.tech4humanity.com` | Parking that pays for itself | See how it works | `smartpark-hero-how` |
| **WorkFamilyAI** | `workfamilyai.org` | Your AI work family — like colleagues, not chatbots | Pick your family | `wfai-hero-pick` |


---

## Architecture

**Authoring table:** `cc.business_first_30s_content`  
Columns: `business_slug, hero_claim, primary_cta_label, primary_cta_url, proof_snippet, first_widget_slug, status, author, created_at, updated_at, shipped_at, notes`

**Lifecycle:** `DRAFT` → `AUTHORED_PENDING_SHIP` → `SHIPPED` → view promotes to `READY`

**Per-biz hero widget template:** generated from content table via `format()` in `15_per_biz_hero_widgets.sql`. One slug per business, data-driven. Re-running the generator is idempotent — widgets rebuild with latest content.

**View logic:** `cc.v_customer_first_30s_v2` now joins `t4h_ui_snippet` on explicit `first_widget_slug` pointer (no more fragile prefix matching). READY requires: live_ok + all 4 content fields populated + active widget exists + content_status='SHIPPED'.

**Dashboard widget:** `wave20-first-30s-closer` (3,140 chars) — pipeline tracker with H/C/P/W column per business and 6-state bar chart.

---

## Re-generation pattern

To add a new business to READY in one step:

```sql
insert into cc.business_first_30s_content
  (business_slug, hero_claim, primary_cta_label, primary_cta_url, proof_snippet, first_widget_slug, status)
values ('<slug>', '<claim>', '<cta>', '<url>', '<proof>', '<slug>-hero', 'SHIPPED');

-- then regenerate widget via 15_per_biz_hero_widgets.sql (idempotent insert)
```

The view auto-promotes to READY as soon as the hero widget exists + status='SHIPPED'.

---

## Next slice

25 businesses in `LIVE_NO_CONTENT` — same playbook applies. Author hero/CTA/proof per business, ship, regenerate widgets, view auto-promotes.

Query the next 10 by priority:

```sql
select business_slug, business_name, landing_url, group_id
from cc.v_customer_first_30s_v2
where first_30s_state_v2='LIVE_NO_CONTENT'
order by group_id, business_name
limit 10;
```

---

*Every number above is queryable live from Supabase — no hardcoded counts.*  
*Generated 2026-04-21 19:34 UTC · bridge zdgnab3py0 · S1 lzfgigiyqpuuxslsygjt*
