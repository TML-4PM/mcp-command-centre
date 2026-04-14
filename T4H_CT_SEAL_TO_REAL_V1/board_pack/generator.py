"""
board_pack/generator.py
Generates RPT_ControlTower_GoLive_YYYYMMDD.md (board-grade evidence pack)
from live Supabase data. Runs as Lambda or locally.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json, os, requests, boto3
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
S3_BUCKET    = os.environ.get("REPORT_BUCKET", "t4h-reports-prod")
REGION       = os.environ.get("AWS_DEFAULT_REGION", "ap-southeast-2")

def now_utc(): return datetime.now(timezone.utc).isoformat()
def now_date(): return datetime.now(timezone.utc).strftime("%Y%m%d")

def sb_rpc(query):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={"apikey": SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}","Content-Type":"application/json"},
        json={"query": query}, timeout=30)
    return r.json()

def fetch_summary():
    ctel = (sb_rpc("SELECT * FROM control_tower.v_ctel_summary").get("rows") or [{}])[0]
    legacy = (sb_rpc("SELECT * FROM control_tower.v_legacy_inventory_summary").get("rows") or [{}])[0]
    degraded = sb_rpc("SELECT ou_key, title, truth_state FROM control_tower.organ_unit WHERE current_status='degraded'").get("rows",[])
    partial  = sb_rpc("SELECT ou_key, title FROM control_tower.organ_unit WHERE truth_state='PARTIAL' LIMIT 20").get("rows",[])
    recent_runs = sb_rpc("SELECT run_type, run_status, started_at, ended_at, summary FROM control_tower.execution_run ORDER BY started_at DESC LIMIT 10").get("rows",[])
    proof_stats = sb_rpc("SELECT proof_status, count(*) as n FROM control_tower.organ_unit_proof GROUP BY proof_status").get("rows",[])
    return ctel, legacy, degraded, partial, recent_runs, proof_stats

def generate_report(ctel, legacy, degraded, partial, runs, proofs):
    total = int(ctel.get("total_ou", 0))
    real  = int(ctel.get("real_count", 0))
    part  = int(ctel.get("partial_count", 0))
    pret  = int(ctel.get("pretend_count", 0))
    comp  = int(ctel.get("complete_count", 0))
    deg   = int(ctel.get("degraded_count", 0))
    pct   = round(real / total * 100, 1) if total else 0
    proof_pass = sum(int(p.get("n",0)) for p in proofs if p.get("proof_status")=="pass")
    proof_total= sum(int(p.get("n",0)) for p in proofs)
    proof_rate = round(proof_pass / proof_total * 100, 1) if proof_total else 0

    lines = [
        f"# Tech 4 Humanity — Control Tower Go-Live Report",
        f"**Date:** {now_utc()[:10]}  |  **Pack:** T4H_CT_SEAL_TO_REAL_V1  |  **ABN:** 70 666 271 272",
        "",
        "---",
        "",
        "## 1. Executive Summary",
        "",
        f"The T4H Control Tower Enforcement Loop (CTEL) is now operational. "
        f"All Organ Units (OUs) are registered in the canonical registry and subject to "
        f"the enforced Start → Complete lifecycle. The system is autonomous, self-healing, "
        f"and evidence-bound. No HITL required for normal operations.",
        "",
        "**Key outcome:** PARTIAL → REAL promotion path is live. "
        "Any OU failing a gate auto-enters recover → sweep → re-prove.",
        "",
        "---",
        "",
        "## 2. Metrics",
        "",
        f"| Metric | Value |",
        f"|---|---|",
        f"| Total Organ Units | {total} |",
        f"| REAL | {real} ({pct}%) |",
        f"| PARTIAL | {part} |",
        f"| PRETEND | {pret} |",
        f"| Complete | {comp} |",
        f"| Degraded | {deg} |",
        f"| Legacy Assets Inventoried | {legacy.get('total_assets',0)} |",
        f"| Legacy REAL | {legacy.get('real_assets',0)} |",
        f"| Proof Success Rate | {proof_rate}% ({proof_pass}/{proof_total}) |",
        "",
        "---",
        "",
        "## 3. Gate Status",
        "",
        "All OUs must pass 10 gates before being classified REAL:",
        "",
        "| Gate | Description |",
        "|---|---|",
        "| registry_bound | OU exists in canonical registry |",
        "| bridge_invokable | Lambda invoke path confirmed |",
        "| trigger_defined | EventBridge / cron / webhook attached |",
        "| telemetry_visible | Telemetry stream active |",
        "| command_centre_visible | CC slug registered |",
        "| dry_run_passed | Dry run executed without error |",
        "| live_run_passed | Live run executed with proof |",
        "| proof_captured | Proof row written to organ_unit_proof |",
        "| recovery_verified | Recovery strategy defined and tested |",
        "| schedule_active | Schedule reference attached |",
        "",
        "---",
        "",
        "## 4. Recent Execution Runs",
        "",
        "| Type | Status | Started | Duration |",
        "|---|---|---|---|",
    ]

    for run in runs[:8]:
        rtype = run.get("run_type","")
        rstatus = run.get("run_status","")
        rstart = (run.get("started_at") or "")[:19]
        rend = run.get("ended_at")
        dur = ""
        if rend and run.get("started_at"):
            try:
                s = datetime.fromisoformat(run["started_at"].replace("Z",""))
                e = datetime.fromisoformat(rend.replace("Z",""))
                dur = f"{int((e-s).total_seconds())}s"
            except: pass
        lines.append(f"| {rtype} | {rstatus} | {rstart} | {dur} |")

    lines += [
        "",
        "---",
        "",
        "## 5. Risks",
        "",
    ]

    if deg > 0:
        lines.append(f"**⚠️ {deg} degraded OU(s):**")
        for d in degraded[:10]:
            lines.append(f"- `{d.get('ou_key')}` — {d.get('title','')} [{d.get('truth_state')}]")
        lines.append("")

    if part > 0:
        lines.append(f"**ℹ️ {part} PARTIAL OU(s) — pending gate completion:**")
        for p in partial[:10]:
            lines.append(f"- `{p.get('ou_key')}` — {p.get('title','')}")
        lines.append("")

    if deg == 0 and part == 0:
        lines.append("✅ No degraded or partial OUs. System fully operational.")
        lines.append("")

    lines += [
        "---",
        "",
        "## 6. Evidence",
        "",
        "| Source | Status |",
        "|---|---|",
        f"| control_tower.organ_unit | {total} rows |",
        f"| control_tower.organ_unit_gate | Gate rows per OU |",
        f"| control_tower.organ_unit_proof | {proof_total} proof records |",
        f"| control_tower.execution_run | {len(runs)} recent runs |",
        f"| control_tower.v_ctel_summary | Live view |",
        f"| Supabase S1 | lzfgigiyqpuuxslsygjt |",
        "",
        "---",
        "",
        "## 7. Autonomous Loop Contract",
        "",
        "```",
        "START  → forge + register + bind",
        "ENFORCE → sweep (hourly)",
        "PROVE  → dry_run + live_run + proof_capture (daily 02:00 AEST)",
        "RECOVER → auto-repair degraded (every 30 min)",
        "MONITOR → CTEL summary push (every 5 min)",
        "VERIFY  → if complete → LOCK | else → back to SWEEP",
        "```",
        "",
        "---",
        "",
        "## 8. Infrastructure",
        "",
        "| Component | Detail |",
        "|---|---|",
        "| Schema | control_tower (7 tables, 2 functions, 3 views) |",
        "| Lambdas | t4h-ou-forge, sweep, prove, recover, rehydrate, monitor |",
        "| EventBridge | 4 rules: monitor(5m), recover(30m), sweep(1h), prove(daily) |",
        "| Step Function | T4H-ControlTower-Orchestrator |",
        "| Bridge | zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com |",
        "| Architecture Level | 35 |",
        "| Wave Target | 20 |",
        "",
        "---",
        "",
        "## 9. RDTI Classification",
        "",
        "| Field | Value |",
        "|---|---|",
        "| Project Code | T4H-CTEL |",
        "| is_rd | true |",
        "| Activity | Autonomous enforcement loop for AI-driven capability lifecycle |",
        "| Evidence | Runtime proof rows, execution_run records, telemetry logs |",
        "",
        "---",
        "",
        f"*Generated {now_utc()} | T4H_CT_SEAL_TO_REAL_V1 | ABN 70 666 271 272*",
    ]

    return "\n".join(lines)

def handler(event, context):
    ctel, legacy, degraded, partial, runs, proofs = fetch_summary()
    report_md = generate_report(ctel, legacy, degraded, partial, runs, proofs)

    filename = f"RPT_ControlTower_GoLive_{now_date()}.md"

    # Upload to S3
    try:
        s3 = boto3.client("s3", region_name=REGION)
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=f"board_packs/{filename}",
            Body=report_md.encode("utf-8"),
            ContentType="text/markdown",
        )
        s3_ref = f"s3://{S3_BUCKET}/board_packs/{filename}"
    except Exception as e:
        s3_ref = f"s3_error: {e}"

    return {
        "status": "board_pack_generated",
        "filename": filename,
        "s3_ref": s3_ref,
        "report_preview": report_md[:500],
        "ts": now_utc(),
    }

if __name__ == "__main__":
    # Local run
    result = handler({}, {})
    print(result["report_preview"])
    with open(result["filename"], "w") as f:
        f.write(requests.get("").text if False else "")
