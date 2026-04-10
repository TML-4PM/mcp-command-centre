# Default Bridge Runner Pack

Use the repo-pinned pack for this deployment.

Canonical source of truth
- `bridge/payloads/github/bridge_runner_pack_repo_pinned_20260410.yaml`
- `bridge/payloads/github/bridge_runner_pack_repo_pinned_20260410.json`

Required target
- Repository: `TML-4PM/mcp-command-centre`
- Branch: `main`
- Target mode: `github_repo_only`

Reason
- Replaces ambiguous target routing such as `github_or_bridge_runner`
- Forces deterministic write path into the command-centre repo
- Keeps Control Tower EventBridge Autofix deployments pinned to this repo

Operational rule
- Treat the repo-pinned pack above as the default invocation envelope for this bridge runner pack.
- Do not use the older payload files unless they are rewritten to include explicit repo pinning.
