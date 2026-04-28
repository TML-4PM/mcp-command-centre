# Weekly Slack Ops Audit and Control Surface

Status: PARTIAL until a real Slack post, Supabase write, Bridge invocation, and GitHub receipt are all proven.

## Purpose

This system turns weekly operating hygiene into a machine-readable, Slack-visible, GitHub-receipted, Supabase-backed control loop.

Slack is not the source of truth. Slack is the attention and control surface. Supabase is the truth layer. GitHub is the durable receipt and build record. Bridge is runtime execution.

## Weekly Audit Scope

The weekly audit must inspect and report:

1. Known local system errors, issues, and operating quirks.
2. New blockers discovered during the week.
3. Jobs that did not fire, including cron, EventBridge, GitHub Actions, and Bridge-triggered jobs.
4. Bridge invocation failures and schema drift.
5. GitHub receipt gaps.
6. Supabase write failures, RLS issues, and missing migration state.
7. Browser, bookmark, OneTab, and tab-ingestion backlog.
8. Cross-LLM thread fragmentation.
9. Slack routing failures and alert noise.
10. Revenue, partner, and execution opportunities.
11. Proof gaps where something is claimed as done but no machine evidence exists.
12. Kill list items: stale, duplicate, dead, or low-signal work.
13. Double-down items: working systems, strong opportunities, or compounding assets.
14. Automation candidates: repeated manual actions that should be moved to Bridge / Lambda / GitHub Actions.

## Known Baseline Issues

- Cron / EventBridge jobs have previously failed silently.
- Scheduled work needs heartbeat logging and auto-repair.
- Bridge envelopes must be normalised around `action`, `function_name`, `invocation_type`, `payload`, and `metadata`.
- Human-readable chat closure has not always been converted into durable artefacts.
- Cross-LLM state remains fragmented across ChatGPT, Claude, Perplexity, Gemini, Grok, and other tools.
- Browser tabs and bookmarks need structured extraction rather than manual memory.
- Slack free tier cannot be treated as memory.
- Reality Ledger status must remain PARTIAL until execution evidence exists.

## State Taxonomy

Every audit item must be classified as one of:

- FLOW: normal, no action needed.
- DRIFT: degrading or stale, but not blocked.
- BLOCKED: execution cannot continue without fix, credential, or external dependency.
- OPPORTUNITY: commercial, strategic, research, or leverage signal.
- PROOF_GAP: claim without evidence.

## Reality Status

Every output must also carry:

- REAL: executed, evidenced, replayable.
- PARTIAL: some artefacts exist, but end-to-end proof is missing.
- PRETEND: discussion or claim without machine evidence.

## Slack Channel Map

Recommended channels:

- `#command-centre`: weekly executive operating brief.
- `#alerts`: urgent failures only.
- `#drift`: stale systems, silent degradation, weak signals.
- `#proof-gap`: Reality Ledger breaches and unproven claims.
- `#execution-log`: GitHub, Bridge, deployment, and receipt events.
- `#opportunities`: revenue, partner, lead, and strategic signals.
- `#decisions`: short durable decisions only.

## What Goes Into Slack

- Weekly command-centre brief.
- Machine receipts.
- Blockers.
- Drift signals.
- Proof gaps.
- Revenue and partner opportunities.
- Exceptions that require human attention.

## What Stays Out of Slack

- Raw logs.
- Large reports.
- Full documents.
- Secrets.
- Long-running debates.
- Source-of-truth data.
- Anything that must survive Slack free-tier retention.

## Weekly Report Template

```text
WEEKLY OPS BRIEF — {{week_start}} to {{week_end}}

State:
- FLOW: {{flow_count}}
- DRIFT: {{drift_count}}
- BLOCKED: {{blocked_count}}
- OPPORTUNITY: {{opportunity_count}}
- PROOF GAP: {{proof_gap_count}}

Top blockers:
{{blockers}}

Known quirks still alive:
{{known_errors}}

Kill list:
{{kill_list}}

Double down:
{{double_down}}

Automation candidates:
{{automation_candidates}}

Evidence:
{{github_issue_url}}
```

## Universal Artifact Format

```json
{
  "artifact_id": "uuid",
  "source": "chatgpt|claude|perplexity|browser|email|github|bridge|supabase|local",
  "source_url": null,
  "title": "string",
  "artifact_type": "idea|action|risk|decision|blocker|receipt|report|system_state",
  "summary": "string",
  "key_points": [],
  "actions": [],
  "linked_businesses": [],
  "linked_systems": [],
  "status": "new|triaged|executing|blocked|done|killed",
  "state": "FLOW|DRIFT|BLOCKED|OPPORTUNITY|PROOF_GAP",
  "reality_status": "REAL|PARTIAL|PRETEND",
  "evidence_links": [],
  "owner": "machine|human|mixed",
  "hil_status": "none|touched|required",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Completion Gates

This system is not REAL until:

1. Supabase migration has run successfully.
2. Weekly audit runner executes and returns structured JSON.
3. Slack router posts at least one synthetic message to Slack.
4. GitHub receipt is created or updated by machine.
5. Reality Ledger entry or equivalent evidence record binds intent, execution, output, status, and evidence.
6. Re-run is possible with the same input and deterministic receipt structure.

## Operating Rule

No Slack message without evidence pointer. No completion claim without proof. No recurring workflow without a heartbeat and a failure path.
