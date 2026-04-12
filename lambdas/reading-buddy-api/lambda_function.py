
import json, os, urllib.request
from datetime import datetime, timezone

SB_URL = os.environ["SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_KEY"]
SES_FROM = os.environ.get("SES_FROM","readingbuddy@outcome-ready.com")

def sb_insert(table, row):
    data=json.dumps(row).encode()
    req=urllib.request.Request(f"{SB_URL}/rest/v1/{table}",data=data,
        headers={"apikey":SB_KEY,"Authorization":f"Bearer {SB_KEY}",
                 "Content-Type":"application/json","Prefer":"return=minimal"})
    req.get_method=lambda:"POST"
    with urllib.request.urlopen(req,timeout=10) as r: return r.status

def handler(event, context):
    path = (event.get("rawPath") or event.get("path","")).rstrip("/")
    body = json.loads(event.get("body","{}")) if isinstance(event.get("body"),str) else event.get("body",event)

    if path.endswith("/health"):
        return {"statusCode":200,"body":json.dumps({"status":"ok","service":"reading-buddy-api"})}

    if path.endswith("/enrol") or path.endswith("/enroll"):
        email = body.get("email","")
        child_name = body.get("child_name") or body.get("name","")
        if not email:
            return {"statusCode":400,"body":json.dumps({"error":"email required"})}
        sb_insert("cap_leads",{
            "email":email,"name":child_name,"source":"reading-buddy-enrol",
            "biz_key":"RB","lead_type":"enrolment",
            "message":json.dumps({"child_name":child_name,"plan":body.get("plan","free")}),
            "created_at":datetime.now(timezone.utc).isoformat()
        })
        return {"statusCode":200,"body":json.dumps({"ok":True,"enrolled":True})}

    if path.endswith("/session"):
        user_id = body.get("user_id","")
        book    = body.get("book","")
        score   = body.get("score",0)
        print(json.dumps({"action":"reading_session","user_id":user_id,"book":book,"score":score}))
        return {"statusCode":200,"body":json.dumps({"ok":True,"session_logged":True})}

    return {"statusCode":404,"body":json.dumps({"error":"unknown route","path":path})}
