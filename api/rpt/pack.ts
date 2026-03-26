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

async function logPackRun(packSlug: string, status: string, reportCount: number, failCount: number) {
  try {
    const now = new Date().toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/rpt_run`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        report_slug: packSlug, run_type: 'pack', status,
        row_count: reportCount,
        error_summary: failCount > 0 ? `${failCount} reports failed/warned` : null,
        requested_by: 'troy', requested_via: 'ui_click',
        started_at: now, finished_at: now
      })
    });
  } catch {}
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  const url = new URL(req.url);
  const packSlug = url.searchParams.get('slug');
  const baseUrl = `${url.protocol}//${url.host}`;
  if (!packSlug) return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });

  try {
    // 1. Get pack definition
    const packs = await supa(`rpt_pack?slug=eq.${encodeURIComponent(packSlug)}&select=*&limit=1`);
    if (!packs?.length) return new Response(JSON.stringify({ error: `Pack not found: ${packSlug}` }), { status: 404, headers: CORS });
    const pack = packs[0];

    // 2. Get items — rpt_pack_item uses pack_slug + report_slug columns
    const items = await supa(`rpt_pack_item?pack_slug=eq.${encodeURIComponent(packSlug)}&select=*&order=run_order.asc`);
    if (!items?.length) {
      return new Response(JSON.stringify({
        pack_slug: packSlug, pack_name: pack.name, kind: pack.kind,
        status: 'warning', rag: 'amber', readiness_pct: 0, total_reports: 0, reports: [],
        message: 'No items registered for this pack'
      }), { status: 200, headers: CORS });
    }

    // 3. Run each report via /api/rpt/report
    const results: any[] = [];
    let packRag = 'green';
    let failCount = 0;

    for (const item of items) {
      const r = await fetch(`${baseUrl}/api/rpt/report?slug=${encodeURIComponent(item.report_slug)}`);
      const rpt = await r.json();
      const rag = rpt.rag || (rpt.status === 'draft' ? 'amber' : 'red');
      results.push({
        report_slug: item.report_slug,
        name: rpt.name,
        run_order: item.run_order,
        required: item.is_required,
        rag, row_count: rpt.row_count || 0,
        checks: rpt.checks || [],
        error: rpt.error || null,
        message: rpt.message || null
      });
      if (rag === 'red') { failCount++; if (item.is_required) packRag = 'red'; }
      else if (rag === 'amber' && packRag !== 'red') packRag = 'amber';
    }

    const greenCount = results.filter(r => r.rag === 'green').length;
    const readinessPct = Math.round(100 * greenCount / items.length);

    await logPackRun(packSlug, packRag === 'green' ? 'success' : 'warning', items.length, failCount);

    return new Response(JSON.stringify({
      pack_slug: packSlug, pack_name: pack.name, kind: pack.kind,
      frequency: pack.frequency, status: pack.status,
      rag: packRag, readiness_pct: readinessPct,
      total_reports: results.length, green_count: greenCount, fail_count: failCount,
      reports: results,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
