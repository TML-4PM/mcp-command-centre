export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });

  const url = new URL(req.url);
  const domain = url.searchParams.get('domain');
  const tier = url.searchParams.get('tier');
  const status = url.searchParams.get('status');

  const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  try {
    // Build report filter
    let reportPath = 'rpt_registry?select=report_slug,report_name,domain,frequency,tier,status,rag_status,source_ref,notes&order=tier.asc,domain.asc,report_slug.asc&limit=200';
    if (domain) reportPath += `&domain=eq.${domain}`;
    if (tier !== null && tier !== '') reportPath += `&tier=eq.${tier}`;
    if (status) reportPath += `&status=eq.${status}`;

    const [reports, packs] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/${reportPath}`, { headers: H }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/rpt_pack_registry?select=pack_slug,pack_name,category,frequency,status,notes&order=category.asc,pack_slug.asc`, { headers: H }).then(r => r.json()),
    ]);

    const rags = { green: 0, amber: 0, red: 0 } as Record<string, number>;
    const statuses = { live: 0, draft: 0, legacy: 0, broken: 0, retired: 0 } as Record<string, number>;
    for (const r of (reports || [])) {
      const rag = r.rag_status || 'amber';
      if (rags[rag] !== undefined) rags[rag]++;
      const st = r.status || 'draft';
      if (statuses[st] !== undefined) statuses[st]++;
    }

    // Normalise field names for frontend
    const normReports = (reports || []).map((r: any) => ({
      slug: r.report_slug, name: r.report_name, domain: r.domain,
      frequency: r.frequency, tier: r.tier, status: r.status,
      rag: r.rag_status, source_ref: r.source_ref, notes: r.notes
    }));

    const normPacks = (packs || []).map((p: any) => ({
      slug: p.pack_slug, name: p.pack_name, kind: p.category,
      frequency: p.frequency, status: p.status, notes: p.notes
    }));

    return new Response(JSON.stringify({
      summary: { total_reports: normReports.length, total_packs: normPacks.length, rag: rags, statuses },
      reports: normReports,
      packs: normPacks,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
