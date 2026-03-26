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

  try {
    let reportPath = 'rpt_report?select=slug,name,domain,frequency,tier,status,rag,source_ref,known_issues,notes&order=tier.asc,domain.asc,slug.asc&limit=200';
    if (domain) reportPath += `&domain=eq.${domain}`;
    if (tier !== null) reportPath += `&tier=eq.${tier}`;
    if (status) reportPath += `&status=eq.${status}`;

    const [reports, packs, checks] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/${reportPath}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/rpt_pack?select=slug,name,kind,frequency,status,notes&order=kind.asc,slug.asc`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/rpt_check?select=code,name,domain,severity,description,check_ref`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
    ]);

    // Summary stats
    const rags = { green: 0, amber: 0, red: 0 };
    const statuses = { live: 0, draft: 0, legacy: 0, broken: 0, retired: 0 };
    for (const r of (reports || [])) {
      if (r.rag && rags[r.rag as keyof typeof rags] !== undefined) rags[r.rag as keyof typeof rags]++;
      if (r.status && statuses[r.status as keyof typeof statuses] !== undefined) statuses[r.status as keyof typeof statuses]++;
    }

    return new Response(JSON.stringify({
      summary: { total_reports: reports?.length || 0, total_packs: packs?.length || 0, total_checks: checks?.length || 0, rag: rags, statuses },
      reports: reports || [],
      packs: packs || [],
      checks: checks || [],
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
