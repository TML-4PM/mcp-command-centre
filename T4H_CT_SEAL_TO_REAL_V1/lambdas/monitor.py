"""
t4h-ou-monitor
Computes CTEL summary, pushes to Command Centre, broadcasts via Telegram.
Runs every 5 minutes via EventBridge.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json, os, requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TELEGRAM_BOT = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT= os.environ.get("TELEGRAM_CHAT_ID", "6972032328")
BRIDGE_URL   = os.environ.get("BRIDGE_URL", "https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")

def now_utc(): return datetime.now(timezone.utc).isoformat()

def sb_rpc(query):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={"apikey": SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}","Content-Type":"application/json"},
        json={"query": query}, timeout=30)
    return r.json()

def safe_json(v): return json.dumps(v).replace("'","''")

def get_ctel_summary() -> dict:
    result = sb_rpc("SELECT * FROM control_tower.v_ctel_summary")
    rows = result.get("rows", [{}])
    return rows[0] if rows else {}

def get_legacy_summary() -> dict:
    result = sb_rpc("SELECT * FROM control_tower.v_legacy_inventory_summary")
    rows = result.get("rows", [{}])
    return rows[0] if rows else {}

def get_degraded_ous() -> list:
    result = sb_rpc("SELECT ou_key, title, truth_state FROM control_tower.organ_unit WHERE current_status='degraded' LIMIT 20")
    return result.get("rows", [])

def push_to_command_centre(stats: dict):
    """Write monitor snapshot to t4h_ui_snippet for CC visibility."""
    slug = "ctel_monitor_snapshot"
    ts = now_utc()
    html = json.dumps(stats)
    sb_rpc(f"""
        INSERT INTO t4h_ui_snippet (slug, title, html, page_key, updated_at)
        VALUES ('{slug}', 'CTEL Monitor Snapshot', '{html.replace("'","''")}', 'control_tower', '{ts}')
        ON CONFLICT (slug) DO UPDATE SET html=EXCLUDED.html, updated_at=EXCLUDED.updated_at
    """)

def send_telegram(msg: str):
    if not TELEGRAM_BOT:
        return
    try:
        requests.post(f"https://api.telegram.org/bot{TELEGRAM_BOT}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT, "text": msg, "parse_mode": "Markdown"}, timeout=10)
    except Exception as e:
        print(f"Telegram error: {e}")

def handler(event, context):
    ctel = get_ctel_summary()
    legacy = get_legacy_summary()
    degraded = get_degraded_ous()

    stats = {
        "ts": now_utc(),
        "ctel": ctel,
        "legacy": legacy,
        "degraded_sample": [d["ou_key"] for d in degraded[:5]],
        "alert": len(degraded) > 0,
    }

    push_to_command_centre(stats)

    total = int(ctel.get("total_ou", 0))
    real  = int(ctel.get("real_count", 0))
    deg   = int(ctel.get("degraded_count", 0))
    pct   = round(real / total * 100, 1) if total else 0

    if deg > 0 or total == 0:
        send_telegram(
            f"⚠️ *CTEL Alert*\n"
            f"Total OUs: {total} | REAL: {real} ({pct}%) | Degraded: {deg}\n"
            f"Degraded: {', '.join(d['ou_key'] for d in degraded[:3])}\n"
            f"_Run /recover to self-heal_"
        )

    return {"status": "monitor_complete", "stats": stats}
