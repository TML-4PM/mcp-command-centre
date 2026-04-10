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

function getHeader(headers = {}, name) {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === target) return v;
  }
  return undefined;
}

function safeParse(body, isBase64Encoded) {
  if (!body) return {};
  const raw = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
  return JSON.parse(raw);
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
        const text = data || '{}';
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(new Error(`${method} ${url} failed: ${res.statusCode} ${text}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function supabase(path, method = 'GET', body, extraHeaders = {}) {
  return requestJson(`${SUPABASE_URL}/rest/v1/${path}`, method, body, {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
    ...extraHeaders
  });
}

function allowedChatIds() {
  return new Set(
    String(TELEGRAM_ALLOWED_CHAT_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
}

async function sendTelegramMessage(chatId, text) {
  return requestJson(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, 'POST', {
    chat_id: chatId,
    text
  });
}

async function logEvent(eventRow) {
  const rows = await supabase('telegram_events', 'POST', eventRow, {
    Prefer: 'return=representation'
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateEvent(eventId, patch) {
  const rows = await supabase(`telegram_events?id=eq.${encodeURIComponent(eventId)}`, 'PATCH', patch, {
    Prefer: 'return=representation'
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function invokeBridgeV2(payload) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const envelope = {
    action: 'invoke_function',
    function_name: BRIDGE_FUNCTION_NAME,
    invocation_type: 'RequestResponse',
    payload,
    metadata: {
      request_id: requestId,
      source: 'telegram_lambda',
      timestamp_utc: timestamp,
      auth_context: {
        channel: 'telegram'
      }
    }
  };

  const response = await requestJson(BRIDGE_ENDPOINT, 'POST', envelope, {
    'x-api-key': BRIDGE_API_KEY
  });

  return { response, requestId, timestamp };
}

function parseCommand(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { command: '', argsText: '' };
  const [command, ...rest] = trimmed.split(/\s+/);
  return { command, argsText: rest.join(' ') };
}

function builtinReply(command) {
  switch (command) {
    case '/start':
      return 'Telegram ingress is live.';
    case '/help':
      return 'Available commands: /start, /help, /health, /status, /audit, /report, /run <agent>, /ingest <text>';
    case '/health':
      return 'OK: webhook, Lambda, Supabase, and bridge path reachable.';
    default:
      return null;
  }
}

exports.handler = async (event) => {
  let eventRow = null;
  try {
    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BRIDGE_ENDPOINT || !BRIDGE_API_KEY) {
      return json(500, { ok: false, error: 'Missing required environment variables' });
    }

    const secret = getHeader(event.headers, 'x-telegram-bot-api-secret-token');
    if (TELEGRAM_WEBHOOK_SECRET && secret !== TELEGRAM_WEBHOOK_SECRET) {
      return json(403, { ok: false, error: 'Invalid webhook secret' });
    }

    const body = safeParse(event.body, event.isBase64Encoded);
    const message = body.message || body.edited_message;
    if (!message) {
      return json(200, { ok: true, skipped: 'No message payload' });
    }

    const chatId = String(message.chat?.id || '');
    const text = String(message.text || message.caption || '').trim();
    const userId = String(message.from?.id || '');
    const username = message.from?.username || null;
    const allowlist = allowedChatIds();

    if (allowlist.size && !allowlist.has(chatId)) {
      return json(200, { ok: true, skipped: 'Chat not allowed' });
    }

    eventRow = await logEvent({
      telegram_update_id: body.update_id || null,
      chat_id: chatId,
      user_id: userId,
      username,
      message_text: text,
      raw_payload: body,
      status: 'pending'
    });

    if (!text) {
      await updateEvent(eventRow.id, { status: 'ignored', result: { reason: 'empty_text' } });
      return json(200, { ok: true, ignored: 'empty_text' });
    }

    const { command, argsText } = parseCommand(text);
    const builtin = builtinReply(command);
    let replyText = 'Received.';

    if (builtin) {
      replyText = builtin;
      await updateEvent(eventRow.id, {
        status: 'done',
        result: {
          builtin: command.replace('/', ''),
          request_source: 'telegram_builtin'
        }
      });
    } else {
      const payload = {
        source: 'telegram',
        channel: 'telegram',
        chat_id: chatId,
        user_id: userId,
        username,
        command,
        raw_text: text,
        args_text: argsText,
        telegram_event_id: eventRow.id,
        timestamp_utc: new Date().toISOString(),
        context: {
          message_type: message.text ? 'text' : 'other'
        }
      };

      const start = Date.now();
      const { response: bridgeResponse, requestId, timestamp } = await invokeBridgeV2(payload);
      const latencyMs = Date.now() - start;

      replyText =
        bridgeResponse?.data?.reply_text ||
        bridgeResponse?.data?.message ||
        bridgeResponse?.reply_text ||
        bridgeResponse?.message ||
        'Command received.';

      await updateEvent(eventRow.id, {
        status: 'done',
        result: {
          bridge_response: bridgeResponse,
          request_id: requestId,
          request_timestamp_utc: timestamp,
          latency_ms: latencyMs
        }
      });
    }

    await sendTelegramMessage(chatId, replyText);
    return json(200, { ok: true });
  } catch (err) {
    try {
      const body = safeParse(event.body, event.isBase64Encoded);
      const message = body.message || body.edited_message;
      const chatId = String(message?.chat?.id || '');

      if (eventRow?.id) {
        await updateEvent(eventRow.id, {
          status: 'error',
          result: {
            error_message: err.message,
            error_type: 'bridge_failure'
          }
        });
      }

      if (chatId && TELEGRAM_BOT_TOKEN) {
        await sendTelegramMessage(chatId, `Error: ${err.message}`);
      }
    } catch (_) {}

    return json(500, { ok: false, error: err.message });
  }
};
