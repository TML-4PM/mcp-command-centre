import json, urllib.request, sys, os

model_name = sys.argv[1]
pack = open('/tmp/pack_content.txt').read()
api_key = open(f'/tmp/key_{model_name}.txt').read().strip() if os.path.exists(f'/tmp/key_{model_name}.txt') else ''
out_file = f'/tmp/{model_name}_response.txt'

if not api_key:
    open(out_file, 'w').write('SKIPPED: No API key')
    print(f'{model_name}: skipped')
    sys.exit(0)

SYSTEM = (
    "You are a principal systems architect reviewing a T4H operations closure/merge pack. "
    "Respond: (1) Canonical merge decisions + rationale, "
    "(2) Gaps/risks not covered, (3) Duplicate patterns, (4) Next executable action. "
    "Structured, evidence-bound. No filler."
)

if model_name == 'anthropic':
    url = 'https://api.anthropic.com/v1/messages'
    payload = {'model': 'claude-opus-4-5', 'max_tokens': 2000, 'system': SYSTEM, 'messages': [{'role': 'user', 'content': pack}]}
    headers = {'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'}
    extract = lambda d: d.get('content', [{}])[0].get('text', 'NO_TEXT')
elif model_name == 'openai':
    url = 'https://api.openai.com/v1/chat/completions'
    payload = {'model': 'gpt-4o', 'max_tokens': 2000, 'messages': [{'role': 'system', 'content': SYSTEM}, {'role': 'user', 'content': pack}]}
    headers = {'Authorization': f'Bearer {api_key}', 'content-type': 'application/json'}
    extract = lambda d: d['choices'][0]['message']['content']
else:
    url = 'https://api.perplexity.ai/chat/completions'
    payload = {'model': 'sonar-pro', 'max_tokens': 2000, 'messages': [{'role': 'system', 'content': SYSTEM}, {'role': 'user', 'content': pack}]}
    headers = {'Authorization': f'Bearer {api_key}', 'content-type': 'application/json'}
    extract = lambda d: d['choices'][0]['message']['content']

req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers)
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
        text = extract(data)
        open(out_file, 'w').write(text[:5000])
        print(f'{model_name}: OK {len(text)} chars')
except Exception as e:
    open(out_file, 'w').write(f'ERROR: {e}')
    print(f'{model_name} ERROR: {e}')
