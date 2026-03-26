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
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal'
      },
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

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });

  try {
    // 1. Lookup report
    const reports = await supa(`rpt_report?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    if (!reports?.length) return new Response(JSON.stringify({ error: `Not found: ${slug}` }), { status: 404, headers: CORS });
    const report = reports[0];

    // Draft/broken — return status without running
    if (report.status === 'draft' || report.status === 'broken') {
      return new Response(JSON.stringify({
        slug, name: report.name, domain: report.domain, status: report.status,
        rag: report.rag, known_issues: report.known_issues,
        source_ref: report.source_ref, data: [], row_count: 0,
        message: `${report.status.toUpperCase()}: ${report.known_issues || 'Source not yet created'}`
      }), { status: 200, headers: CORS });
    }

    // 2. Fetch data
    let data: any[] = [];
    let runStatus = 'success';
    let errorMsg = '';

    if (report.source_type === 'supabase_view' || report.source_type === 'supabase_rpc') {
      // Try REST first
      const viewData = await supa(`${report.source_ref}?select=*&limit=500`);
      if (Array.isArray(viewData)) {
        data = viewData;
      } else {
        // Fallback to bridge
        const sql = report.source_type === 'supabase_rpc'
          ? `SELECT * FROM ${report.source_ref}() LIMIT 500`
          : `SELECT * FROM ${report.source_ref} LIMIT 500`;
        const br = await bridge(sql);
        if (br.success) {
          data = br.rows || [];
        } else {
          runStatus = 'failed';
          errorMsg = br.error || 'query failed';
        }
      }
    }

    // 3. Run checks
    const checkLinks = await supa(
      `rpt_report_check?report_id=eq.${report.id}&enabled=eq.true&select=*,rpt_check(code,name,severity,check_ref)`
    );
    const checkResults: any[] = [];
    for (const rc of (checkLinks || [])) {
      const chk = rc.rpt_check;
      if (!chk) continue;
      try {
        const cv = await supa(`${chk.check_ref}?select=*&limit=5`);
        const rowCount = Array.isArray(cv) ? cv.length : 0;
        // For integrity fail views: rows = issues. For hash_chain: rows with break = issue.
        const passed = rowCount === 0;
        checkResults.push({ code: chk.code, name: chk.name, severity: chk.severity, passed, issue_count: rowCount });
        if (!passed && rc.fail_blocks_export && runStatus === 'success') runStatus = 'warning';
      } catch {
        checkResults.push({ code: chk.code, name: chk.name, severity: chk.severity, passed: null, issue_count: null });
      }
    }

    // 4. Log
    await logRun(slug, runStatus, data.length, errorMsg || 'ok');

    const rag = runStatus === 'success' ? 'green' : runStatus === 'warning' ? 'amber' : 'red';

    return new Response(JSON.stringify({
      slug, name: report.name, domain: report.domain, frequency: report.frequency,
      tier: report.tier, source_ref: report.source_ref,
      status: runStatus, rag, row_count: data.length, data,
      checks: checkResults, error: errorMsg || null,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
