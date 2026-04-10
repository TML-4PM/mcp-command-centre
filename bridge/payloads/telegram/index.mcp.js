'use strict';

const https = require('https');
const crypto = require('crypto');

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET,
  TELEGRAM_ALLOWED_CHAT_IDS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BRIDGE_ENDPOINT,
  BRIDGE_API_KEY,
  BRIDGE_FUNCTION_NAME = 'troy-telegram-dispatch'
} = process.env;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function requestJson(url, method = 'GET', body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method,
      headers: {
        'content-type': 'application/json',
        ...(payload ? { 'content-length': payload.length } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function invokeBridgeV2(payload) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const envelope = {
    action: "invoke_function",
    function_name: BRIDGE_FUNCTION_NAME,
    invocation_type: "RequestResponse",
    payload,
    metadata: {
      request_id: requestId,
      source: "telegram_lambda",
      timestamp_utc: timestamp,
      auth_context: { channel: "telegram" }
    }
  };

  return requestJson(BRIDGE_ENDPOINT, "POST", envelope, {
    "x-api-key": BRIDGE_API_KEY
  });
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const message = body.message || {};

  const payload = {
    source: "telegram",
    channel: "telegram",
    chat_id: String(message.chat?.id || ''),
    user_id: String(message.from?.id || ''),
    username: message.from?.username || null,
    command: message.text || '',
    raw_text: message.text || '',
    timestamp_utc: new Date().toISOString(),
    context: { message_type: "text" }
  };

  const res = await invokeBridgeV2(payload);

  return json(200, { ok: true, bridge: res });
};
