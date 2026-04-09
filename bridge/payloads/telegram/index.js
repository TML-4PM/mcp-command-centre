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

async function invokeBridge(payload) {
  return requestJson(BRIDGE_ENDPOINT, 'POST', {
    fn: BRIDGE_FUNCTION_NAME,
    payload
  }, {
    'x-api-key': BRIDGE_API_KEY
  });
}

exports.handler = async (event) => {
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

    const eventRow = await logEvent({
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

    let replyText = 'Received.';

    if (text === '/start') {
      replyText = 'Telegram ingress is live.';
      await updateEvent(eventRow.id, { status: 'done', result: { builtin: 'start' } });
    } else if (text === '/help') {
      replyText = 'Available commands: /start, /help, /health';
      await updateEvent(eventRow.id, { status: 'done', result: { builtin: 'help' } });
    } else if (text === '/health') {
      replyText = 'OK: webhook, Lambda, Supabase, and bridge path reachable.';
      await updateEvent(eventRow.id, { status: 'done', result: { builtin: 'health' } });
    } else {
      const bridgeResponse = await invokeBridge({
        source: 'telegram',
        chat_id: chatId,
        user_id: userId,
        username,
        text,
        telegram_event_id: eventRow.id,
        timestamp_utc: new Date().toISOString()
      });

      replyText = bridgeResponse?.reply_text || bridgeResponse?.message || 'Bridge received command.';
      await updateEvent(eventRow.id, {
        status: 'done',
        result: bridgeResponse
      });
    }

    await sendTelegramMessage(chatId, replyText);
    return json(200, { ok: true });
  } catch (err) {
    try {
      const body = safeParse(event.body, event.isBase64Encoded);
      const message = body.message || body.edited_message;
      const chatId = String(message?.chat?.id || '');
      if (chatId && TELEGRAM_BOT_TOKEN) {
        await sendTelegramMessage(chatId, `Error: ${err.message}`);
      }
    } catch (_) {}
    return json(500, { ok: false, error: err.message });
  }
};
