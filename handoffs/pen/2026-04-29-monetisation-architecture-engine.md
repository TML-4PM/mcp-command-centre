# PEN Handoff — Monetisation Architecture Engine

Date: 2026-04-29 Australia/Sydney
Source: ChatGPT conversation + uploaded SKU CSV
Reality state: PARTIAL / READY-FOR-PEN
Owner: Troy Latter / Tech 4 Humanity
Target: PEN → DEV → PROD via Command Centre

## Source summary
The uploaded CSV defines 6 monetisation themes and 48 SKU rows across L0-L7 tiers:
- T1: 1000-Agent OS
- T2: Autonomous Enterprise
- T3: Hold the Ugly Mirror
- T4: AISS Novel Thinking
- T5: Strip and Compound
- T6: Solo Founder Compliance Gates

Each theme already maps to a value ladder:
L0 lead magnet, L1 newsletter, L2 article, L3 book, L4 workbook, L5 course, L6 consulting, L7 white-label distribution.

## Core issue
The current asset is a strong catalogue, not yet a monetisation engine. Most rows are PRETEND or PARTIAL. The missing layers are:
- dependency sequencing
- funnel path enforcement
- bundle model
- partner/white-label distribution engine
- Stripe product/price/payment-link binding
- Command Centre telemetry
- Reality Ledger evidence binding

## Target build
Build the Monetisation Architecture Engine as a reusable system that turns thinking/IP assets into sellable, trackable revenue units.

Lifecycle:
1. ingest theme/SKU source rows
2. normalise into canonical SKU registry
3. bind each SKU to funnel stage, bundle, channel, price band, and proof state
4. generate missing activation tasks for PRETEND/PARTIAL rows
5. create Stripe products/prices/payment links once approved/ready
6. expose Command Centre widget showing status, revenue readiness, next actions, and blocked proof gates
7. bind every activation event to Reality Ledger

## Product pipelines

### Pipeline 1 — Founder Survival Stack
Themes: T3 Hold the Ugly Mirror, T5 Strip and Compound, T6 Solo Founder Compliance Gates
Primary offer: founder survival / compliance / triage system
Suggested price: AUD 299-999 self-serve, AUD 2k-10k advisory
Flow:
L0 honest questions → L4 Mirror Diagnostic → L4 Strip Checklist → L4 Compliance Gate Runbook → L5 course → L6 advisory

### Pipeline 2 — Agent Builder Stack
Themes: T1 1000-Agent OS, T4 AISS Novel Thinking
Primary offer: agent pod design and AI thinking-layer capability
Suggested price: AUD 999-2,999 course/workbook bundle, AUD 5k-25k implementation
Flow:
L0 first 30 days → L4 pod workbook → L5 first agent pod course → AISS canvas/course → L6 implementation

### Pipeline 3 — Enterprise Reality Stack
Theme: T2 Autonomous Enterprise
Primary offer: board/enterprise reality audit
Suggested price: AUD 5k-25k audit/advisory
Flow:
L0 REAL/PARTIAL/PRETEND checklist → L4 diagnostic workbook → L6 Reality Audit → L7 board advisor white-label pack

### Pipeline 4 — Partner Distribution Stack
Themes: all, strongest start T6 L7 accountant SKUs and T3/T5 white-label packs
Primary offer: revenue-in-a-box for accountants, consultants, advisors, agencies
Suggested price: AUD 49-249/month per partner/client pack + setup fee
Flow:
Partner landing page → partner diagnostic → white-label pack → client SKU library → recurring usage/reporting

## Supabase SQL DDL

```sql
create table if not exists public.monetisation_themes (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null unique,
  theme text not null,
  strategic_role text,
  pipeline_key text,
  state text not null default 'PRETEND' check (state in ('PRETEND','DESIGNED','PARTIAL','REAL','RETIRED')),
  priority_week int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.monetisation_skus (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null references public.monetisation_themes(theme_id),
  sku_tier text not null,
  sku_name text not null,
  format text not null,
  price_low numeric not null default 0,
  price_high numeric not null default 0,
  channel text,
  priority_week int,
  state text not null default 'PRETEND' check (state in ('PRETEND','DESIGNED','PARTIAL','REAL','RETIRED')),
  feedstock_source text,
  stripe_product_id text,
  stripe_price_id text,
  stripe_payment_link text,
  landing_slug text,
  evidence_url text,
  activation_score int default 0 check (activation_score between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(theme_id, sku_tier, sku_name)
);

create table if not exists public.monetisation_bundles (
  id uuid primary key default gen_random_uuid(),
  bundle_key text not null unique,
  bundle_name text not null,
  pipeline_key text not null,
  target_buyer text not null,
  price_low numeric not null default 0,
  price_high numeric not null default 0,
  cadence text default 'one_off',
  state text not null default 'DESIGNED' check (state in ('PRETEND','DESIGNED','PARTIAL','REAL','RETIRED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.monetisation_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_key text not null references public.monetisation_bundles(bundle_key),
  sku_id uuid not null references public.monetisation_skus(id),
  sequence_order int not null default 1,
  required boolean not null default true,
  unique(bundle_key, sku_id)
);

create table if not exists public.monetisation_funnel_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  trigger_event text not null,
  from_tier text,
  to_tier text,
  action text not null,
  channel text,
  delay_hours int default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.monetisation_activation_tasks (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid references public.monetisation_skus(id),
  task_key text not null,
  task_title text not null,
  task_type text not null check (task_type in ('asset','landing_page','stripe','email','automation','widget','evidence','legal','partner')),
  state text not null default 'open' check (state in ('open','in_progress','blocked','done','cancelled')),
  owner_agent text default 'PEN',
  due_at timestamptz,
  evidence_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(sku_id, task_key)
);

create table if not exists public.monetisation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  theme_id text,
  sku_id uuid,
  bundle_key text,
  actor_type text default 'system',
  actor_id text,
  channel text,
  payload jsonb not null default '{}'::jsonb,
  reality_state text not null default 'PARTIAL' check (reality_state in ('PRETEND','PARTIAL','REAL')),
  evidence_url text,
  created_at timestamptz default now()
);
```

## Seed rows for bundles

```sql
insert into public.monetisation_bundles (bundle_key,bundle_name,pipeline_key,target_buyer,price_low,price_high,cadence,state)
values
('founder_survival_stack','Founder Survival Stack','founder','solo founders and small operators',299,999,'one_off','DESIGNED'),
('agent_builder_stack','Agent Builder Stack','builder','builders, agencies, operators',999,2999,'one_off','DESIGNED'),
('enterprise_reality_stack','Enterprise Reality Stack','enterprise','boards, executives, enterprise transformation teams',5000,25000,'engagement','DESIGNED'),
('partner_distribution_stack','Partner Distribution Stack','partner','accountants, consultants, advisors, agencies',49,249,'monthly','DESIGNED')
on conflict (bundle_key) do update set
  bundle_name = excluded.bundle_name,
  pipeline_key = excluded.pipeline_key,
  target_buyer = excluded.target_buyer,
  price_low = excluded.price_low,
  price_high = excluded.price_high,
  cadence = excluded.cadence,
  state = excluded.state,
  updated_at = now();
```

## Activation scoring
Score each SKU out of 100:
- 20 source feedstock exists
- 20 final asset exists
- 15 landing page exists
- 15 Stripe product/price/payment link exists
- 10 funnel automation exists
- 10 evidence URL exists
- 10 conversion copy / CTA exists

REAL threshold: 80+ with evidence URL and Stripe/payment path.
PARTIAL threshold: 40-79.
PRETEND threshold: below 40 or no evidence.

## Command Centre widget requirements
Widget: `monetisation_engine_status`

Cards:
- Total SKUs: 48
- REAL / PARTIAL / DESIGNED / PRETEND counts
- Revenue-ready count
- Stripe-bound count
- Top 10 blocked SKUs by priority_week
- Pipeline readiness: founder, builder, enterprise, partner
- Next best actions for PEN

Table columns:
- theme
- sku_tier
- sku_name
- format
- price band
- channel
- state
- activation_score
- next task
- evidence_url

## PEN tasks

1. Create migration file:
`supabase/migrations/20260429_monetisation_engine.sql`

2. Create seed file:
`supabase/seeds/monetisation_engine_seed.sql`

3. Create import script:
`scripts/import_monetisation_skus.ts`

4. Create scoring script:
`scripts/score_monetisation_skus.ts`

5. Create Command Centre widget:
`widgets/monetisation_engine_status.html`

6. Create API routes:
- `GET /api/monetisation/summary`
- `GET /api/monetisation/skus`
- `POST /api/monetisation/import`
- `POST /api/monetisation/score`
- `POST /api/monetisation/create-stripe-products` gated and dry-run first

7. Create Reality Ledger event bindings:
- import_started
- import_completed
- sku_scored
- asset_created
- stripe_product_created
- landing_page_created
- sku_promoted_real

8. Create Stripe dry-run mapper:
Map only REAL-ready or owner-approved SKUs to products/prices. Do not create live Stripe products until dry-run output is reviewed or policy allows.

## Non-destructive execution rule
Do not delete or overwrite existing SKU tables if present. Create additive tables and views. If similar tables exist, create compatibility views or migration report before applying changes.

## Proof gates
PEN/DEV must return these receipts:
- migration applied or dry-run SQL validated
- seed import count equals expected row count
- summary endpoint returns counts
- widget renders with counts
- Reality Ledger has at least one import_completed evidence row
- Stripe dry-run produces product/price plan without live side effects

## Reality status
This handoff is REAL as a GitHub receipt once committed.
The monetisation engine remains PARTIAL until PEN/DEV applies migrations and returns proof receipts.
It must not be called COMPLETE or FINAL until runtime evidence exists.
