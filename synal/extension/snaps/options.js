'use strict';

const keys = ['orgId','apiKey','apiBase','autoClose','commandCentreUrl'];
const $ = id => document.getElementById(id);

function showStatus(msg, type) {
  const el = $('status');
  el.textContent = msg;
  el.className = `status ${type}`;
  setTimeout(() => { el.className = 'status'; }, 4000);
}

// Load saved config
chrome.storage.sync.get(keys, items => {
  $('orgId').value           = items.orgId || '';
  $('apiKey').value          = items.apiKey || '';
  $('apiBase').value         = items.apiBase || '';
  $('autoClose').checked     = !!items.autoClose;
  $('commandCentreUrl').value = items.commandCentreUrl || '';
});

// Save
$('btnSave').addEventListener('click', () => {
  const orgId = $('orgId').value.trim();
  const apiKey = $('apiKey').value.trim();
  const apiBase = $('apiBase').value.trim().replace(/\/$/, '');

  if (!orgId) { showStatus('Organisation ID is required', 'error'); return; }
  if (!apiBase) { showStatus('API Base URL is required', 'error'); return; }

  chrome.storage.sync.set({
    orgId,
    apiKey,
    apiBase,
    autoClose:        $('autoClose').checked,
    commandCentreUrl: $('commandCentreUrl').value.trim(),
  }, () => showStatus('Settings saved', 'success'));
});

// Test connection
$('btnTest').addEventListener('click', async () => {
  const apiBase = $('apiBase').value.trim().replace(/\/$/, '');
  const apiKey  = $('apiKey').value.trim();
  if (!apiBase) { showStatus('Enter API Base URL first', 'error'); return; }

  showStatus('Testing…', 'success');
  try {
    const res = await fetch(`${apiBase}/health`, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    });
    showStatus(res.ok ? `Connected — HTTP ${res.status}` : `HTTP ${res.status}`, res.ok ? 'success' : 'error');
  } catch (err) {
    showStatus(`Connection failed: ${err.message}`, 'error');
  }
});
