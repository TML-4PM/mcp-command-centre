# Config Engine Onboarding Pack

This pack implements a configuration-driven operating model for repeatable business, product, customer, role, booking, inbox, and integration setup.

## Purpose

Turn freeform onboarding and build requests into structured intake -> config -> generation -> runtime binding.

## Included

- GitHub issue-form front door templates
- Dropdown taxonomy and default agent map
- Example product configs for Tradies AI and School AI
- Supabase registry and view SQL
- Bridge closure record and status record

## Execution model

1. GitHub issue form captures structured request
2. Runner or generator parses issue body into canonical config
3. Config is validated against required sub-cards and object schema
4. Outputs are generated:
   - contract pack
   - onboarding pack
   - inbox routing config
   - booking flow config
   - agent assignment map
   - dashboard state
5. Generated config is written to Supabase registries
6. Runtime bindings are applied for inbox, Cal.com, Stripe, and other integrations

## Core rule

Nothing new starts from a blank page.
Everything starts from hierarchy + sub-cards + config.

## Minimum live gates

- required sub-cards attached
- owner assigned
- agent assignments set
- inbox configured if relevant
- booking configured if relevant
- evidence hooks present
- migration audit completed for retro-onboarded systems

## Files

- `.github/ISSUE_TEMPLATE/*.yml`
- `packs/config-engine-onboarding/config/*.yml`
- `packs/config-engine-onboarding/examples/*.yml`
- `packs/config-engine-onboarding/supabase/*.sql`
- `packs/config-engine-onboarding/bridge/*.yml`
