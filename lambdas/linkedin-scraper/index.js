const https = require('https');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; T4H-Scraper/1.0)',
        'Accept': 'text/html,application/json,*/*',
        ...( options.headers || {})
      }
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function extractOG(html) {
  const og = {};
  const metas = html.matchAll(/<meta[^>]+>/gi);
  for (const m of metas) {
    const prop = (m[0].match(/property=["']og:([^"']+)["']/) || m[0].match(/name=["']og:([^"']+)["']/) || [])[1];
    const content = (m[0].match(/content=["']([^"']+)["']/) || [])[1];
    if (prop && content) og[prop] = content;
  }
  return og;
}

exports.handler = async (event) => {
  const url = event.url || event.body?.url || (typeof event.body === 'string' ? JSON.parse(event.body).url : null);
  
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'url required' }) };
  }

  const results = { url, oembed: null, og: null, raw_snippet: null, error: null };

  // 1. Try LinkedIn oEmbed (public, no auth)
  try {
    const oembedUrl = `https://www.linkedin.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.status === 200) {
      results.oembed = JSON.parse(res.body);
    }
  } catch (e) {
    results.oembed_error = e.message;
  }

  // 2. Fetch raw HTML for OG tags
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      results.og = extractOG(res.body);
      // Grab text snippet from description
      const desc = (res.body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/) || [])[1];
      if (desc) results.raw_snippet = desc;
    } else {
      results.raw_status = res.status;
    }
  } catch (e) {
    results.fetch_error = e.message;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data: results })
  };
};
