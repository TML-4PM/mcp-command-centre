export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q';

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

async function logPackRun(packSlug: string, status: string, reportCount: number) {
  try {
    const now = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/rpt_run`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        report_slug: packSlug, run_type: 'pack', status,
        row_count: reportCount, requested_by: 'troy', requested_via: 'ui_click',
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
  const packSlug = url.searchParams.get('slug');
  const baseUrl = `${url.protocol}//${url.host}`;
  if (!packSlug) return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });

  try {
    // Get pack from rpt_pack_registry
    const packs = await supa(`rpt_pack_registry?pack_slug=eq.${encodeURIComponent(packSlug)}&select=*&limit=1`);
    if (!packs?.length) return new Response(JSON.stringify({ error: `Pack not found: ${packSlug}` }), { status: 404, headers: CORS });
    const pack = packs[0];

    // Get items ordered by run_order
    const items = await supa(`rpt_pack_item?pack_slug=eq.${encodeURIComponent(packSlug)}&select=*&order=run_order.asc`);
    if (!items?.length) {
      return new Response(JSON.stringify({
        pack_slug: packSlug, pack_name: pack.pack_name, kind: pack.category,
        status: 'warning', rag: 'amber', readiness_pct: 0, total_reports: 0, reports: [],
        message: 'No items registered for this pack yet'
      }), { status: 200, headers: CORS });
    }

    // Run each report
    const results: any[] = [];
    let packRag = 'green';
    let failCount = 0;

    for (const item of items) {
      const r = await fetch(`${baseUrl}/api/rpt/report?slug=${encodeURIComponent(item.report_slug)}`);
      const rpt = await r.json();
      const rag: string = rpt.rag || (rpt.status === 'draft' || rpt.message ? 'amber' : 'red');
      results.push({
        report_slug: item.report_slug, name: rpt.name,
        run_order: item.run_order, required: item.is_required,
        rag, row_count: rpt.row_count || 0,
        error: rpt.error || null, message: rpt.message || null
      });
      if (rag === 'red') { failCount++; if (item.is_required) packRag = 'red'; }
      else if (rag === 'amber' && packRag !== 'red') packRag = 'amber';
    }

    const greenCount = results.filter(r => r.rag === 'green').length;
    const readinessPct = Math.round(100 * greenCount / items.length);

    await logPackRun(packSlug, packRag === 'green' ? 'success' : 'warning', items.length);

    return new Response(JSON.stringify({
      pack_slug: packSlug, pack_name: pack.pack_name, kind: pack.category,
      frequency: pack.frequency, status: pack.status,
      rag: packRag, readiness_pct: readinessPct,
      total_reports: results.length, green_count: greenCount, fail_count: failCount,
      reports: results, generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
