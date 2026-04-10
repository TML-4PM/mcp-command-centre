"""shared_events.py — shared EventBridge + Supabase helpers for control tower Lambdas."""
import os, json, boto3, urllib.request, urllib.error
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lzfgigiyqpuuxslsygjt.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
EB_BUS      = os.environ.get("EVENT_BUS_NAME", "t4h-control-tower")

eb = boto3.client("events", region_name="ap-southeast-2")

def sb_request(method, path, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase {method} {path} → {e.code}: {e.read().decode()}")

def put_event(detail_type, detail, source="t4h.control-tower"):
    eb.put_events(Entries=[{
        "Source": source,
        "DetailType": detail_type,
        "Detail": json.dumps(detail),
        "EventBusName": EB_BUS
    }])

def now_iso():
    return datetime.now(timezone.utc).isoformat()
