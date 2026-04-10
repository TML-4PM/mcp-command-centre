'use strict';

// Synal Snaps — background service worker
// Handles: config change sync, keyboard shortcut, context menu

let cfg = {};

chrome.storage.sync.get(['orgId','apiKey','apiBase','autoClose'], items => { cfg = items; });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const [k, { newValue }] of Object.entries(changes)) cfg[k] = newValue;
  }
});

// Keyboard shortcut (Alt+S) — quick snap active tab without popup
chrome.commands?.onCommand.addListener(async cmd => {
  if (cmd !== 'quick-snap') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await sendSnap(tab, '', false);
});

async function sendSnap(tab, selectionText, closeAfter) {
  if (!cfg.apiBase || !cfg.orgId) return;

  const wins = await chrome.windows.getAll({ populate: true });
  const tabs = wins.flatMap(w => w.tabs || []);
  let domain = '';
  try { domain = new URL(tab.url).hostname; } catch (_) {}

  const payload = {
    task_key:    `snap:${Date.now()}`,
    source_type: 'snap',
    source_id:   `ext:${tab.id}`,
    title:       tab.title || 'Browser signal',
    summary:     selectionText || tab.title || tab.url,
    org_id:      cfg.orgId || undefined,
    surface:     'browser',
    source_app:  'synal-snaps',
    page_url:    tab.url,
    domain,
    page_title:  tab.title,
    context:     { tab_count: tabs.length, window_count: wins.length },
    evidence:    { selection_chars: selectionText.length, source: 'background_worker' },
  };

  try {
    const res = await fetch(`${cfg.apiBase}/synal/task-intake`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    const ok = res.ok;
    chrome.notifications.create({
      type:    'basic',
      iconUrl: 'icons/icon48.png',
      title:   ok ? 'Snap saved' : 'Snap failed',
      message: ok ? `"${tab.title?.slice(0,60)}"` : `Error ${res.status}`,
    });

    if (ok && closeAfter) chrome.tabs.remove(tab.id);
  } catch (err) {
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon48.png',
      title: 'Snap failed', message: err.message,
    });
  }
}
