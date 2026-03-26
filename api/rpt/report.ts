export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxNzQ2OSwiZXhwIjoyMDU5OTkzNDY5fQ.B6SMaQNb8tER_vqrqkmjNW2BFjcoIowulQOREtRcD8Q';
const BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke';
const BRIDGE_KEY = process.env.BRIDGE_API_KEY || 'bk_tOH8P5WD3mxBKfICa4yI56vJhpuYOynfdf1d_GfvdK4';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };

async function supaRest(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

async function bridgeQuery(sql: string) {
  const r = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BRIDGE_KEY}`, 'x-api-key': BRIDGE_KEY },
    body: JSON.stringify({ fn: 'troy-sql-executor', sql, debug: true })
  });
  return r.json();
}

async function logRun(reportSlug: string, rowCount: number, status: string, summary: string) {
  try {
    await bridgeQuery(`SELECT rpt_log_run('${reportSlug.replace(/'/g,"''")}', null, 'report', null, null, '{}', '${status}', ${rowCount}, '${summary.replace(/'/g,"''")}');`);
  } catch {}
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers: CORS });
  }

  try {
    // 1. Lookup report in registry
    const reports = await supaRest(`rpt_report?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    if (!reports || reports.length === 0) {
      return new Response(JSON.stringify({ error: `Report not found: ${slug}` }), { status: 404, headers: CORS });
    }
    const report = reports[0];

    if (report.status === 'draft' || report.status === 'broken') {
      return new Response(JSON.stringify({
        slug, name: report.name, status: report.status, rag: report.rag,
        known_issues: report.known_issues,
        data: [], row_count: 0,
        message: `Report is ${report.status}. Source: ${report.source_ref}`
      }), { status: 200, headers: CORS });
    }

    // 2. Run source
    let data: any[] = [];
    let runStatus = 'success';
    let errorMsg = '';

    if (report.source_type === 'supabase_view') {
      const view = report.source_ref;
      const result = await supaRest(`${view}?select=*&limit=500`);
      if (Array.isArray(result)) {
        data = result;
      } else {
        // fallback to bridge
        const br = await bridgeQuery(`SELECT * FROM ${view} LIMIT 500`);
        data = br.rows || [];
        if (!br.success) { runStatus = 'failed'; errorMsg = br.error || 'Bridge query failed'; }
      }
    } else if (report.source_type === 'supabase_rpc') {
      const br = await bridgeQuery(`SELECT * FROM ${report.source_ref}() LIMIT 500`);
      data = br.rows || [];
      if (!br.success) { runStatus = 'failed'; errorMsg = br.error || ''; }
    } else {
      runStatus = 'skipped';
      errorMsg = `source_type ${report.source_type} not auto-runnable`;
    }

    // 3. Lookup checks for this report
    const checks = await supaRest(
      `rpt_report_check?report_id=eq.${report.id}&select=*,rpt_check(code,name,severity,check_ref,description)&enabled=eq.true`
    );

    // 4. Run checks (lightweight — check view returns rows = issue)
    const checkResults: any[] = [];
    for (const rc of (checks || [])) {
      const chk = rc.rpt_check;
      if (!chk) continue;
      try {
        const cv = await supaRest(`${chk.check_ref}?select=*&limit=1`);
        const hasIssues = Array.isArray(cv) && cv.length > 0;
        const passed = chk.code === 'GOV_HASH_CHAIN_OK' ? !hasIssues : !hasIssues;
        checkResults.push({ code: chk.code, name: chk.name, severity: chk.severity, passed, details: cv[0] || null });
        if (!passed && rc.fail_blocks_export) runStatus = 'warning';
      } catch {
        checkResults.push({ code: chk.code, name: chk.name, severity: chk.severity, passed: null, details: 'check error' });
      }
    }

    // 5. Log run
    await logRun(slug, data.length, runStatus, errorMsg || `${data.length} rows`);

    const rag = runStatus === 'success' ? 'green' : runStatus === 'warning' ? 'amber' : 'red';

    return new Response(JSON.stringify({
      slug, name: report.name, domain: report.domain, frequency: report.frequency,
      source_ref: report.source_ref, status: runStatus, rag,
      row_count: data.length, data,
      checks: checkResults, error: errorMsg || null,
      generated_at: new Date().toISOString()
    }), { status: 200, headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, slug }), { status: 500, headers: CORS });
  }
}
