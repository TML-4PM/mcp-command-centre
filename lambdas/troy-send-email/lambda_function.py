
import json, os, boto3
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ses = boto3.client("ses", region_name=os.environ.get("AWS_SES_REGION","ap-southeast-2"))
FROM = os.environ.get("SES_FROM","noreply@tech4humanity.com.au")

def handler(event, context):
    body = event if isinstance(event,dict) else json.loads(event.get("body","{}"))
    to      = body.get("to") or body.get("recipient")
    subject = body.get("subject","(no subject)")
    html    = body.get("html") or body.get("body_html","")
    text    = body.get("text") or body.get("body_text", html)
    from_addr = body.get("from", FROM)
    if not to:
        return {"statusCode":400,"body":json.dumps({"error":"to required"})}
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = from_addr
    msg["To"]      = to if isinstance(to,str) else ",".join(to)
    if text: msg.attach(MIMEText(text,"plain"))
    if html: msg.attach(MIMEText(html,"html"))
    try:
        r = ses.send_raw_email(
            Source=from_addr,
            Destinations=[to] if isinstance(to,str) else to,
            RawMessage={"Data":msg.as_string()}
        )
        print(json.dumps({"action":"send_email","to":to,"subject":subject,"msg_id":r["MessageId"]}))
        return {"statusCode":200,"body":json.dumps({"ok":True,"message_id":r["MessageId"]})}
    except Exception as e:
        print(json.dumps({"action":"send_email_error","error":str(e)}))
        return {"statusCode":500,"body":json.dumps({"error":str(e)})}
