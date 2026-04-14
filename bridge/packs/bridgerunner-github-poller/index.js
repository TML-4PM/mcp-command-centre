'use strict';

const https = require('https');
const crypto = require('crypto');
const AWS = require('aws-sdk');

const {
  GITHUB_TOKEN,
  GITHUB_REPO = 'TML-4PM/mcp-command-centre',
  WATCH_PATHS = 'bridge/payloads/',
  BRIDGE_ENDPOINT,
  BRIDGE_API_KEY,
  LAST_SHA_PARAM = '/bridgerunner/github/last_sha',
  DRY_RUN = 'false'
} = process.env;

function httpreq(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const ghHeaders = {
  Authorization: 'token ' + GITHUB_TOKEN,
  'User-Agent': 'bridgerunner-poller',
  Accept: 'application/vnd.github.v3+json'
};

async function getLastSha() {
  const ssm = new AWS.SSM({ region: 'ap-southeast-2' });
  try {
    const r = await ssm.getParameter({ Name: LAST_SHA_PARAM }).promise();
    return r.Parameter.Value;
  } catch (e) {
    if (e.code === 'ParameterNotFound') return null;
    throw e;
  }
}

async function putLastSha(sha) {
  const ssm = new AWS.SSM({ region: 'ap-southeast-2' });
  await ssm.putParameter({ Name: LAST_SHA_PARAM, Value: sha, Type: 'String', Overwrite: true }).promise();
}

async function getLatestCommit() {
  const r = await httpreq('https://api.github.com/repos/' + GITHUB_REPO + '/commits/main', 'GET', ghHeaders, null);
  if (r.status !== 200) throw new Error('GitHub commits API ' + r.status);
  return r.body;
}

async function getChangedFiles(sha) {
  const r = await httpreq('https://api.github.com/repos/' + GITHUB_REPO + '/commits/' + sha, 'GET', ghHeaders, null);
  return (r.body.files || []).map(f => f.filename);
}

async function invokeBridge(packPath, sha) {
  const envelope = JSON.stringify({
    action: 'invoke_function',
    function_name: 'troy-bridgerunner-dispatch',
    invocation_type: 'Event',
    payload: {
      source: 'bridgerunner-github-poller',
      trigger: 'github_commit',
      repo: GITHUB_REPO,
      commit_sha: sha,
      pack_path: packPath,
      timestamp_utc: new Date().toISOString()
    },
    metadata: {
      request_id: crypto.randomUUID(),
      source: 'troy-bridgerunner-github-poller',
      timestamp_utc: new Date().toISOString()
    }
  });
  return httpreq(BRIDGE_ENDPOINT, 'POST', {
    'x-api-key': BRIDGE_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(envelope)
  }, envelope);
}

exports.handler = async () => {
  const start = Date.now();
  try {
    const commit = await getLatestCommit();
    const latestSha = commit.sha;
    const lastSha = await getLastSha();

    if (lastSha === latestSha) {
      return { status: 'no_change', sha: latestSha, latency_ms: Date.now() - start };
    }

    const files = await getChangedFiles(latestSha);
    const watchList = WATCH_PATHS.split(',').map(p => p.trim());
    const watched = files.filter(f => watchList.some(p => f.startsWith(p)));

    if (watched.length === 0) {
      if (DRY_RUN !== 'true') await putLastSha(latestSha);
      return { status: 'no_watched_files', sha: latestSha, files_changed: files.length };
    }

    const result = { status: 'triggered', sha: latestSha, watched_files: watched, dry_run: DRY_RUN === 'true' };

    if (DRY_RUN !== 'true') {
      for (const f of watched) {
        const r = await invokeBridge(f, latestSha);
        result['bridge_' + f.replace(/\//g, '_')] = r.status;
      }
      await putLastSha(latestSha);
    }

    result.latency_ms = Date.now() - start;
    return result;
  } catch (err) {
    return { status: 'error', error: err.message, latency_ms: Date.now() - start };
  }
};
