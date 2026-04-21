import os, uuid, requests, json
from datetime import datetime, timezone

AGENTS = ["gpt","claude","perplexity","grok"]

SUPABASE_URL=os.getenv("SUPABASE_URL")
SUPABASE_KEY=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI=os.getenv("OPENAI_API_KEY")
ANTHROPIC=os.getenv("ANTHROPIC_API_KEY")
PERPLEXITY=os.getenv("PERPLEXITY_API_KEY")
GROK=os.getenv("XAI_API_KEY")

def now(): return datetime.now(timezone.utc).isoformat()

def call_gpt(prompt):
    return requests.post("https://api.openai.com/v1/chat/completions",
        headers={"Authorization":f"Bearer {OPENAI}"},
        json={"model":"gpt-4o-mini","messages":[{"role":"user","content":prompt}]}
    ).json()

def call_claude(prompt):
    return requests.post("https://api.anthropic.com/v1/messages",
        headers={"x-api-key":ANTHROPIC},
        json={"model":"claude-3-sonnet-20240229","messages":[{"role":"user","content":prompt}]}
    ).json()

def call_perplexity(prompt):
    return requests.post("https://api.perplexity.ai/chat/completions",
        headers={"Authorization":f"Bearer {PERPLEXITY}"},
        json={"model":"sonar-small-online","messages":[{"role":"user","content":prompt}]}
    ).json()

def call_grok(prompt):
    return requests.post("https://api.x.ai/v1/chat/completions",
        headers={"Authorization":f"Bearer {GROK}"},
        json={"model":"grok-1","messages":[{"role":"user","content":prompt}]}
    ).json()

def route(agent,prompt):
    if agent=="gpt": return call_gpt(prompt)
    if agent=="claude": return call_claude(prompt)
    if agent=="perplexity": return call_perplexity(prompt)
    if agent=="grok": return call_grok(prompt)

def handler(event,context):
    task = event.get("task") or "core5"
    run_id=str(uuid.uuid4())
    results=[]

    for agent in AGENTS:
        try:
            res=route(agent,task)
        except Exception as e:
            res={"error":str(e)}
        results.append({"agent":agent,"result":res})

    return {"run_id":run_id,"results":results,"status":"COMPLETE"}
