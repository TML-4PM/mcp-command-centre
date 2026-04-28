# COAX-G /dominate Pack

## Thread
`COAX-LIVE-20260428-001`

## Purpose
Move COAX from a single federated execution request into a dominant operating layer across GPT, Claude, Perplexity, Bridge, GitHub, Supabase, and Command Centre.

## Reality Status
PARTIAL until the Bridge executes external Claude and Perplexity API calls and writes returned responses.

## Domination Doctrine
COAX-G is the single-threaded controller. It does not pretend to be the executor when it lacks runtime authority. It creates machine-readable dispatches, enforces proof, classifies reality, and refuses completion without receipts.

## Required End State
1. Every COAX event has a thread ID.
2. Every external LLM call is API-triggered, not manually pasted.
3. Every response is captured as raw payload and normalised payload.
4. Every run writes to GitHub.
5. Every run writes to Supabase.
6. Every run appears in Command Centre.
7. Every run is classified REAL, PARTIAL, PRETEND, or BLOCKED.
8. Every failed run creates a recovery instruction.
9. Every completed run creates a reusable pattern.
10. Every monetisable output is pushed into a revenue lane.

## Federated COAX Roles
- COAX-G: GPT controller, router, normaliser, closer.
- COAX-C: Claude synthesis, policy, reasoning, long-form design.
- COAX-P: Perplexity signal, research, external validation, source collection.
- COAX-B: Bridge executor, API caller, runtime receipt producer.
- COAX-D: Data custodian, Supabase ledger and replay layer.
- COAX-R: Revenue operator, offer/pricing/campaign extraction.

## Message Contract
```json
{
  "coax_thread_id": "COAX-LIVE-20260428-001",
  "from": "COAX-G",
  "to": "COAX-B",
  "action": "execute_federated_run",
  "mode": "AUTONOMOUS",
  "requires": [
    "claude_api_response",
    "perplexity_api_response",
    "supabase_log_rows",
    "github_receipt_files",
    "proof_md"
  ],
  "failure_policy": "retry_then_mark_partial_or_blocked",
  "no_pretend": true
}
```

## Completion Gate
A run is complete only when all of the following exist:

- `request.json`
- `coax-c.json`
- `coax-p.json`
- `merged.json`
- `proof.md`
- Supabase rows for each external system
- Reality classification = REAL

## GitHub Receipt Paths
```text
coax/runs/COAX-LIVE-20260428-001/request.json
coax/runs/COAX-LIVE-20260428-001/dominate.md
coax/runs/COAX-LIVE-20260428-001/coax-c.json
coax/runs/COAX-LIVE-20260428-001/coax-p.json
coax/runs/COAX-LIVE-20260428-001/merged.json
coax/runs/COAX-LIVE-20260428-001/proof.md
```

## Supabase Tables Required
```sql
create table if not exists coax_thread_registry (
  coax_thread_id text primary key,
  intent text not null,
  status text not null default 'captured',
  reality text not null default 'PARTIAL',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists coax_execution_log (
  id uuid primary key default gen_random_uuid(),
  coax_thread_id text not null references coax_thread_registry(coax_thread_id),
  agent text not null,
  system text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  status text not null default 'queued',
  reality text not null default 'PARTIAL',
  evidence jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists coax_reality_ledger (
  id uuid primary key default gen_random_uuid(),
  coax_thread_id text not null,
  classification text not null,
  evidence jsonb not null default '{}'::jsonb,
  decision text,
  created_at timestamptz default now()
);
```

## Bridge Invocation Envelope
```json
{
  "action": "invoke_function",
  "function_name": "coax_federated_runner",
  "invocation_type": "Event",
  "payload": {
    "coax_thread_id": "COAX-LIVE-20260428-001",
    "source_path": "coax/runs/COAX-LIVE-20260428-001/request.json",
    "mode": "execute",
    "require_all_responses": true,
    "write_github_receipts": true,
    "write_supabase_logs": true,
    "classify_reality": true
  },
  "metadata": {
    "source": "COAX-G",
    "priority": "HIGH",
    "autonomy": "AUTONOMOUS",
    "request_id": "COAX-LIVE-20260428-001"
  }
}
```

## Recovery Rules
- Missing Claude response: retry Claude once, then mark PARTIAL and create blocked note.
- Missing Perplexity response: retry Perplexity once, then mark PARTIAL and create blocked note.
- Missing Supabase write: retain GitHub proof and create data-repair instruction.
- Missing GitHub write: retain Supabase proof and create receipt-repair instruction.
- Missing both: mark PRETEND/BLOCKED and stop claims.

## Revenue Extraction
Every successful COAX run must extract:
- product affected
- buyer type
- immediate offer
- pricing hypothesis
- channel
- next sales action

## Command Centre Widget Shape
```json
{
  "slug": "coax-live-20260428-001",
  "title": "COAX Federated Execution",
  "state": "Awaiting Bridge Execution",
  "reality": "PARTIAL",
  "required_next_receipts": [
    "coax-c.json",
    "coax-p.json",
    "merged.json",
    "proof.md",
    "supabase rows"
  ]
}
```

## Operator Note
Do not claim this is REAL until Claude and Perplexity API responses are present as machine-created receipts. Current state is correctly PARTIAL with a GitHub dispatch receipt.
