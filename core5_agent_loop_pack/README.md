# Core 5 Continuous Multi-LLM Loop Pack

Production-ready handoff pack for a continuous document-completion loop spanning GPT, Claude, Grok, and Perplexity with a Digital Custodian control layer, Troy stage gates, Supabase truth binding, and a bridge-executable runtime.

## What this pack contains

- `docs/CORE5_CONTINUOUS_LOOP_SPEC.md` — full operating spec and acceptance criteria
- `docs/AGENT_CONTRACT.yaml` — canonical machine-readable contract
- `supabase/001_core5_schema.sql` — schema, enums, views, and RLS scaffolding
- `supabase/002_seed.sql` — initial seed data for the core 5 pack
- `lambda/core5_loop_handler.py` — bridge-ready Lambda runtime
- `lambda/requirements.txt` — runtime dependencies
- `infra/serverless.yml` — deployment shape for AWS Lambda + API Gateway
- `payloads/run_ndis_strategy.json` — first real test payload
- `payloads/run_site_readiness.json` — site readiness validation payload
- `payloads/stage_gate_approval.json` — approval-stage payload example
- `ui/intake_page.tsx` — Vercel intake page shell
- `ui/status_page.tsx` — Vercel status and evidence page shell
- `ui/sql_widget_snippet.sql` — Command Centre widget snippet registration example
- `docs/DEPLOY_ORDER.md` — exact deployment order
- `docs/OPERATIONS_RUNBOOK.md` — support, monitoring, recovery, and escalation

## Target end state

A real system that:
1. accepts a task
2. pulls context from Google Drive, Supabase, and prior structured chat context
3. routes the task across GPT, Claude, Perplexity, and Grok in a configurable loop
4. uses the Digital Custodian to detect conflicts, duplication, missing evidence, and weak reasoning
5. pauses only at defined stage gates for Troy guidance, approvals, or keys
6. stores every pass, artefact, issue, and decision in Supabase
7. publishes progress and final output into the site/control-plane layer
8. produces runtime proof and closure evidence

## Not claimed as already done

This pack is deployable and bridge-ready, but it is not a claim that the live loop is already deployed in your environment. Secrets, provider endpoints, keys, and live infrastructure binding still need to be applied.

## Required environment variables

See `infra/serverless.yml` and `lambda/core5_loop_handler.py` for the full set. Minimum:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`
- `PERPLEXITY_API_KEY`
- `TROY_STAGE_GATE_EMAIL` or equivalent notification route
- `DRIVE_CONNECTOR_MODE` and connector auth if using direct retrieval outside the bridge

## Success definition

The system is only REAL when a task run shows:
- each agent visit logged
- custodian review logged
- stage-gate event raised where required
- final output stored
- evidence attached
- site/control-plane surface updated
