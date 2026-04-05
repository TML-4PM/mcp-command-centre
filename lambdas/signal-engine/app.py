"""
troy-signal-engine
Ennead Signal-Decision Engine
Ingest signal → score (weighted lattice) → match rules → create decision
Invoke via bridge: {"fn":"troy-signal-engine","action":"ingest_signal","signal":{...}}
"""
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_POST_URL", "")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


# ─── Supabase helpers ────────────────────────────────────────────────────────

def _get(path: str, params: Optional[Dict] = None) -> Any:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path: str, payload: Any) -> Any:
    h = {**HEADERS, "Prefer": "return=representation"}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, json=payload, timeout=30)
    r.raise_for_status()
    return r.json() if r.text else []


def _patch(path: str, payload: Any, params: Optional[Dict] = None) -> None:
    h = {**HEADERS, "Prefer": "return=minimal"}
    requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=h, params=params, json=payload, timeout=30).raise_for_status()


def _first(rows: List) -> Optional[Dict]:
    return rows[0] if rows else None


# ─── Scoring ─────────────────────────────────────────────────────────────────

def _get_weight(category: str, key: str, business_key: str) -> float:
    """Business override → global fallback → 1.0"""
    for scope_type, scope_id in [("business", business_key), ("global", None)]:
        params = {
            "select": "weight",
            "category": f"eq.{category}",
            "weight_key": f"eq.{key}",
            "scope_type": f"eq.{scope_type}",
            "active": "eq.true",
            "limit": 1,
        }
        params["scope_id"] = "is.null" if scope_id is None else f"eq.{scope_id}"
        rows = _get("se_weights", params)
        if rows:
            return float(rows[0]["weight"])
    return 1.0


def compute_score(sig: Dict, biz_key: str) -> Dict:
    dim_w  = _get_weight("dimension",   sig["dimension_key"], biz_key)
    surf_w = _get_weight("surface",     sig["surface_key"],   biz_key)
    sig_w  = _get_weight("signal_type", sig["signal_type"],   biz_key)
    conf   = float(sig.get("confidence") or 1.0)
    urg    = float(sig.get("urgency")    or 1.0)
    base   = (dim_w * 5) + (surf_w * 3) + (sig_w * 2)
    final  = base * conf * urg
    return {
        "dimension_weight":    dim_w,
        "surface_weight":      surf_w,
        "signal_type_weight":  sig_w,
        "base_score":          round(base, 4),
        "final_score":         round(final, 4),
    }


# ─── Rule matching ────────────────────────────────────────────────────────────

def _matches(sig: Dict, cond: Dict) -> bool:
    field, op, expected = cond.get("field"), cond.get("operator"), cond.get("value")
    actual = str(sig.get(field) or "").strip().lower()
    exp    = str(expected or "").strip().lower()
    if op == "eq":       return actual == exp
    if op == "neq":      return actual != exp
    if op == "contains": return exp in actual
    if op == "regex":
        try: return bool(re.search(str(expected), str(sig.get(field) or ""), re.I))
        except: return False
    try:
        a, e = float(actual), float(exp)
        return {"gt": a>e, "gte": a>=e, "lt": a<e, "lte": a<=e}.get(op, False)
    except: return False


def rule_matches(rule: Dict, sig: Dict, score: float) -> Tuple[bool, str]:
    if rule.get("score_min") and score < float(rule["score_min"]):
        return False, f"score {score} < min {rule['score_min']}"
    if rule.get("score_max") and score > float(rule["score_max"]):
        return False, f"score {score} > max {rule['score_max']}"
    for cond in (rule.get("match_all") or []):
        if not _matches(sig, cond):
            return False, f"match_all failed: {cond}"
    any_conds = rule.get("match_any") or []
    if any_conds and not any(_matches(sig, c) for c in any_conds):
        return False, "no match_any passed"
    return True, "matched"


def render(template: Optional[str], sig: Dict, score: float) -> str:
    t = template or ""
    for k, v in {"{content}": sig.get("content",""), "{score}": str(score),
                 "{function}": sig.get("function_key",""), "{dimension}": sig.get("dimension_key","")}.items():
        t = t.replace(k, str(v))
    return t


def fetch_rules(biz_key: str, asst_key: Optional[str]) -> List[Dict]:
    """Assistant-specific → business-level → generic"""
    base = {"select": "*", "active": "eq.true", "order": "priority.asc"}
    if asst_key:
        rows = _get("se_decision_rules", {**base, "assistant_key": f"eq.{asst_key}"})
        if rows: return rows
    rows = _get("se_decision_rules", {**base, "business_key": f"eq.{biz_key}", "assistant_key": "is.null"})
    if rows: return rows
    return _get("se_decision_rules", {**base, "business_key": "is.null", "assistant_key": "is.null"})


# ─── Core actions ─────────────────────────────────────────────────────────────

def create_signal(body: Dict) -> Dict:
    sig = body["signal"]
    row = _post("se_signals", {
        "external_id":    sig.get("external_id"),
        "source":         sig["source"],
        "signal_type":    sig["signal_type"],
        "business_key":   sig["business_key"],
        "assistant_key":  sig.get("assistant_key"),
        "function_key":   sig["function_key"],
        "dimension_key":  sig["dimension_key"],
        "surface_key":    sig["surface_key"],
        "user_id":        sig.get("user_id"),
        "conversation_id":sig.get("conversation_id"),
        "priority":       sig.get("priority", "normal"),
        "confidence":     sig.get("confidence", 1.0),
        "urgency":        sig.get("urgency", 1.0),
        "title":          sig.get("title"),
        "content":        sig.get("content"),
        "payload":        sig.get("payload", {}),
        "metadata":       sig.get("metadata", {}),
        "status":         "new",
    })
    return row[0]


def evaluate_signal(signal_id: str) -> Dict:
    sig = _first(_get("se_signals", {"select": "*", "id": f"eq.{signal_id}", "limit": 1}))
    if not sig:
        raise ValueError(f"signal not found: {signal_id}")

    biz_key  = sig["business_key"]
    asst_key = sig.get("assistant_key")
    score_info = compute_score(sig, biz_key)
    score      = score_info["final_score"]

    rules   = fetch_rules(biz_key, asst_key)
    matched = None
    match_reason = "no rule matched"
    for rule in rules:
        ok, reason = rule_matches(rule, sig, score)
        if ok:
            matched, match_reason = rule, reason
            break

    if matched:
        dec = _post("se_decisions", {
            "signal_id":     sig["id"],
            "rule_id":       matched["id"],
            "action_key":    matched["action_key"],
            "mode_key":      matched["mode_key"],
            "score":         score,
            "confidence":    sig.get("confidence") or 1.0,
            "reason":        match_reason,
            "response_text": render(matched.get("response_template"), sig, score),
            "params":        matched.get("params") or {},
            "status":        "created",
        })[0]
    else:
        dec = _post("se_decisions", {
            "signal_id":  sig["id"],
            "action_key": "respond",
            "mode_key":   "LOG_ONLY",
            "score":      score,
            "confidence": sig.get("confidence") or 1.0,
            "reason":     "fallback: no rule matched",
            "response_text": "Received. Logged for review.",
            "params":     {},
            "status":     "created",
        })[0]

    _patch("se_signals", {
        "score":          score,
        "classification": {**score_info, "action_key": dec["action_key"], "mode_key": dec["mode_key"]},
        "status":         "evaluated",
    }, {"id": f"eq.{sig['id']}"})

    # Auto-invoke executor via bridge (fire-and-forget)
    _invoke_executor(dec["id"])

    return {
        "signal_id":    sig["id"],
        "decision_id":  dec["id"],
        "action_key":   dec["action_key"],
        "mode_key":     dec["mode_key"],
        "score":        score,
        "response_text":dec["response_text"],
        "params":       dec["params"],
    }


def _invoke_executor(decision_id: str) -> None:
    """Fire-and-forget async invoke of executor via bridge."""
    if not BRIDGE_URL or not BRIDGE_KEY:
        return
    try:
        requests.post(
            BRIDGE_URL,
            headers={"Content-Type": "application/json", "x-api-key": BRIDGE_KEY},
            json={
                "fn":              "troy-signal-executor",
                "action":          "execute_decision",
                "decision_id":     decision_id,
                "invocation_type": "Event",
            },
            timeout=5,
        )
    except Exception:
        pass  # executor invocation is best-effort


# ─── Handler ─────────────────────────────────────────────────────────────────

def handler(event, context):
    try:
        body = event.get("body") or event
        if isinstance(body, str):
            body = json.loads(body)

        action = body.get("action")

        if action == "ingest_signal":
            sig = create_signal(body)
            result = evaluate_signal(sig["id"])
            return {"statusCode": 200, "body": json.dumps({"ok": True, "result": result})}

        if action == "evaluate_signal":
            result = evaluate_signal(body["signal_id"])
            return {"statusCode": 200, "body": json.dumps({"ok": True, "result": result})}

        if action == "score_only":
            sig = body["signal"]
            score_info = compute_score(sig, sig["business_key"])
            return {"statusCode": 200, "body": json.dumps({"ok": True, "score": score_info})}

        return {"statusCode": 400, "body": json.dumps({"ok": False, "error": f"unsupported action: {action}"})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"ok": False, "error": str(e)})}
