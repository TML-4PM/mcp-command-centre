# Deploy Order

Apply in this exact order.

## 1. Supabase schema
Run:
- `supabase/001_core5_schema.sql`
- `supabase/002_seed.sql`

This creates the runtime tables, status enums, views, and initial agent pack seed.

## 2. Environment variables
Set for the Lambda/runtime:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `PERPLEXITY_API_KEY`
- `XAI_API_KEY`
- `TROY_STAGE_GATE_EMAIL`
- `DEFAULT_LOOP_MODE=continuous`
- `MAX_NO_PROGRESS_COUNT=3`
- `DEFAULT_STAGE_GATE_REQUIRED=true`

## 3. Deploy runtime
From `infra/` run:
- `serverless deploy`

This publishes the API Gateway + Lambda handler.

## 4. Register widget snippet
Execute `ui/sql_widget_snippet.sql` against Supabase to register the command-centre widget.

## 5. Wire site pages
Deploy the `ui/` components into the site or monorepo app surface.

## 6. Run first live test
Use:
- `payloads/run_ndis_strategy.json`

## 7. Verify reality conditions
A run is REAL only when:
- `core5_tasks` has the task row
- `core5_runs` has the run row
- `core5_agent_visits` contains each model pass
- `core5_outputs` contains intermediate and final outputs
- `core5_stage_gates` contains any required guidance events
- `core5_outputs.is_final = true` exists for completion

## 8. Operationalise
After the first real run:
- route intake UI to the API
- surface latest runs in the status page
- enable custodian-driven publish/close behavior
