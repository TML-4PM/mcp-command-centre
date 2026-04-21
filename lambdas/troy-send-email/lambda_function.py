import json, os, re, html as html_lib, boto3
from urllib import request as urlrequest
from urllib import error as urlerror
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ses = boto3.client("ses", region_name=os.environ.get("AWS_SES_REGION", "ap-southeast-2"))
FROM = os.environ.get("SES_FROM", "noreply@tech4humanity.com.au")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HTML_HINT_RE = re.compile(r"<!DOCTYPE\s+html|<html\b|<body\b|<[a-zA-Z][^>]*>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
MULTISPACE_RE = re.compile(r"[ \t]+")
MULTIBLANK_RE = re.compile(r"\n{3,}")


def _coerce_body(event):
    if isinstance(event, dict):
        if isinstance(event.get("body"), str):
            try:
                return json.loads(event["body"])
            except Exception:
                pass
        return event
    if isinstance(event, str):
        return json.loads(event)
    return {}


def _looks_like_html(value: str) -> bool:
    return bool(value and HTML_HINT_RE.search(value))


def _html_to_text(value: str) -> str:
    if not value:
        return ""
    text = re.sub(r"<(br|/p|/div|/li|/h[1-6])\b[^>]*>", "\n", value, flags=re.IGNORECASE)
    text = TAG_RE.sub(" ", text)
    text = html_lib.unescape(text)
    text = MULTISPACE_RE.sub(" ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = MULTIBLANK_RE.sub("\n\n", text)
    return text.strip()


def _log(payload):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        req = urlrequest.Request(
            f"{SUPABASE_URL}/rest/v1/email_log",
            data=json.dumps(payload).encode(),
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        urlrequest.urlopen(req, timeout=5)
    except Exception:
        pass


def handler(event, context):
    body = _coerce_body(event)
    to = body.get("to") or body.get("recipient")
    subject = body.get("subject", "(no subject)")
    html = body.get("html") or body.get("body_html") or ""
    text = body.get("text") or body.get("body_text") or ""
    from_addr = body.get("from", FROM)
    source = body.get("source", "unknown")

    if body.get("preview"):
        return {
            "statusCode": 200,
            "body": json.dumps({
                "html": html,
                "text": text,
                "has_html": bool(html),
                "has_text": bool(text),
                "source": source
            })
        }

    if not to:
        return {"statusCode": 400, "body": json.dumps({"error": "to required"})}

    if not html and _looks_like_html(text):
        html = text
        text = ""

    if html and not text:
        text = _html_to_text(html)

    if text and not html and _looks_like_html(text):
        html = text
        text = _html_to_text(html)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to if isinstance(to, str) else ",".join(to)

    if text:
        msg.attach(MIMEText(text, "plain", "utf-8"))
    if html:
        msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        r = ses.send_raw_email(
            Source=from_addr,
            Destinations=[to] if isinstance(to, str) else to,
            RawMessage={"Data": msg.as_string()},
        )

        _log({
            "to_addr": to,
            "subject": subject,
            "has_html": bool(html),
            "has_text": bool(text),
            "source": source,
            "message_id": r["MessageId"]
        })

        return {"statusCode": 200, "body": json.dumps({"ok": True})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
