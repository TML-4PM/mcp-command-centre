# Universal Agent Contract deployment bundle

This pack installs a bridge-first, Supabase-controlled control plane for cross-LLM agent execution.

It includes:
- agent identity, tool contracts, orchestration, memory, execution logging
- verification, reality classification, policy gates, self-healing runbooks
- standard knowledge registration and build-time enforcement
- Command Centre enforcement and integrity widgets
- nightly integrity + remediation sweep
- CI fail-fast gate
- bridge contract YAMLs

## Target
- Supabase project: `pflisxkcxbzboxwidywf`
- Repo: `TML-4PM/mcp-command-centre`

## Folder layout
- `001_schema_core.sql`
- `002_seed_and_runtime.sql`
- `003_standard_knowledge_and_enforcement.sql`
- `004_command_centre_and_integrity.sql`
- `005_ci_and_remediation.sql`
- `006_bootstrap_and_smoke_tests.sql`
- `APPLY_ORDER.md`
- `bridge/*`
- `.github/workflows/universal-agent-contract-gate.yml`

## What this enforces
- no agent outside `ops_agent_contract.agent_identity`
- no tool outside `ops_agent_contract.tool_contract`
- no REAL without evidence
- PRETEND cannot complete
- high-risk actions require approval
- nightly integrity is mandatory
- remediation debt is visible
- CI can hard-block unsafe state

## Recommended scheduler
- 02:10 Australia/Sydney: integrity only
- 02:20 Australia/Sydney: integrity + remediation

## Apply
Follow `APPLY_ORDER.md` in sequence. Run smoke tests after deploy.
