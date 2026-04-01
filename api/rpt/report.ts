export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q';
const BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke';
const BRIDGE_KEY = process.env.BRIDGE_API_KEY || 'bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function supa(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!r.ok) return null;
  return r.json();
}

async function bridge(sql: string) {
  const r = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BRIDGE_KEY}`, 'x-api-key': BRIDGE_KEY },
    body: JSON.stringify({ fn: 'troy-sql-executor', sql, debug: true })
  });
  return r.json();
}

async function logRun(slug: string, status: string, rowCount: number, summary: string) {
  try {
    const now = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/rpt_run`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        report_slug: slug, run_type: 'report', status,
        row_count: rowCount, error_summary: summary !== 'ok' ? summary : null,
        requested_by: 'troy', requested_via: 'ui_click',
        started_at: now, finished_at: now
      })
    });
  } catch {}
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  // Internal-only: requires x-internal-token header
  const _tok = req.headers.get('x-internal-token');
  const _exp = process.env.INTERNAL_API_TOKEN || 'rpt-int-t4h-2026';
  if (!_tok || _tok !== _exp) {
    return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Internal access only — not for external parties' }), {
      status: 401,
      headers: { ...CORS, 'WWW-Authenticate': 'Bearer realm="T4H-Internal"' }
    });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });

  try {
    // Lookup in rpt_registry (canonical table)
    const reports = await supa(`rpt_registry?report_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    if (!reports?.length) return new Response(JSON.stringify({ error: `Not found: ${slug}` }), { status: 404, headers: CORS });
    const report = reports[0];

    // Draft — return status without running
    if (report.status !== 'live') {
      return new Response(JSON.stringify({
        slug, name: report.report_name, domain: report.domain,
        status: report.status, rag: report.rag_status,
        notes: report.notes, source_ref: report.source_ref,
        data: [], row_count: 0,
        message: `${report.status.toUpperCase()}: ${report.notes || 'Source not yet live'}`
      }), { status: 200, headers: CORS });
    }

    // Fetch data
    let data: any[] = [];
    let runStatus = 'success';
    let errorMsg = '';

    if (report.source_type === 'supabase_view' || report.source_type === 'supabase_rpc') {
      const viewData = await supa(`${report.source_ref}?select=*&limit=500`);
      if (Array.isArray(viewData)) {
        data = viewData;
      } else {
        const sql = report.source_type === 'supabase_rpc'
          ? `SELECT * FROM ${report.source_ref}() LIMIT 500`
          : `SELECT * FROM ${report.source_ref} LIMIT 500`;
        const br = await bridge(sql);
        if (br.success) { data = br.rows || []; }
        else { runStatus = 'failed'; errorMsg = br.error || 'query failed'; }
      }
    }

    await logRun(slug, runStatus, data.length, errorMsg || 'ok');

    const rag: string = runStatus === 'success' ? 'green' : runStatus === 'warning' ? 'amber' : 'red';

    return new Response(JSON.stringify({
      slug, name: report.report_name, domain: report.domain,
      frequency: report.frequency, tier: report.tier,
      source_ref: report.source_ref, status: runStatus, rag,
      row_count: data.length, data,
      error: errorMsg || null,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
