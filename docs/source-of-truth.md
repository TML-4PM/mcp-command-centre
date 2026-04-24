# Source of Truth — AGL / Control Plane

## System layers

| Layer | Name | Role | Status |
|---|---|---|---|
| Dev factory | Symbio | Intake, build, reconstruction, messy recovery | Active |
| Pre-prod holding pen | Crucible | Hardening, validation, promotion proof | Locked |
| Prod brain | Synapse | Clean governed production control plane | Locked |

## Operating rule

All assets enter Symbio. Only proven, verified units promote through Crucible into Synapse.

## Closure ledger

Canonical closure ledger: https://github.com/TML-4PM/mcp-command-centre/issues/9

## Execution tiers

| Tier | Allowed | Examples |
|---|---|---|
| AUTO | Read, inspect, enqueue, create non-destructive docs/issues | inventories, audits, proof checks |
| LOG | Writes that are reversible and logged | GitHub docs/issues, ledgers |
| GATED | Dry-run required before execution | deploy, DB schema/RLS, production mutation |
| BLOCKED | Not executed here | payments, IAM, credentials, legal commitments |

## Definition of done

Done means verified, not claimed.

| Rule | Requirement |
|---|---|
| Observed state | Based on runtime/tool evidence, not assumption |
| System of record | Written to GitHub, Drive, Supabase, or another owned system |
| Evidence | Commit URL, issue URL, query result, deployment/build output, or bridge job ID |
| Idempotency | Re-running must not duplicate unsafe work |
| Safety | Archive over delete; dry-run before destructive/gated actions |
| Next action | Machine-readable and actionable |

## Failure report standard

```yaml
failure_id: string
occurred_at: timestamptz
system: string
candidate: string
status: failed | partial | blocked | recovered
error: string
impact: string
rollback: string
next: string
evidence:
  type: REAL | PARTIAL | PRETEND
  links: []
owner: string
```

## Bridge payload wrapper

```json
{
  "job_id": "uuid-or-human-stable-id",
  "source": "chatgpt.operator",
  "target": "bridge|github|supabase|vercel",
  "tier": "AUTO|LOG|GATED|BLOCKED",
  "intent": "close_open_candidate",
  "action": "inspect|enqueue|write_doc|dry_run|verify",
  "idempotency_key": "stable-key",
  "payload": {},
  "evidence_required": ["runtime_output", "commit_url", "query_result"],
  "rollback": "archive-or-revert-plan",
  "created_at": "2026-04-24T00:00:00Z"
}
```

## Open proof queue

| Proof | Target | Status |
|---|---|---|
| GitHub control repo write | `TML-4PM/mcp-command-centre` | Verified by commit creating this file |
| Vercel inventory | Vercel MCP | Pending read-only inspect |
| ConsentX recovery candidates | GitHub + Drive | Pending read-only sweep |
| Supabase queue/audit proof | Bridge/Supabase REST | Pending available execution path |
