"""
troy-signal-executor
Ennead Decision Executor
Reads decision → executes action (respond/book/escalate/notify) across channels
Invoke: {"action":"execute_decision","decision_id":"<uuid>"}
"""
import json
import os
from typing import Any, Dict, Optional

import requests

SUPABASE_URL        = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY        = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TELEGRAM_BOT_TOKEN  = os.environ.get("TELEGRAM_BOT_TOKEN", "")
BOOKING_WEBHOOK_URL = os.environ.get("BOOKING_WEBHOOK_URL", "")
ESCALATION_URL      = os.environ.get("ESCALATION_WEBHOOK_URL", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# ─── Supabase helpers ─────────────────────────────────────────────────────────

def _get(path: str, params: Optional[Dict] = None) -> Any:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path: str, payload: Any, prefer: str = "minimal") -> Any:
    h = {**HEADERS, "Prefer": f"return={prefer}"}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, json=payload, timeout=30)
    r.raise_for_status()
    return r.json() if r.text and prefer == "representation" else None


def _patch(path: str, payload: Any, params: Optional[Dict] = None) -> None:
    h = {**HEADERS, "Prefer": "return=minimal"}
    requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, json=payload, timeout=30).raise_for_status()


def _first(rows):
    return rows[0] if rows else None


# ─── Channel executors ────────────────────────────────────────────────────────

def send_telegram(chat_id: str, text: str) -> Dict:
    if not TELEGRAM_BOT_TOKEN:
        return {"ok": False, "error": "TELEGRAM_BOT_TOKEN not set"}
    r = requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={"chat_id": chat_id, "text": text},
        timeout=30,
    )
    return {"status_code": r.status_code, "body": r.json()}


def queue_booking(sig: Dict, dec: Dict) -> Dict:
    payload = {
        "signal_id":   sig["id"],
        "decision_id": dec["id"],
        "business_key":sig.get("business_key"),
        "user_id":     sig.get("user_id"),
        "content":     sig.get("content"),
        "params":      dec.get("params") or {},
    }
    if BOOKING_WEBHOOK_URL:
        r = requests.post(BOOKING_WEBHOOK_URL, json=payload, timeout=30)
        return {"status_code": r.status_code}
    # Fallback: action queue in Supabase
    _post("se_action_queue", {
        "queue_type":  "booking",
        "business_key":sig.get("business_key"),
        "assistant_key":sig.get("assistant_key"),
        "signal_id":   sig["id"],
        "decision_id": dec["id"],
        "payload":     payload,
        "status":      "queued",
    })
    return {"queued": True}


def queue_escalation(sig: Dict, dec: Dict) -> Dict:
    payload = {
        "signal_id":   sig["id"],
        "decision_id": dec["id"],
        "business_key":sig.get("business_key"),
        "priority":    (dec.get("params") or {}).get("queue", "default"),
        "content":     sig.get("content"),
        "score":       dec.get("score"),
    }
    if ESCALATION_URL:
        r = requests.post(ESCALATION_URL, json=payload, timeout=30)
        return {"status_code": r.status_code}
    _post("se_action_queue", {
        "queue_type":  "escalation",
        "business_key":sig.get("business_key"),
        "signal_id":   sig["id"],
        "decision_id": dec["id"],
        "payload":     payload,
        "status":      "queued",
    })
    return {"queued": True}


def log_execution(dec_id: str, channel: str, req: Dict, res: Dict, status: str) -> None:
    _post("se_executions", {
        "decision_id":    dec_id,
        "channel":        channel,
        "request_payload":req,
        "result_payload": res,
        "status":         status,
    })


# ─── Main executor ────────────────────────────────────────────────────────────

def execute_decision(decision_id: str) -> Dict:
    dec = _first(_get("se_decisions", {"select": "*", "id": f"eq.{decision_id}", "limit": 1}))
    if not dec:
        raise ValueError(f"decision not found: {decision_id}")

    sig = _first(_get("se_signals", {"select": "*", "id": f"eq.{dec['signal_id']}", "limit": 1}))
    if not sig:
        raise ValueError(f"signal not found: {dec['signal_id']}")

    action  = dec["action_key"]
    text    = dec.get("response_text") or "Received."
    chat_id = sig.get("conversation_id")
    result  = {"action": action}

    if action in ("respond", "notify"):
        if sig.get("source") == "telegram" and chat_id:
            tg = send_telegram(chat_id, text)
            ok = tg.get("status_code") == 200 and tg.get("body", {}).get("ok")
            log_execution(dec["id"], "telegram", {"chat_id": chat_id, "text": text}, tg, "sent" if ok else "failed")
            result["telegram"] = tg
        else:
            log_execution(dec["id"], sig.get("source","unknown"), {"text": text}, {"note": "non-telegram not wired"}, "skipped")

    elif action == "book":
        br = queue_booking(sig, dec)
        log_execution(dec["id"], "booking", {"signal_id": sig["id"]}, br, "pending")
        if sig.get("source") == "telegram" and chat_id:
            tg = send_telegram(chat_id, text)
            log_execution(dec["id"], "telegram", {"chat_id": chat_id, "text": text}, tg, "sent")
            result["telegram"] = tg
        result["booking"] = br

    elif action == "escalate":
        er = queue_escalation(sig, dec)
        log_execution(dec["id"], "escalation", {"signal_id": sig["id"]}, er, "pending")
        if sig.get("source") == "telegram" and chat_id:
            tg = send_telegram(chat_id, text)
            log_execution(dec["id"], "telegram", {"chat_id": chat_id, "text": text}, tg, "sent")
            result["telegram"] = tg
        result["escalation"] = er

    elif action == "create_task":
        _post("se_action_queue", {
            "queue_type":  "task",
            "business_key":sig.get("business_key"),
            "signal_id":   sig["id"],
            "decision_id": dec["id"],
            "payload":     {"content": sig.get("content"), "params": dec.get("params") or {}},
            "status":      "queued",
        })
        log_execution(dec["id"], "task_queue", {}, {"queued": True}, "pending")
        result["task_queued"] = True

    else:
        log_execution(dec["id"], "executor", {}, {"note": f"unsupported action: {action}"}, "skipped")

    _patch("se_decisions", {"status": "executed"}, {"id": f"eq.{dec['id']}"})
    _patch("se_signals",   {"status": "executed"}, {"id": f"eq.{sig['id']}"})

    return {"ok": True, "decision_id": dec["id"], "signal_id": sig["id"], "action": action, "result": result}


# ─── Handler ─────────────────────────────────────────────────────────────────

def handler(event, context):
    try:
        body = event.get("body") or event
        if isinstance(body, str):
            body = json.loads(body)

        if body.get("action") != "execute_decision":
            return {"statusCode": 400, "body": json.dumps({"ok": False, "error": "action must be execute_decision"})}

        result = execute_decision(body["decision_id"])
        return {"statusCode": 200, "body": json.dumps(result)}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"ok": False, "error": str(e)})}
