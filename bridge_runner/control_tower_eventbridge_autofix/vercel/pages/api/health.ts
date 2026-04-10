// health.ts — Vercel API route: system health summary
import type { NextApiRequest, NextApiResponse } from "next";

const SB_URL = process.env.SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const [sites, violations] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/ops_site_registry?select=reality_status&status=eq.LIVE`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }).then(r => r.json()),
    fetch(`${SB_URL}/rest/v1/ops_site_violations?select=slug,violation_code`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }).then(r => r.json()),
  ]);
  const counts = sites.reduce((a: Record<string,number>, s: {reality_status:string}) => {
    a[s.reality_status] = (a[s.reality_status] || 0) + 1; return a;
  }, {});
  res.status(200).json({
    ts: new Date().toISOString(),
    total: sites.length,
    by_reality: counts,
    open_violations: Array.isArray(violations) ? violations.length : "error"
  });
}
