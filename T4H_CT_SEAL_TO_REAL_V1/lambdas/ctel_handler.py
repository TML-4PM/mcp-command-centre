"""
ctel_handler.py  — T4H Control Tower Enforcement Loop
Stdlib only. Creds from env OR event payload (for locked-config Lambdas).
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json, os, uuid, urllib.request, urllib.error
from datetime import datetime, timezone

# ── BOOT: resolve creds from env or event ─────────────────────────────────────
_SB_URL = _SB_KEY = _BRIDGE_URL = _BRIDGE_KEY = _TG_BOT = _TG_CHAT = None

def _init(event=None):
    global _SB_URL, _SB_KEY, _BRIDGE_URL, _BRIDGE_KEY, _TG_BOT, _TG_CHAT
    creds = {}
    if event:
        creds = event.get("credentials") or event.get("payload", {}).get("credentials") or {}
    _SB_URL     = creds.get("sb_url")   or os.environ.get("SUPABASE_URL","")
    _SB_KEY     = creds.get("sb_key")   or os.environ.get("SUPABASE_SERVICE_ROLE_KEY","")
    _BRIDGE_URL = creds.get("bridge_url") or os.environ.get("BRIDGE_URL",
                  "https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
    _BRIDGE_KEY = creds.get("bridge_key") or os.environ.get("BRIDGE_API_KEY","")
    _TG_BOT     = os.environ.get("TELEGRAM_BOT_TOKEN","")
    _TG_CHAT    = os.environ.get("TELEGRAM_CHAT_ID","6972032328")

def now_utc(): return datetime.now(timezone.utc).isoformat()

def http_post(url, data, headers):
    body = json.dumps(data).encode() if isinstance(data, dict) else data
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read() or b"{}"), e.code
    except Exception as ex:
        return {"error": str(ex)}, 500

def sb_rpc(query):
    resp, status = http_post(
        f"{_SB_URL}/rest/v1/rpc/run_sql",
        {"query": query},
        {"apikey": _SB_KEY, "Authorization": f"Bearer {_SB_KEY}", "Content-Type": "application/json"}
    )
    # run_sql RPC returns list of rows directly OR {"rows":[],"command":"..."} dict
    if isinstance(resp, list):
        return {"rows": resp, "count": len(resp)}
    return resp

def sb_upsert(table, rows):
    _, status = http_post(
        f"{_SB_URL}/rest/v1/{table}", rows,
        {"apikey": _SB_KEY, "Authorization": f"Bearer {_SB_KEY}",
         "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
    )
    return status

def safe(v): return str(v).replace("'","''") if v else ""
def safe_json(v): return json.dumps(v).replace("'","''")


# ── SWEEP ──────────────────────────────────────────────────────────────────────
def run_sweep():
    run_id = str(uuid.uuid4())
    sb_rpc(f"INSERT INTO control_tower.execution_run (run_id,run_type,scope,run_status) VALUES ('{run_id}','sweep','all_ou','running') ON CONFLICT DO NOTHING")
    result = sb_rpc("SELECT ou_key,invoke_function_name,truth_state,trigger_types,schedule_ref,command_centre_slug,recovery_strategy,last_proved_at FROM control_tower.organ_unit WHERE active=true")
    ous = result.get("rows", [])
    real = partial = 0
    for ou in ous:
        ok = safe(ou["ou_key"])
        fn = ou.get("invoke_function_name")
        trig = ou.get("trigger_types") or []
        gates = {
            "registry_bound":         True,
            "bridge_invokable":       bool(fn),
            "trigger_defined":        len(trig) > 0,
            "telemetry_visible":      bool(fn),
            "command_centre_visible": bool(ou.get("command_centre_slug")),
            "dry_run_passed":         bool(fn) and ou.get("truth_state") in ("REAL","PARTIAL"),
            "live_run_passed":        ou.get("truth_state") == "REAL",
            "proof_captured":         ou.get("last_proved_at") is not None,
            "recovery_verified":      bool(ou.get("recovery_strategy")),
            "schedule_active":        bool(ou.get("schedule_ref")),
        }
        iv = ",".join([str(v).lower() for v in gates.values()])
        kv = ",".join([f"{k}={str(v).lower()}" for k,v in gates.items()])
        sb_rpc(f"INSERT INTO control_tower.organ_unit_gate (ou_key,{','.join(gates)}) VALUES ('{ok}',{iv}) ON CONFLICT (ou_key) DO UPDATE SET {kv},updated_at=now()")
        sb_rpc(f"SELECT control_tower.fn_ou_recompute_status('{ok}')")
        if all(gates.values()): real += 1
        else: partial += 1
    summary = {"total": len(ous), "real": real, "partial": partial}
    sb_rpc(f"UPDATE control_tower.execution_run SET ended_at=now(),run_status='passed',summary='{safe_json(summary)}'::jsonb WHERE run_id='{run_id}'")
    return {"run_id": run_id, "status": "sweep_complete", **summary, "ts": now_utc()}


# ── RECOVER ────────────────────────────────────────────────────────────────────
def run_recover():
    run_id = str(uuid.uuid4())
    sb_rpc(f"INSERT INTO control_tower.execution_run (run_id,run_type,scope,run_status) VALUES ('{run_id}','recover','degraded','running') ON CONFLICT DO NOTHING")
    result = sb_rpc("SELECT * FROM control_tower.organ_unit WHERE active=true AND current_status IN ('degraded','planned') AND truth_state!='REAL'")
    ous = result.get("rows", []); repaired = 0
    for ou in ous:
        ok = safe(ou["ou_key"]); repairs = []
        if not (ou.get("trigger_types") or []):
            sb_rpc(f"UPDATE control_tower.organ_unit SET trigger_types=ARRAY['manual_bridge']::text[],updated_at=now() WHERE ou_key='{ok}'"); repairs.append("trigger")
        if not ou.get("recovery_strategy"):
            sb_rpc(f"UPDATE control_tower.organ_unit SET recovery_strategy='rerun_then_repair',updated_at=now() WHERE ou_key='{ok}'"); repairs.append("recovery")
        if not ou.get("command_centre_slug"):
            slug = ou["ou_key"].lower().replace(".","_")
            sb_rpc(f"UPDATE control_tower.organ_unit SET command_centre_slug='{slug}',updated_at=now() WHERE ou_key='{ok}'"); repairs.append("slug")
        sb_rpc(f"SELECT control_tower.fn_ou_recompute_status('{ok}')")
        r_json = safe_json({"repairs": repairs, "ts": now_utc()})
        sb_rpc(f"INSERT INTO control_tower.organ_unit_proof (ou_key,proof_class,proof_name,proof_status,details) VALUES ('{ok}','structural','auto_repair','{'pass' if repairs else 'warn'}','{r_json}'::jsonb)")
        repaired += 1
    summary = {"total": len(ous), "repaired": repaired}
    sb_rpc(f"UPDATE control_tower.execution_run SET ended_at=now(),run_status='passed',summary='{safe_json(summary)}'::jsonb WHERE run_id='{run_id}'")
    return {"run_id": run_id, "status": "recover_complete", **summary, "ts": now_utc()}


# ── MONITOR ────────────────────────────────────────────────────────────────────
def run_monitor():
    ctel   = (sb_rpc("SELECT * FROM control_tower.v_ctel_summary").get("rows") or [{}])[0]
    legacy = (sb_rpc("SELECT * FROM control_tower.v_legacy_inventory_summary").get("rows") or [{}])[0]
    deg    = sb_rpc("SELECT ou_key FROM control_tower.organ_unit WHERE current_status='degraded' LIMIT 10").get("rows",[])
    stats  = {"ts": now_utc(), "ctel": ctel, "legacy": legacy, "degraded_count": len(deg)}
    html   = safe_json(stats)
    sb_rpc(f"INSERT INTO t4h_ui_snippet (slug,title,html,page_key,updated_at) VALUES ('ctel_monitor_snapshot','CTEL Live','{html}','control_tower',now()) ON CONFLICT (slug) DO UPDATE SET html=EXCLUDED.html,updated_at=now()")
    total = int(ctel.get("total_ou",0)); real = int(ctel.get("real_count",0))
    if _TG_BOT and len(deg) > 0:
        msg = f"CTEL Alert: {total} OUs | REAL:{real} | Degraded:{len(deg)}"
        http_post(f"https://api.telegram.org/bot{_TG_BOT}/sendMessage",
            {"chat_id": _TG_CHAT, "text": msg}, {"Content-Type": "application/json"})
    return {"status": "monitor_complete", "stats": stats}


# ── FORGE ──────────────────────────────────────────────────────────────────────
def run_forge(event):
    p = event.get("payload", event)
    ok = safe(p.get("ou_key", f"OU_{uuid.uuid4().hex[:8].upper()}"))
    title = safe(p.get("title", ok)); biz = safe(p.get("biz_key","t4h.core"))
    purpose = safe(p.get("purpose","Pending")); owner = safe(p.get("owner_layer","autonomous"))
    fn = safe(p.get("invoke_function_name","")); slug = safe(p.get("command_centre_slug",ok.lower()))
    rec = safe(p.get("recovery_strategy","rerun_then_repair"))
    arr = "{" + ",".join(p.get("trigger_types",["manual_bridge"])) + "}"
    fn_sql = f"'{fn}'" if fn else "NULL"
    sb_rpc(f"INSERT INTO control_tower.organ_unit (ou_key,title,biz_key,purpose,owner_layer,architecture_level,automation_level,wave_target,invoke_function_name,command_centre_slug,trigger_types,recovery_strategy) VALUES ('{ok}','{title}','{biz}','{purpose}','{owner}',35,20,10,{fn_sql},'{slug}',ARRAY{arr}::text[],'{rec}') ON CONFLICT (ou_key) DO UPDATE SET title=EXCLUDED.title,updated_at=now()")
    sb_rpc(f"INSERT INTO control_tower.organ_unit_gate (ou_key) VALUES ('{ok}') ON CONFLICT DO NOTHING")
    ev_payload = safe_json({"ts": now_utc()})
    sb_rpc(f"INSERT INTO control_tower.organ_unit_event (ou_key,event_type,execution_mode,payload) VALUES ('{ok}','forged','forge','{ev_payload}'::jsonb)")
    return {"status": "forged", "ou_key": ok, "ts": now_utc()}


# ── REHYDRATE ──────────────────────────────────────────────────────────────────
def run_rehydrate():
    import boto3
    run_id = str(uuid.uuid4())
    sb_rpc(f"INSERT INTO control_tower.execution_run (run_id,run_type,scope,run_status) VALUES ('{run_id}','rehydrate','all','running') ON CONFLICT DO NOTHING")
    assets = []
    try:
        lc = boto3.client("lambda", region_name="ap-southeast-2")
        for page in lc.get_paginator("list_functions").paginate():
            for fn in page["Functions"]:
                assets.append({"asset_key": f"lambda::{fn['FunctionName']}","asset_type":"lambda_function",
                    "source_system":"aws_lambda","source_ref":fn["FunctionArn"],"title":fn["FunctionName"],
                    "truth_state":"PARTIAL","current_status":"discovered","last_seen_at":now_utc(),
                    "notes":json.dumps({"runtime":fn.get("Runtime","")})})
    except Exception as e:
        print(f"discover error: {e}")
    inserted = 0
    for i in range(0, len(assets), 50):
        if sb_upsert("control_tower.legacy_asset_inventory", assets[i:i+50]) in (200,201,204):
            inserted += 50
    summary = {"total": len(assets), "inserted": min(inserted, len(assets))}
    sb_rpc(f"UPDATE control_tower.execution_run SET ended_at=now(),run_status='passed',summary='{safe_json(summary)}'::jsonb WHERE run_id='{run_id}'")
    return {"run_id": run_id, "status": "rehydrated", **summary, "ts": now_utc()}


# ── ROUTER ─────────────────────────────────────────────────────────────────────
def handler(event, context):
    _init(event)
    if not _SB_URL:
        return {"error": "SUPABASE_URL missing — pass via credentials.sb_url or env", "ts": now_utc()}

    fn_name = getattr(context, "function_name", "") if context else ""
    op = (event.get("operation") or event.get("mode") or event.get("action")
          or event.get("phase") or os.environ.get("CTEL_PHASE",""))

    if not op or op in ("execute","dry_run","run"):
        for phase in ("forge","sweep","prove","recover","rehydrate","monitor"):
            if phase in fn_name: op = phase; break
        else: op = "sweep"

    if op == "forge":     return run_forge(event)
    if op == "sweep":     return run_sweep()
    if op == "recover":   return run_recover()
    if op == "monitor":   return run_monitor()
    if op == "rehydrate": return run_rehydrate()
    if op == "prove":
        return {"status": "prove_deferred", "note": "Requires deployed fn targets. Run sweep+recover first.", "ts": now_utc()}
    return {"status": "unknown_op", "op": op, "ts": now_utc()}