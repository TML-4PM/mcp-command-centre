import json, urllib.request, sys, os

BRIDGE = "https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke"
BKEY = "bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4"

req = urllib.request.Request(
    BRIDGE,
    data=json.dumps({
        "fn": "troy-sql-executor",
        "payload": {"sql": "SELECT key, value FROM cap_secrets WHERE key IN ('ANTHROPIC_API_KEY','OPENAI_API_KEY','PERPLEXITY_API_KEY')"}
    }).encode(),
    headers={"x-api-key": BKEY, "content-type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=15) as r:
        rows = json.loads(r.read()).get('rows', [])
        keys = {row['key']: row['value'] for row in rows}
        open('/tmp/key_anthropic.txt', 'w').write(keys.get('ANTHROPIC_API_KEY', ''))
        open('/tmp/key_openai.txt', 'w').write(keys.get('OPENAI_API_KEY', ''))
        open('/tmp/key_perplexity.txt', 'w').write(keys.get('PERPLEXITY_API_KEY', ''))
        present = [k for k, v in keys.items() if v]
        print(f"Keys fetched: {', '.join(present)}")
except Exception as e:
    print(f"ERROR fetching keys: {e}")
    open('/tmp/key_anthropic.txt', 'w').write('')
    open('/tmp/key_openai.txt', 'w').write('')
    open('/tmp/key_perplexity.txt', 'w').write('')
    sys.exit(1)
