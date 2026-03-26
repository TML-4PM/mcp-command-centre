export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q';
const BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke';
const BRIDGE_KEY = process.env.BRIDGE_API_KEY || 'bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };

const BASE = new URL('https://placeholder');

async function supaRest(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

async function fetchReport(slug: string, baseUrl: string): Promise<any> {
  const r = await fetch(`${baseUrl}/api/rpt/report?slug=${encodeURIComponent(slug)}`);
  return r.json();
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  const url = new URL(req.url);
  const packSlug = url.searchParams.get('slug');
  const baseUrl = `${url.protocol}//${url.host}`;

  if (!packSlug) {
    return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });
  }

  try {
    // 1. Get pack
    const packs = await supaRest(`rpt_pack?slug=eq.${encodeURIComponent(packSlug)}&select=*&limit=1`);
    if (!packs || packs.length === 0) {
      return new Response(JSON.stringify({ error: `Pack not found: ${packSlug}` }), { status: 404, headers: CORS });
    }
    const pack = packs[0];

    // 2. Get pack items in order
    const items = await supaRest(`rpt_pack_item?pack_slug=eq.${encodeURIComponent(packSlug)}&select=*&order=run_order.asc`);

    // 3. Run each report
    const results: any[] = [];
    let packRag = 'green';
    let failCount = 0;

    for (const item of (items || [])) {
      const rptResult = await fetchReport(item.report_slug, baseUrl);
      const rag = rptResult.rag || (rptResult.status === 'draft' ? 'amber' : 'red');
      results.push({
        report_slug: item.report_slug,
        name: rptResult.name,
        run_order: item.run_order,
        required: item.is_required,
        status: rptResult.status,
        rag,
        row_count: rptResult.row_count || 0,
        data: rptResult.data || [],
        checks: rptResult.checks || [],
        error: rptResult.error || null,
        message: rptResult.message || null
      });
      if (rag === 'red') { failCount++; if (item.is_required) packRag = 'red'; }
      else if (rag === 'amber' && packRag !== 'red') packRag = 'amber';
    }

    const readinessPct = items && items.length > 0
      ? Math.round(100 * results.filter(r => r.rag === 'green').length / items.length)
      : 0;

    return new Response(JSON.stringify({
      pack_slug: packSlug,
      pack_name: pack.name,
      kind: pack.kind,
      frequency: pack.frequency,
      status: pack.status,
      rag: packRag,
      readiness_pct: readinessPct,
      total_reports: results.length,
      fail_count: failCount,
      reports: results,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, pack_slug: packSlug }), { status: 500, headers: CORS });
  }
}
