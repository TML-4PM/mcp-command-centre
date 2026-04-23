# FLOW Autonomy Profiles

FLOW autonomy profiles define how each business is allowed to behave inside the same shared FLOW engine.

The engine stays the same.
The operating posture changes by business.

## Why this exists

Not every business should run with the same level of automation, approval, escalation, or customer exposure.

A novelty retail site, a service business, and a trust-heavy governance product should not all behave the same way.

Autonomy profiles solve that by setting default rules per business.

## Core idea

FLOW is the engine.
Autonomy profiles are the gearboxes.

Same engine.
Different driving modes.

## Profile levels

### 1. Manual
Humans do almost everything.

System can:
- log
- remind
- surface pressure
- show stale items

Use when:
- business is early
- judgment is high
- proposition is still being shaped

### 2. Assisted
Humans lead. Agents prepare.

System can:
- draft next actions
- prepare onboarding
- suggest moves
- create summaries

Human approves stage movement.

Use when:
- workflow is emerging
- quality and tone matter

### 3. Gated
System can move most things, but key transitions need approval.

System can:
- create and update items
- move safe stages
- write logs
- detect pressure

Human approves:
- commitments
- customer-facing transitions
- pricing-sensitive changes

Use when:
- process is repeatable
- risk still exists

### 4. Autonomous
System runs most of the flow by default.

System can:
- ingest events
- create work
- move stages
- trigger onboarding
- chase stale items
- create follow-up loops

Human steps in on exceptions.

Use when:
- process is stable
- risk is manageable
- speed matters

### 5. Protected
Automation is deliberately constrained.

System can:
- observe
- prepare
- log
- recommend

Human must approve:
- consent transitions
- identity actions
- regulated or trust-sensitive moves

Use when:
- governance matters
- trust matters
- legal or ethical control matters

## Profile fields

Each profile should define:

```text
business_key
profile_name
default_trigger_modes
default_autonomy_mode
allowed_auto_stage_transitions
required_human_approval_stages
pressure_rules
miss_rules
surface_rules
logging_rules
escalation_rules
expansion_rules
```

## Recommended profile mapping for current ecosystem

## CORE
- Tech 4 Humanity → GATED
- WorkFamilyAI → GATED_TO_AUTONOMOUS
- Augmented Humanity Coach → GATED
- HoloOrg → GATED_PROTECTED

## SIGNAL
- GC-BAT Core → PROTECTED
- ConsentX → PROTECTED
- Far-Cage → PROTECTED
- MyNeuralSignal → PROTECTED
- NEUROPAK → PROTECTED_GATED
- RATPAK → GATED
- LifeGraph Plus → PROTECTED
- AI Olympics → AUTONOMOUS

## MISSION
- Mission Critical → PROTECTED
- Outcome Ready → GATED
- SmartPark → AUTONOMOUS_GATED
- MedLedger → PROTECTED
- AquaMe → GATED

## RETAIL / ENTRY
- Enter Australia → AUTONOMOUS
- APAC Just Walk Out → AUTONOMOUS_GATED
- Vuon Troi → AUTONOMOUS
- JustPoint → AUTONOMOUS
- XCES → GATED
- House of Biscuits → AUTONOMOUS

## FUN / SIGNAL SURFACE
- Apex Predator Insurance → AUTONOMOUS
- Extreme Spotto → AUTONOMOUS
- AI Oopsies → AUTONOMOUS
- Rhythm Method → GATED_TO_AUTONOMOUS
- GirlMath → AUTONOMOUS
- New Business 1 → MANUAL
- New Business 2 → MANUAL

## Suggested schema

```sql
create table if not exists public.flow_autonomy_profiles (
  id uuid primary key default gen_random_uuid(),
  business_key text not null,
  profile_name text not null,
  default_autonomy_mode text not null,
  default_trigger_modes jsonb not null default '[]'::jsonb,
  allowed_auto_stage_transitions jsonb not null default '[]'::jsonb,
  required_human_approval_stages jsonb not null default '[]'::jsonb,
  pressure_rules jsonb not null default '{}'::jsonb,
  miss_rules jsonb not null default '{}'::jsonb,
  surface_rules jsonb not null default '[]'::jsonb,
  logging_rules jsonb not null default '{}'::jsonb,
  escalation_rules jsonb not null default '{}'::jsonb,
  expansion_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_key)
);
```

## Outcome

This lets one shared FLOW engine operate safely across many businesses without forcing every business into the same automation posture.
