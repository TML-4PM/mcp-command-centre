# Command Centre Task Patch

## Purpose
This patch adds the minimum control-plane wiring needed to stabilise Synal.

## Add to config.example.js
```js
window.COMMAND_CENTRE_CONFIG = {
  apiBase: "https://your-bridge.example.com",
  endpoints: {
    overview: "/api/v1/dashboard/overview",
    dailyScores: "/api/v1/dashboard/daily-scores",
    sweetSpots: "/api/v1/dashboard/sweet-spots",
    darkSpots: "/api/v1/dashboard/dark-spots",
    domains: "/api/v1/dashboard/domain-hotspots",
    patterns: "/api/v1/dashboard/repeat-without-outcome",
    alerts: "/api/v1/dashboard/alerts",
    runs: "/api/v1/dashboard/runs",
    runInference: "/api/v1/dashboard/run-inference",
    synalTasks: "/api/v1/dashboard/synal-tasks",
    synalProof: "/api/v1/dashboard/synal-proof",
    synalChains: "/api/v1/dashboard/synal-agent-chains",
    taskRun: "/api/v1/synal/task-run",
    taskRefresh: "/api/v1/synal/task-refresh",
    autoExecute: "/api/v1/synal/auto-execute"
  },
  auth: {
    mode: "bearer",
    tokenStorageKey: "wfai_command_centre_token"
  }
};
```

## Add nav items
- Tasks
- Proof
- Chains

## Add views
### Tasks view
Columns:
- title
- source_type
- priority
- status
- surface
- source_app
- created_at

Row actions:
- Approve
- Run
- Dismiss
- Auto Execute

### Proof view
Columns:
- task_id
- title
- proof_type
- proof_status
- created_at
- verified_at

### Chains view
Columns:
- chain_key
- task_id
- chain_status
- current_step
- total_steps
- updated_at
