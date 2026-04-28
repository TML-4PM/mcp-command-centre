import crypto from 'node:crypto';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

const requiredEnv = [
  'ANTHROPIC_API_KEY',
  'PERPLEXITY_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
  'GITHUB_REPO_FULL_NAME'
];

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    const err = new Error(`Missing required env vars: ${missing.join(', ')}`);
    err.code = 'MISSING_ENV';
    throw err;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body, null, 2)
  };
}

function coaxPrompt({ coax_thread_id, agent, system, task }) {
  return `COAX EXECUTION CONTEXT\n\nThread ID: ${coax_thread_id}\nAgent: ${agent}\nSystem: ${system}\n\nReturn strict JSON only with these keys:\n{\n  "coax_thread_id": "${coax_thread_id}",\n  "agent": "${agent}",\n  "system": "${system}",\n  "summary": "",\n  "key_points": [],\n  "decisions": [],\n  "actions": [],\n  "risks": [],\n  "evidence": [],\n  "revenue_hooks": [],\n  "confidence": "high|medium|low"\n}\n\nTask:\n${task.prompt}`;
}

async function callClaude(coax_thread_id, task) {
  const input = {
    model: task.model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    max_tokens: task.max_tokens || 2500,
    temperature: task.temperature ?? 0.2,
    messages: [{ role: 'user', content: coaxPrompt({ coax_thread_id, agent: task.agent || 'COAX-C', system: 'claude', task }) }]
  };

  const started_at = nowIso();
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify(input)
  });
  const raw = await res.json();
  const finished_at = nowIso();

  return normaliseExternalResult({ coax_thread_id, agent: 'COAX-C', system: 'claude', input, raw, status: res.ok ? 'success' : 'failed', http_status: res.status, started_at, finished_at });
}

async function callPerplexity(coax_thread_id, task) {
  const input = {
    model: task.model || process.env.PERPLEXITY_MODEL || 'sonar-pro',
    temperature: task.temperature ?? 0.2,
    messages: [{ role: 'user', content: coaxPrompt({ coax_thread_id, agent: task.agent || 'COAX-P', system: 'perplexity', task }) }]
  };

  const started_at = nowIso();
  const res = await fetch(PERPLEXITY_API, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(input)
  });
  const raw = await res.json();
  const finished_at = nowIso();

  return normaliseExternalResult({ coax_thread_id, agent: 'COAX-P', system: 'perplexity', input, raw, status: res.ok ? 'success' : 'failed', http_status: res.status, started_at, finished_at });
}

function extractText(raw, system) {
  if (system === 'claude') return raw?.content?.map((part) => part.text).filter(Boolean).join('\n') || '';
  if (system === 'perplexity') return raw?.choices?.[0]?.message?.content || '';
  return JSON.stringify(raw);
}

function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (_) { return null; }
}

function normaliseExternalResult({ coax_thread_id, agent, system, input, raw, status, http_status, started_at, finished_at }) {
  const text = extractText(raw, system);
  const parsed = parseJsonLoose(text);
  const output = parsed || { summary: text.slice(0, 1200), raw_text: text };
  return {
    coax_thread_id,
    agent,
    system,
    status,
    http_status,
    started_at,
    finished_at,
    input_payload: input,
    output_payload: output,
    raw_payload: raw,
    output_hash: sha256(raw),
    reality: status === 'success' ? 'PARTIAL' : 'BLOCKED'
  };
}

function mergeResults(coax_thread_id, results) {
  const successes = results.filter((r) => r.status === 'success');
  const failures = results.filter((r) => r.status !== 'success');
  const reality = successes.length === results.length && results.length >= 2 ? 'REAL' : successes.length ? 'PARTIAL' : 'PRETEND';

  return {
    coax_thread_id,
    merged_at: nowIso(),
    reality,
    systems: results.map((r) => ({ agent: r.agent, system: r.system, status: r.status, http_status: r.http_status, output_hash: r.output_hash })),
    summary: successes.map((r) => r.output_payload?.summary || '').filter(Boolean),
    decisions: successes.flatMap((r) => r.output_payload?.decisions || []),
    actions: successes.flatMap((r) => r.output_payload?.actions || []),
    risks: successes.flatMap((r) => r.output_payload?.risks || []),
    evidence: successes.flatMap((r) => r.output_payload?.evidence || []),
    revenue_hooks: successes.flatMap((r) => r.output_payload?.revenue_hooks || []),
    failures: failures.map((r) => ({ agent: r.agent, system: r.system, http_status: r.http_status, output_hash: r.output_hash }))
  };
}

async function supabaseInsert(table, rows) {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation'
    },
    body: JSON.stringify(rows)
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase insert ${table} failed ${res.status}: ${body}`);
  return body ? JSON.parse(body) : [];
}

async function githubPut(path, content, message) {
  const repo = process.env.GITHUB_REPO_FULL_NAME;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64') })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`GitHub write failed ${path} ${res.status}: ${JSON.stringify(body)}`);
  return body?.commit?.sha;
}

function proofMarkdown({ coax_thread_id, results, merged, supabase_rows, commit_shas }) {
  return `# COAX Proof\n\nThread: ${coax_thread_id}\n\nReality: ${merged.reality}\n\n## Systems\n${results.map((r) => `- ${r.agent} / ${r.system}: ${r.status} (${r.http_status}) hash=${r.output_hash}`).join('\n')}\n\n## GitHub Receipts\n${Object.entries(commit_shas).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n## Supabase Rows\n- rows: ${Array.isArray(supabase_rows) ? supabase_rows.length : 'unknown'}\n\n## Completion Rule\nREAL only when Claude + Perplexity API responses are present, GitHub receipts exist, and Supabase rows exist.\n`;
}

export const handler = async (event) => {
  try {
    assertEnv();
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const coax_thread_id = body.coax_thread_id || `COAX-${Date.now()}`;
    const tasks = body.tasks || [];
    if (!tasks.length) return response(400, { error: 'No tasks supplied', coax_thread_id });

    const externalTasks = tasks.filter((t) => ['claude', 'perplexity'].includes(t.system));
    const resultPromises = externalTasks.map((task) => task.system === 'claude' ? callClaude(coax_thread_id, task) : callPerplexity(coax_thread_id, task));
    const settled = await Promise.allSettled(resultPromises);
    const results = settled.map((item, idx) => {
      if (item.status === 'fulfilled') return item.value;
      const task = externalTasks[idx];
      return {
        coax_thread_id,
        agent: task.agent || 'UNKNOWN',
        system: task.system,
        status: 'failed',
        http_status: 0,
        started_at: nowIso(),
        finished_at: nowIso(),
        input_payload: task,
        output_payload: { error: String(item.reason?.message || item.reason) },
        raw_payload: { error: String(item.reason?.stack || item.reason) },
        output_hash: sha256(String(item.reason?.message || item.reason)),
        reality: 'BLOCKED'
      };
    });

    const merged = mergeResults(coax_thread_id, results);

    await supabaseInsert('coax_thread_registry', [{ coax_thread_id, intent: body.intent || 'COAX federated run', status: 'executed', reality: merged.reality }]).catch(async () => []);
    const supabase_rows = await supabaseInsert('coax_execution_log', results.map((r) => ({
      coax_thread_id: r.coax_thread_id,
      agent: r.agent,
      system: r.system,
      input_payload: r.input_payload,
      output_payload: r.output_payload,
      status: r.status,
      reality: r.reality,
      evidence: { output_hash: r.output_hash, http_status: r.http_status, started_at: r.started_at, finished_at: r.finished_at }
    })));
    await supabaseInsert('coax_reality_ledger', [{ coax_thread_id, classification: merged.reality, evidence: { systems: merged.systems }, decision: 'automatic classification after federated API run' }]);

    const base = `coax/runs/${coax_thread_id}`;
    const commit_shas = {};
    for (const r of results) {
      const name = r.system === 'claude' ? 'coax-c.json' : r.system === 'perplexity' ? 'coax-p.json' : `${r.system}.json`;
      commit_shas[name] = await githubPut(`${base}/${name}`, JSON.stringify(r, null, 2), `COAX receipt ${coax_thread_id} ${name}`);
    }
    commit_shas['merged.json'] = await githubPut(`${base}/merged.json`, JSON.stringify(merged, null, 2), `COAX merged ${coax_thread_id}`);
    commit_shas['proof.md'] = await githubPut(`${base}/proof.md`, proofMarkdown({ coax_thread_id, results, merged, supabase_rows, commit_shas }), `COAX proof ${coax_thread_id}`);

    return response(200, { coax_thread_id, reality: merged.reality, results: merged.systems, commit_shas, supabase_rows_count: supabase_rows.length });
  } catch (error) {
    return response(500, { error: error.message, stack: error.stack });
  }
};
