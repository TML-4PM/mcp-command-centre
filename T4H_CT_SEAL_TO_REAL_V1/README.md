# T4H Control Tower Enforcement Loop
## Pack: T4H_CT_SEAL_TO_REAL_V1

**Status:** LIVE  
**Wave:** 20 | **Architecture Level:** 35 | **HITL:** None  
**RDTI:** `is_rd=true`, `project_code=T4H-CTEL`  
**ABN:** 70 666 271 272

---

## What this is

The canonical closed-loop enforcement system for Tech 4 Humanity Organ Units (OUs).

Every capability built in T4H must pass through this loop exactly once, in order, before it is classified REAL:

```
START → forge → register → bind → sweep → prove → schedule → monitor → recover → VERIFY
                                                                                    ↓
                                                                       COMPLETE if all gates pass
                                                                       else → back to sweep
```

---

## Schema (Supabase S1: lzfgigiyqpuuxslsygjt)

**Schema:** `control_tower`

| Object | Type |
|---|---|
| organ_unit | Table — canonical OU record |
| organ_unit_gate | Table — 10-gate completion state |
| organ_unit_event | Table — lifecycle events |
| organ_unit_proof | Table — runtime proof records |
| organ_unit_dependency | Table — OU dependency graph |
| legacy_asset_inventory | Table — rehydrated legacy assets |
| execution_run | Table — sweep/prove/recover run log |
| fn_ou_is_complete | Function — gate AND check |
| fn_ou_recompute_status | Function — auto status promotion |
| v_ou_status | View — joined OU + gate state |
| v_ctel_summary | View — REAL/PARTIAL/PRETEND counts |
| v_legacy_inventory_summary | View — legacy asset classification |

---

## Lambda Pack

| Function | Purpose | Trigger |
|---|---|---|
| t4h-ou-forge | Create OU + gate + event | bridge/manual |
| t4h-ou-sweep | Evaluate gates, mark partial | EB: hourly |
| t4h-ou-prove | dry_run + live_run + proof | EB: daily 02:00 AEST |
| t4h-ou-recover | Repair degraded OUs | EB: every 30 min |
| t4h-ou-rehydrate | Inventory legacy assets | bridge/manual |
| t4h-ou-monitor | CTEL summary + CC push | EB: every 5 min |

---

## EventBridge Schedule

| Rule | Schedule | Target |
|---|---|---|
| CTEL-Monitor-5min | rate(5 minutes) | t4h-ou-monitor |
| CTEL-Recovery-30min | rate(30 minutes) | t4h-ou-recover |
| CTEL-Sweep-Hourly | rate(1 hour) | t4h-ou-sweep |
| CTEL-Prove-Daily | cron(0 16 * * ? *) | t4h-ou-prove |

---

## Completion Gate

All 10 must be true for an OU to be REAL:

```
registry_bound         ✓
bridge_invokable       ✓
trigger_defined        ✓
telemetry_visible      ✓
command_centre_visible ✓
dry_run_passed         ✓
live_run_passed        ✓
proof_captured         ✓
recovery_verified      ✓
schedule_active        ✓
truth_state = REAL     ✓
```

---

## Command Contract

| Command | Meaning |
|---|---|
| `finish it` | full loop: forge → ... → verify_complete |
| `complete it` | full loop + lock |
| `go` | execute_full_default_path |
| `test it` | validate + dry_run + telemetry + recovery |
| `run everything` | rehydrate → sweep → prove → execute eligible |
| `/rehydrate` | inventory all legacy assets |
| `/sweep` | evaluate gates on all OUs |
| `/prove` | dry + live run + proof capture |
| `/recover` | repair degraded, re-enter sweep |

---

## Bridge

```
POST https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke
x-api-key: [from cap_secrets]

{
  "fn": "t4h-ou-sweep",
  "payload": {
    "ou_key": "OU_example",
    "mode": "execute"
  }
}
```

---

## SREP Protocol

```
phase_1: discover   → lambdas, EB rules, registry entities, UI widgets
phase_2: classify   → REAL / PARTIAL / PRETEND
phase_3: gap_check  → all 10 gates
phase_4: rehydrate  → bind to OU, create gate row
phase_5: execute    → dry_run → live_run → proof_capture
seal_success: unswept_inventory = 0
```

---

*Generated: 2026-04-14 | TML-4PM/mcp-command-centre*
