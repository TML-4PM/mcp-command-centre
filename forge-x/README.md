# FORGE-X — LLM Forensic Recovery + Execution Engine

FORGE-X is the autonomous cleanup, recovery, validation, and monetisation pipeline for LLM chat history, unfinished actions, lost code, ideas, and completion claims.

## Mission

Recover value from LLM conversations and execution traces by turning unstructured chat history into validated, reusable, deployable, and monetisable assets.

## Operating rule

No claim is REAL until it is evidence-bound. Every chat fragment becomes an asset, a task, a claim, or an archive item. Every useful item is assigned to a dynamic business/product registry, not hardcoded business names.

## Pod set

### POD-A — Ingest + Structure
Pulls chats, repos, Bridge logs, Supabase rows, file drops, and external exports into a canonical raw store.

### POD-B — Classify + Link
Classifies fragments into code, task, idea, claim, asset, instruction, product, action, or evidence. Links related fragments across sessions.

### POD-C — Merge + Reconstruct
Deduplicates repeated ideas, merges code fragments, reconstructs partial systems, and identifies highest-confidence asset families.

### POD-D — Reality + Execution
Validates claims against GitHub, Supabase, Bridge, URLs, and logs. Writes REAL / PARTIAL / PRETEND status into the Reality Ledger and creates execution work.

### Embedded engines
- Auto-Rebuilder: completes missing logic and wraps deployable assets.
- Reality Checker: checks GitHub, URLs, Supabase, APIs, Bridge logs, and evidence.
- Value Engine: scores reuse, revenue, speed, and strategic fit.

## Flow

```text
INGEST -> CLASSIFY -> LINK -> MERGE -> VALIDATE -> REBUILD -> VALUE -> EXECUTE -> PROVE
```

## One-off and ongoing pod IDs

- `POD_SET_ALPHA_FULL_FORENSIC_SWEEP` — one-off historical cleanup.
- `POD_SET_OMEGA_CONTINUOUS_RECOVERY_LOOP` — ongoing daily recovery and validation.

## Runtime states

- RAW
- CLASSIFIED
- LINKED
- RECONSTRUCTED
- VALIDATED
- QUEUED
- EXECUTED
- PROVEN
- ARCHIVED
- KILLED

## Reality states

- REAL — runtime/evidence verified.
- PARTIAL — some artefacts exist but incomplete proof.
- PRETEND — claim was made but evidence is absent or false.

## Deployment files

- `sql/001_forge_x_schema.sql` — Supabase/Postgres schema.
- `config/forge-x.config.json` — pod config and autonomy tiers.
- `bridge/forge-x.bridge-payloads.json` — Bridge invocation templates.
- `runner/forge_x_runner.py` — executable Python runner skeleton.
- `docs/FORGE_X_OPERATING_PROCESS.md` — full business process.

## Immediate deployment

1. Apply SQL schema to Supabase.
2. Register FORGE-X in Command Centre as an autonomous recovery system.
3. Start POD_SET_ALPHA against exported chat/history sources.
4. Run POD_SET_OMEGA daily thereafter.
5. Treat all prior “done/pushed/complete” claims as PARTIAL until validated.
