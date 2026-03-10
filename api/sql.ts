import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sql } = req.body || {};
  if (!sql) {
    return res.status(400).json({ error: "sql required" });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });
    if (error) throw error;
    // exec_sql returns rows array
    const rows = Array.isArray(data) ? data : [data];
    return res.status(200).json({ rows, count: rows.length });
  } catch (err: any) {
    // Fallback: try direct REST query approach
    return res.status(500).json({ 
      error: err.message || String(err),
      hint: "Ensure exec_sql RPC exists in Supabase or update this endpoint to use service_role direct queries"
    });
  }
}
