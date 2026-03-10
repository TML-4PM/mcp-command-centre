// maat-sources.js — Command Centre page script
// Drop into: mcp-command-centre/public/pages/ (or wherever page scripts live)
// Queries: 7 registered in command_centre_queries WHERE page_id = 'maat-sources'

export default function render(queryResults) {
  const health = queryResults['source_health_check']?.[0]?.health || {};
  const healthSummary = queryResults['source_health'] || [];
  const coverage = queryResults['source_coverage'] || [];
  const gaps = queryResults['source_coverage_gaps'] || [];
  const duplicates = queryResults['source_duplicates'] || [];
  const dashboard = queryResults['source_dashboard'] || [];
  const registry = queryResults['source_registry_list'] || [];

  const statusColor = {
    'HEALTHY': '#22c55e',
    'WARNING': '#eab308',
    'DEGRADED': '#ef4444'
  }[health.status] || '#6b7280';

  return `
    <div class="cc-page">
      <!-- Health Banner -->
      <div class="cc-card" style="border-left: 4px solid ${statusColor}">
        <h2>Source Registry Health</h2>
        <div class="cc-grid cc-grid-4">
          <div class="cc-stat">
            <span class="cc-stat-value" style="color: ${statusColor}">${health.status || '?'}</span>
            <span class="cc-stat-label">Status</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${health.total_sources || 0}</span>
            <span class="cc-stat-label">Sources</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${(health.total_txns || 0).toLocaleString()}</span>
            <span class="cc-stat-label">Transactions</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${health.duplicate_txn_groups || 0}</span>
            <span class="cc-stat-label">Duplicates</span>
          </div>
        </div>
        <div class="cc-grid cc-grid-4" style="margin-top: 8px">
          <div class="cc-stat">
            <span class="cc-stat-value">${health.healthy || 0}</span>
            <span class="cc-stat-label">Healthy</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${health.gaps || 0}</span>
            <span class="cc-stat-label">Gap Placeholders</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${health.count_mismatches || 0}</span>
            <span class="cc-stat-label">Count Mismatches</span>
          </div>
          <div class="cc-stat">
            <span class="cc-stat-value">${health.missing_hashes || 0}</span>
            <span class="cc-stat-label">Missing Hashes</span>
          </div>
        </div>
      </div>

      <!-- Coverage by Account -->
      <div class="cc-card">
        <h2>Account Coverage</h2>
        <table class="cc-table">
          <thead>
            <tr>
              <th>Account</th><th>Bank</th><th>Sources</th><th>Txns</th>
              <th>Earliest</th><th>Latest</th><th>Gaps</th><th>No Hash</th>
            </tr>
          </thead>
          <tbody>
            ${coverage.map(r => `
              <tr>
                <td>${r.account_label}</td><td>${r.bank}</td>
                <td>${r.source_count}</td><td>${r.total_txns}</td>
                <td>${r.earliest_period || '—'}</td><td>${r.latest_period || '—'}</td>
                <td>${r.gap_sources > 0 ? '<span class="cc-badge cc-badge-warn">' + r.gap_sources + '</span>' : '0'}</td>
                <td>${r.missing_hashes > 0 ? '<span class="cc-badge cc-badge-error">' + r.missing_hashes + '</span>' : '0'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Coverage Gaps -->
      ${gaps.length > 0 ? `
      <div class="cc-card">
        <h2>Coverage Gaps <span class="cc-badge cc-badge-warn">${gaps.length}</span></h2>
        <table class="cc-table">
          <thead><tr><th>Bank</th><th>Period</th><th>Status</th></tr></thead>
          <tbody>
            ${gaps.map(r => `
              <tr>
                <td>${r.bank}</td>
                <td>${r.gap_period}</td>
                <td><span class="cc-badge cc-badge-warn">${r.gap_status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Duplicates (should be empty) -->
      ${duplicates.length > 0 ? `
      <div class="cc-card" style="border-left: 4px solid #ef4444">
        <h2>⚠️ Duplicate Transactions <span class="cc-badge cc-badge-error">${duplicates.length}</span></h2>
        <table class="cc-table">
          <thead><tr><th>Date</th><th>Amount</th><th>Vendor</th><th>Count</th></tr></thead>
          <tbody>
            ${duplicates.map(r => `
              <tr>
                <td>${r.posted_at}</td><td>$${r.amount}</td>
                <td>${r.vendor || '—'}</td><td>${r.dupes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Source Dashboard -->
      <div class="cc-card">
        <h2>Source Dashboard</h2>
        <table class="cc-table cc-table-compact">
          <thead>
            <tr>
              <th>File</th><th>Bank</th><th>Account</th><th>Txns</th>
              <th>Debit</th><th>Credit</th><th>Class %</th><th>Period</th>
            </tr>
          </thead>
          <tbody>
            ${dashboard.slice(0, 50).map(r => `
              <tr>
                <td title="${r.filename}">${r.filename?.substring(0, 35)}${r.filename?.length > 35 ? '…' : ''}</td>
                <td>${r.bank}</td><td>${r.account_label}</td>
                <td>${r.txn_count}</td>
                <td>$${(r.total_debit || 0).toLocaleString()}</td>
                <td>$${(r.total_credit || 0).toLocaleString()}</td>
                <td>${r.classification_pct}%</td>
                <td>${r.statement_period_start} → ${r.statement_period_end}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
