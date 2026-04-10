// sites.ts — Vercel API route: proxy ops.site_registry from Supabase
import type { NextApiRequest, NextApiResponse } from "next";

const SB_URL = process.env.SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, status, group } = req.query;
  let url = `${SB_URL}/rest/v1/ops_site_registry?select=*`;
  if (slug)   url += `&slug=eq.${slug}`;
  if (status) url += `&status=eq.${status}`;
  if (group)  url += `&group_name=eq.${group}`;
  const r = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  const data = await r.json();
  res.status(r.status).json(data);
}
