'use strict';
/**
 * telemetry/emit.js
 * T4H MCP Command Centre — telemetry emitter
 * Wave10 | REAL
 */

const TELEMETRY_TYPES = ['SESSION', 'ACTION', 'CONTEXT', 'OUTCOME'];

async function emit(type, payload, opts = {}) {
  if (!TELEMETRY_TYPES.includes(type)) {
    throw new Error(`Invalid telemetry type: ${type}. Must be one of ${TELEMETRY_TYPES.join('|')}`);
  }
  const event = {
    telemetry_type: type,
    source: opts.source || 'mcp-command-centre',
    timestamp_utc: new Date().toISOString(),
    request_id: opts.request_id || crypto.randomUUID(),
    payload
  };
  if (process.env.TELEMETRY_ENABLED === 'false') {
    console.log('[telemetry] DISABLED — event dropped:', JSON.stringify(event));
    return { dropped: true };
  }
  console.log('[telemetry]', JSON.stringify(event));
  return { ok: true, event };
}

module.exports = { emit, TELEMETRY_TYPES };
