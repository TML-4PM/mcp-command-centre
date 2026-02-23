// Bridge client for troy-sql-executor via Lambda invoke gateway
const BRIDGE_URL = 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke';

export interface BridgeResult {
  success: boolean;
  rows: any[];
  count: number;
  sql: string;
}

export async function bridgeSQL(sql: string): Promise<BridgeResult> {
  const res = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      functionName: 'troy-sql-executor',
      payload: { sql },
    }),
  });
  if (!res.ok) throw new Error(`Bridge HTTP ${res.status}`);
  const envelope = await res.json();
  const body = typeof envelope.result?.body === 'string'
    ? JSON.parse(envelope.result.body)
    : envelope.result?.body;
  if (!body?.success) throw new Error(body?.error || 'Bridge query failed');
  return { success: true, rows: body.rows ?? [], count: body.count ?? 0, sql: body.sql ?? sql };
}

export async function bridgeQueryKey(key: string): Promise<any[]> {
  const lookup = await bridgeSQL(
    `SELECT sql FROM command_centre_queries WHERE key = '${key}' AND is_active = true LIMIT 1`
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
