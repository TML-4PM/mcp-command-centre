'use strict';

// Synal Snaps — background service worker
// Handles: config change sync, keyboard shortcut, notifications

let cfg = {};

chrome.storage.sync.get(['orgId','apiKey','apiBase','autoClose'], items => { cfg = items; });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const [k, { newValue }] of Object.entries(changes)) cfg[k] = newValue;
  }
});

// Quick snap via keyboard shortcut (Alt+S)
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
    context:     {
      tab_count:    tabs.length,
      window_count: wins.length,
      pinned_count: tabs.filter(t => t.pinned).length,
    },
    evidence: { selection_chars: selectionText.length, source: 'background_worker' },
  };

  // Retry up to 2 times with 5s timeout
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(`${cfg.apiBase}/synal/task-intake`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
        },
        body:   JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.png',
        title: 'Snap saved',
        message: `"${(tab.title || '').slice(0, 60)}"`,
      });
      if (closeAfter) chrome.tabs.remove(tab.id);
      return;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 800));
    }
  }

  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon48.png',
    title: 'Snap failed',
    message: lastErr?.message || 'Unknown error',
  });
}
