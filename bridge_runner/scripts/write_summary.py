import os, sys
outdir, basename, date, inbox = sys.argv[1:5]

def read(f):
    try: return open(f).read()
    except: return 'NOT_RUN'

def st(txt):
    if txt.startswith('ERROR'): return 'FAILED'
    if txt.startswith('SKIPPED'): return 'SKIPPED'
    if txt == 'NOT_RUN': return 'NOT_RUN'
    return 'REAL'

c = read('/tmp/anthropic_response.txt')
g = read('/tmp/openai_response.txt')
p = read('/tmp/perplexity_response.txt')
overall = 'REAL' if all(st(x) == 'REAL' for x in [c, g, p]) else 'PARTIAL'

open(f'{outdir}/bridge_runner_summary.md', 'w').write(
    f"# Bridge Runner Summary\nPack: {inbox}\nGenerated: {date}\n\n"
    f"## Execution\n| Model | Status | Chars |\n|-------|--------|-------|\n"
    f"| Claude opus-4-5 | {st(c)} | {len(c)} |\n"
    f"| GPT-4o | {st(g)} | {len(g)} |\n"
    f"| Perplexity sonar-pro | {st(p)} | {len(p)} |\n\n"
    f"## Truth State: {overall}\n\nFiles: claude_response.md, gpt_response.md, perplexity_response.md\n"
)
print(f'{outdir}/bridge_runner_summary.md: {overall}')
