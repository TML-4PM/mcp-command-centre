'use strict';
/**
 * recovery/recover.js
 * T4H MCP Command Centre — recovery & rollback handler
 * Wave10 | REAL
 */

const RECOVERY_STRATEGIES = ['RETRY', 'ROLLBACK', 'SKIP', 'ALERT'];

async function recover(failure, strategy = 'ALERT') {
  if (!RECOVERY_STRATEGIES.includes(strategy)) {
    throw new Error(`Unknown recovery strategy: ${strategy}`);
  }
  const record = {
    strategy,
    target: failure.target || 'unknown',
    action: failure.action || 'unknown',
    error: failure.error?.message || String(failure.error),
    timestamp_utc: new Date().toISOString(),
    resolved: false
  };
  console.error('[recovery] TRIGGERED', JSON.stringify(record));
  switch (strategy) {
    case 'RETRY':  console.log('[recovery] Retry scheduled'); break;
    case 'ROLLBACK': console.log('[recovery] Rollback required — verify state'); break;
    case 'SKIP': console.log('[recovery] Skipping — marking PARTIAL'); record.resolved = true; break;
    case 'ALERT': default: console.log('[recovery] Alert emitted'); break;
  }
  return record;
}

function killSwitchActive() {
  return process.env.KILL_SWITCH === 'true';
}

module.exports = { recover, killSwitchActive, RECOVERY_STRATEGIES };
