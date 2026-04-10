'use strict';

const $ = id => document.getElementById(id);

let config = {};
let activeTab = null;
let allTabs = [];
let allWindows = [];
let selectionText = '';

// ── boot ──────────────────────────────────────────────────────────────────────
async function init() {
  config = await loadConfig();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  allWindows = await chrome.windows.getAll({ populate: true });
  allTabs    = allWindows.flatMap(w => w.tabs || []);

  renderContext();
  renderWorkspace();
  await tryCapture();
  restoreAutoClose();
}

function renderContext() {
  const url = activeTab?.url || '';
  const domain = url ? new URL(url).hostname : '';
  $('pageTitle').textContent = activeTab?.title || '—';
  $('pageUrl').textContent   = domain;
  $('scopeText').textContent = `${allTabs.length} tabs · ${allWindows.length} windows`;
}

function renderWorkspace() {
  const pinned = allTabs.filter(t => t.pinned).length;
  $('tabCount').textContent   = allTabs.length;
  $('winCount').textContent   = allWindows.length;
  $('pinnedCount').textContent = pinned;
}

async function tryCapture() {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => window.getSelection()?.toString() || '',
    });
    selectionText = result || '';
  } catch (_) {
    selectionText = '';
  }

  const el = $('selectionDisplay');
  if (selectionText.trim()) {
    el.textContent = selectionText.length > 200
      ? selectionText.slice(0, 200) + '…'
      : selectionText;
  } else {
    el.innerHTML = '<span class="selection-empty">No text selected — will use page title</span>';
  }
}

function restoreAutoClose() {
  chrome.storage.sync.get('autoClose', ({ autoClose }) => {
    $('autoClose').checked = !!autoClose;
  });
}

// ── snap ──────────────────────────────────────────────────────────────────────
async function doSnap(snapAll = false) {
  if (!config.apiBase || !config.orgId) {
    setStatus('error', 'Not configured — open Settings');
    return;
  }

  $('btnSnap').disabled = true;
  $('btnSnapAll').disabled = true;
  setStatus('loading', 'Sending…');

  const url = activeTab?.url || '';
  let domain = '';
  try { domain = new URL(url).hostname; } catch (_) {}

  const context = {
    tab_count:    allTabs.length,
    window_count: allWindows.length,
    pinned_count: allTabs.filter(t => t.pinned).length,
    active_tab_id: activeTab?.id,
  };

  let tabsSnapshot = undefined;
  if (snapAll) {
    tabsSnapshot = allWindows.map(w => ({
      window_id: w.id,
      focused:   w.focused,
      type:      w.type,
      tabs: (w.tabs || []).map(t => ({
        id:     t.id,
        title:  t.title,
        url:    t.url,
        active: t.active,
        pinned: t.pinned,
      })),
    }));
    context.workspace_snapshot = true;
  }

  const payload = {
    task_key:    `snap:${Date.now()}`,
    source_type: snapAll ? 'workspace_snapshot' : 'snap',
    source_id:   `ext:${activeTab?.id}`,
    title:       activeTab?.title || 'Browser signal',
    summary:     selectionText || activeTab?.title || url,
    org_id:      config.orgId || undefined,
    intent:      $('intentSelect').value || undefined,
    impact_area: $('intentSelect').value || undefined,
    priority:    'medium',
    value_score: $('valueSelect').value,
    surface:     'browser',
    source_app:  'synal-snaps',
    page_url:    url,
    domain:      domain,
    page_title:  activeTab?.title,
    context,
    evidence:    { selection_chars: selectionText.length },
  };

  if (tabsSnapshot) payload.tabs_snapshot = tabsSnapshot;

  try {
    const res = await fetch(`${config.apiBase}/synal/task-intake`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    setStatus('success', snapAll
      ? `Workspace snapped — ${allTabs.length} tabs captured`
      : `Snap saved${data.task_id ? ' · ' + data.task_id.slice(0,8) : ''}`
    );

    chrome.storage.sync.set({ autoClose: $('autoClose').checked });
    if ($('autoClose').checked && !snapAll) {
      setTimeout(() => chrome.tabs.remove(activeTab.id), 1200);
    }
  } catch (err) {
    setStatus('error', `Failed: ${err.message}`);
  } finally {
    $('btnSnap').disabled = false;
    $('btnSnapAll').disabled = false;
  }
}

// ── config ────────────────────────────────────────────────────────────────────
function loadConfig() {
  return new Promise(resolve =>
    chrome.storage.sync.get(['orgId', 'apiKey', 'apiBase'], resolve)
  );
}

// ── ui helpers ────────────────────────────────────────────────────────────────
function setStatus(type, msg) {
  const dot  = $('statusDot');
  const text = $('statusText');
  dot.className  = `status-dot ${type}`;
  text.textContent = msg;
}

// ── events ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init();

  $('btnSnap').addEventListener('click', () => doSnap(false));
  $('btnSnapAll').addEventListener('click', () => doSnap(true));

  const openSettings = () => chrome.runtime.openOptionsPage();
  $('btnSettings').addEventListener('click', openSettings);
  $('btnSettings2').addEventListener('click', openSettings);

  $('btnPanel').addEventListener('click', () => {
    chrome.tabs.create({ url: config.commandCentreUrl || 'https://workfamilyai.org/command-centre' });
  });

  $('autoClose').addEventListener('change', () => {
    chrome.storage.sync.set({ autoClose: $('autoClose').checked });
  });
});
