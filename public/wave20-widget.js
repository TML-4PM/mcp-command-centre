(function () {
  const script = document.currentScript;
  const apiBase = script.getAttribute('data-api-base');
  const siteId = script.getAttribute('data-site-id');
  const theme = script.getAttribute('data-theme') || 'wave20-default';
  if (!apiBase || !siteId) return;

  const host = document.createElement('div');
  host.className = 'wave20-widget';
  host.innerHTML = '<div style="font-family:Arial,sans-serif;border:1px solid #d1d5db;border-radius:12px;padding:14px;max-width:380px">Loading uplift status…</div>';
  script.parentNode.insertBefore(host, script);

  fetch(apiBase.replace(/\/$/, '') + '/widget/' + encodeURIComponent(siteId))
    .then((r) => r.json())
    .then((data) => {
      host.innerHTML = [
        '<div style="font-family:Arial,sans-serif;border:1px solid #d1d5db;border-radius:12px;padding:14px;max-width:380px">',
        '<div style="font-size:12px;opacity:.7">' + theme + '</div>',
        '<h3 style="margin:6px 0">' + (data.site?.site_name || data.site_id) + '</h3>',
        '<div><strong>Status:</strong> ' + data.classification + '</div>',
        '<div><strong>Wave:</strong> ' + data.wave_label + '</div>',
        '<div style="margin-top:8px"><strong>Next action:</strong> ' + data.next_action + '</div>',
        '</div>'
      ].join('');
    })
    .catch(() => {
      host.innerHTML = '<div style="font-family:Arial,sans-serif;border:1px solid #ef4444;color:#991b1b;border-radius:12px;padding:14px;max-width:380px">Widget failed to load</div>';
    });
})();
