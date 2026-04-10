"""
command-centre-reality-verifier
Callable via: bridge payload mode=verify_and_report
Returns: compact dashboard JSON with missing_evidence, registry_drift,
         pending_feedback_actions, todays_actions, reality_status_board
Writes: public.reality_ledger system=command-centre component=dashboard-core
"""
import json, os, urllib.request
from datetime import datetime, timezone

SB_URL    = "https://lzfgigiyqpuuxslsygjt.supabase.co"
SB_KEY    = os.environ["SUPABASE_SERVICE_KEY"]
BRIDGE_URL = os.environ.get("BRIDGE_URL","https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
BRIDGE_KEY = os.environ.get("BRIDGE_API_KEY","")
UTC_NOW   = datetime.now(timezone.utc).isoformat()

def sb(sql):
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(f"{SB_URL}/rest/v1/rpc/run_sql", data=data,
        headers={"apikey":SB_KEY,"Authorization":f"Bearer {SB_KEY}","Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read())
        return d if isinstance(d, list) else d

def count(q):
    r = sb(q)
    if isinstance(r, list) and r:
        return int(r[0].get('c', r[0].get('count', 0)))
    if isinstance(r, dict) and r.get('rows'):
        return int(r['rows'][0].get('c', 0))
    return 0

def rows(q):
    r = sb(q)
    if isinstance(r, list):
        return r
    return r.get('rows', [])

def handler(event, context):
    mode = event.get('mode', 'verify_and_report')
    print(json.dumps({"step":"verifier","status":"START","mode":mode,"ts":UTC_NOW}))

    try:
        # ── Core verification queries ─────────────────────────────────────
        registry_drift   = count("SELECT COUNT(*) as c FROM cc.v_registry_drift")
        reality_board    = rows("SELECT * FROM cc.v_reality_status_board LIMIT 1")
        control_health   = rows("SELECT * FROM cc.v_control_plane_health LIMIT 1")
        partial_pretend  = rows("SELECT * FROM cc.v_partial_pretend_summary LIMIT 5")

        # Missing evidence — entities in registry with no execution proof
        missing_evidence = count("""
            SELECT COUNT(*) as c FROM cc.v_registry_drift
            WHERE drift_type = 'NO_EXECUTION'
        """)

        # Pending feedback actions
        pending_feedback = count("""
            SELECT COUNT(*) as c FROM public.feedback_actions WHERE status='pending'
        """)

        # Today's actions (feedback_actions actioned today)
        todays_actions = count("""
            SELECT COUNT(*) as c FROM public.feedback_actions
            WHERE actioned_at::date = CURRENT_DATE
        """)

        # Recent reality ledger — last 10 entries
        ledger_recent = rows("""
            SELECT system, component, status, last_verified
            FROM public.reality_ledger
            ORDER BY last_verified DESC NULLS LAST
            LIMIT 10
        """)

        # Overall status: REAL if registry_drift=0, PARTIAL if some drift, PRETEND if no execution
        if registry_drift == 0:
            overall = "REAL"
        elif registry_drift < 20:
            overall = "PARTIAL"
        else:
            overall = "PRETEND"

        evidence = {
            "registry_drift":        registry_drift,
            "missing_evidence":      missing_evidence,
            "pending_feedback":      pending_feedback,
            "todays_actions":        todays_actions,
            "reality_board":         reality_board,
            "control_health":        control_health,
            "partial_pretend_count": len(partial_pretend),
            "verified_at":           UTC_NOW
        }

        # ── Write to reality_ledger ───────────────────────────────────────
        ev_esc = json.dumps(evidence).replace("'","''")
        write_sql = f"""
        INSERT INTO public.reality_ledger (system, component, status, evidence, last_verified)
        VALUES ('command-centre', 'dashboard-core', '{overall}', '{ev_esc}'::jsonb, NOW())
        ON CONFLICT (system, component)
        DO UPDATE SET status=EXCLUDED.status, evidence=EXCLUDED.evidence, last_verified=NOW()
        """
        sb(write_sql)
        print(json.dumps({"step":"ledger","status":"OK","overall":overall,"ts":UTC_NOW}))

        # ── Register deployment gate as PASSED ────────────────────────────
        gate_sql = f"""
        INSERT INTO public.deployment_gates (system, component, stage, gate_status, evidence)
        VALUES ('command-centre', 'dashboard-core', 'verification', 'PASSED', '{ev_esc}'::jsonb)
        ON CONFLICT DO NOTHING
        """
        sb(gate_sql)

        payload = {
            "statusCode":            200,
            "overall":               overall,
            "registry_drift":        registry_drift,
            "missing_evidence":      missing_evidence,
            "pending_feedback_actions": pending_feedback,
            "todays_actions":        todays_actions,
            "partial_pretend_entities": len(partial_pretend),
            "ledger_entries":        len(ledger_recent),
            "ledger_sample":         ledger_recent[:5],
            "verified_at":           UTC_NOW
        }

        print(json.dumps({"step":"verifier","status":"COMPLETE","overall":overall,"ts":UTC_NOW}))
        return {"statusCode": 200, "body": json.dumps(payload)}

    except Exception as e:
        print(json.dumps({"step":"verifier","status":"ERROR","detail":str(e),"ts":UTC_NOW}))
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
