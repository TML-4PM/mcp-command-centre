// Bridge client — routes through /api/bridge proxy (avoids CORS)
const PROXY_URL = '/api/bridge';

export interface BridgeResult {
  success: boolean;
  rows: any[];
  count: number;
  sql: string;
}

export async function bridgeSQL(sql: string): Promise<BridgeResult> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn: 'troy-sql-executor', sql }),
  });
  if (!res.ok) throw new Error(`Bridge HTTP ${res.status}`);
  const body = await res.json();
  // Resilient: accept rows array OR success:true — lambda returns {rows:[...]} directly
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (body?.error && !rows.length) throw new Error(body.error || 'Bridge query failed');
  return { success: true, rows, count: body.count ?? rows.length, sql: body.sql ?? sql };
}

export async function bridgeQueryKey(key: string): Promise<any[]> {
  const lookup = await bridgeSQL(
    `SELECT sql FROM command_centre_queries WHERE key = '${key.replace(/'/g, "''")}' AND is_active = true LIMIT 1`
  );
  if (!lookup.rows.length) throw new Error(`Query key "${key}" not found`);
  const result = await bridgeSQL(lookup.rows[0].sql);
  return result.rows;
}

export async function bridgeCount(sql: string): Promise<number> {
  const result = await bridgeSQL(sql);
  const first = result.rows?.[0];
  if (!first) return 0;
  const val = first.c ?? first.count ?? Object.values(first)[0];
  return Number(val) || 0;
}

export async function bridgeLambda(fn: string, params: Record<string, any>): Promise<any> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn, ...params }),
  });
  if (!res.ok) throw new Error(`Bridge HTTP ${res.status}`);
  return res.json();
}
