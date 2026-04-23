/**
 * symbio-synapse.js — Command Centre page
 * Registered at: inventory.command_centre_pages.id = 'symbio-synapse'
 * Section: OPERATIONS · sort_order: 86
 *
 * Drop this file into: TML-4PM/mcp-command-centre (alongside the other CC page scripts)
 *
 * Data sources (all live, via Supabase REST or bridge):
 *   - cc.v_job_relay_dashboard  (single-row metrics)
 *   - cc.v_job_relay_by_status  (status × env breakdown)
 *   - cc.v_job_relay_health     ('HEALTHY' / 'WARNING' / 'DEGRADED')
 *   - ops.work_queue            (per-job detail, filtered by title LIKE 'Symbio intake:%')
 *   - ops.job_receipts          (receipt trail per job_id)
 *
 * Actions (RPCs called via the bridge — fn='troy-sql-executor'):
 *   - ops.promote_batch_unit(business_name, proof_ref, proof_evidence, actor)
 *   - ops.block_job / ops.archive_job / ops.heartbeat  (emergency surgery)
 *
 * Bridge envelope shape:
 *   POST https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke
 *   headers: { 'x-api-key': <BRIDGE_KEY>, 'Content-Type':'application/json' }
 *   body:    { fn: 'troy-sql-executor', payload: { sql: "SELECT ..." } }
 */

const BRIDGE_URL =
  'https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke';

/** Thin bridge client — the rest of the CC likely has its own equivalent.
 *  If so, replace `invokeSql` with the shared helper and delete this block. */
async function invokeSql(sql, bridgeKey) {
  const r = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'x-api-key': bridgeKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn: 'troy-sql-executor', payload: { sql } }),
  });
  const data = await r.json();
  if (!data.success) throw new Error(data.error || 'bridge sql error');
  return data.rows;
}

const q = (v) =>
  v === null || v === undefined ? 'NULL'
  : typeof v === 'boolean'       ? (v ? 'TRUE' : 'FALSE')
  : typeof v === 'number'        ? String(v)
  : "'" + String(v).replace(/'/g, "''") + "'";

// -------- fetchers --------
export async function fetchDashboard(bridgeKey) {
  const [summary] = await invokeSql('SELECT * FROM cc.v_job_relay_dashboard;', bridgeKey);
  const [health]  = await invokeSql('SELECT * FROM cc.v_job_relay_health;', bridgeKey);
  const byStatus  = await invokeSql('SELECT * FROM cc.v_job_relay_by_status;', bridgeKey);
  return { summary, health, byStatus };
}

export async function fetchSymbioIntake(bridgeKey) {
  return invokeSql(
    `SELECT job_id, title, status, payload->>'batch' AS batch,
            payload->>'grp' AS grp, payload->>'url' AS url,
            payload->>'proof_required' AS proof_required,
            stale_after, created_at
       FROM ops.work_queue
      WHERE title LIKE 'Symbio intake:%'
        AND status <> 'archived'
      ORDER BY
        CASE payload->>'batch' WHEN 'BATCH_1' THEN 1 WHEN 'BATCH_2' THEN 2 ELSE 3 END,
        payload->>'grp',
        title;`,
    bridgeKey
  );
}

export async function fetchReceipts(jobId, bridgeKey) {
  return invokeSql(
    `SELECT event_type, from_agent, to_agent, status_at_time, proof_ref,
            close_signal, payload, created_at
       FROM ops.job_receipts
      WHERE job_id = ${q(jobId)}::uuid
      ORDER BY created_at ASC;`,
    bridgeKey
  );
}

// -------- actions --------
export async function promoteBatchUnit(
  { businessName, proofRef, proofEvidence = null, actor = 'operator' },
  bridgeKey
) {
  const sql =
    `SELECT * FROM ops.promote_batch_unit(` +
    `${q(businessName)}, ${q(proofRef)}, ` +
    `${proofEvidence ? q(JSON.stringify(proofEvidence)) + '::jsonb' : 'NULL'}, ` +
    `${q(actor)});`;
  return invokeSql(sql, bridgeKey);
}

export async function blockJob({ jobId, actor, reason, staleAfterSec = 3600 }, bridgeKey) {
  const sql =
    `SELECT ops.block_job(${q(jobId)}::uuid, ${q(actor)}, ${q(reason)}, ` +
    `${Number(staleAfterSec)}, 'cc://symbio-synapse');`;
  return invokeSql(sql, bridgeKey);
}

// -------- render (minimal vanilla DOM, adapt to local framework) --------
export function renderPage(root, bridgeKey) {
  root.innerHTML = `
    <section class="cc-symbio-synapse">
      <h2>🔁 Symbio ↔ Synapse</h2>
      <div id="health"></div>
      <div id="summary" class="grid"></div>
      <h3>Batch queue</h3>
      <div id="batches"></div>
      <h3>Status × env</h3>
      <div id="by-status"></div>
    </section>
  `;
  refresh(root, bridgeKey);
}

async function refresh(root, bridgeKey) {
  try {
    const { summary, health, byStatus } = await fetchDashboard(bridgeKey);
    const intake = await fetchSymbioIntake(bridgeKey);

    root.querySelector('#health').textContent =
      `State: ${health.state} · as_of ${new Date(health.as_of).toLocaleString()}`;

    root.querySelector('#summary').innerHTML = Object.entries(summary)
      .filter(([k]) => k !== 'as_of')
      .map(([k, v]) => `<div class="kpi"><strong>${v}</strong><span>${k}</span></div>`)
      .join('');

    const batches = { BATCH_1: [], BATCH_2: [], SYMBIO_POOL: [] };
    for (const row of intake) (batches[row.batch] || batches.SYMBIO_POOL).push(row);
    root.querySelector('#batches').innerHTML = Object.entries(batches)
      .map(([name, rows]) => `
        <details open><summary><strong>${name}</strong> — ${rows.length}</summary>
          <table>
            <thead><tr><th>Biz</th><th>Grp</th><th>Status</th><th>Proof required</th><th></th></tr></thead>
            <tbody>${rows.map(r => `
              <tr>
                <td>${escapeHtml(r.title.replace(/^Symbio intake: /, '').replace(/ \\(.+\\)$/, ''))}</td>
                <td>${escapeHtml(r.grp)}</td>
                <td>${escapeHtml(r.status)}</td>
                <td>${escapeHtml(r.proof_required || '')}</td>
                <td>${(name === 'BATCH_1' || name === 'BATCH_2')
                        ? `<button data-promote="${escapeHtml(r.title)}" data-jobid="${r.job_id}">Promote</button>`
                        : ''}</td>
              </tr>`).join('')}</tbody>
          </table>
        </details>`).join('');

    root.querySelector('#by-status').innerHTML =
      `<table><thead><tr><th>Status</th><th>Env</th><th>Count</th><th>Oldest</th></tr></thead>
       <tbody>${byStatus.map(r =>
         `<tr><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.env)}</td>
              <td>${r.cnt}</td><td>${new Date(r.oldest).toLocaleDateString()}</td></tr>`
       ).join('')}</tbody></table>`;

    root.querySelectorAll('button[data-promote]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const title = btn.dataset.promote;
        const biz = title.replace(/^Symbio intake: /, '').replace(/ \(.+\)$/, '');
        const proofRef = prompt(`Proof reference for "${biz}"? (e.g., s3://evidence/..., gdrive://...)`);
        if (!proofRef) return;
        btn.disabled = true;
        btn.textContent = 'Promoting…';
        try {
          await promoteBatchUnit({ businessName: biz, proofRef, actor: 'cc-operator' }, bridgeKey);
          await refresh(root, bridgeKey);
        } catch (e) {
          alert('Promotion failed: ' + e.message);
          btn.disabled = false;
          btn.textContent = 'Promote';
        }
      });
    });
  } catch (e) {
    root.querySelector('#summary').textContent = 'Failed to load: ' + e.message;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export default { renderPage, fetchDashboard, fetchSymbioIntake, fetchReceipts, promoteBatchUnit, blockJob };
