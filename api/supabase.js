const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const BRIDGE_SHARED_SECRET = process.env.BRIDGE_SHARED_SECRET;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const ALLOWED_TABLES = new Set([
  'tasks',
  'agent_runs',
  'workers',
  'email_log',
  'agents',
]);

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

function getAuthToken(req) {
  const header = req.headers['authorization'] || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const shared = req.headers['x-bridge-secret'];
  return Array.isArray(shared) ? shared[0] : shared;
}

function isAuthorized(req) {
  if (!BRIDGE_SHARED_SECRET) return false;
  return getAuthToken(req) === BRIDGE_SHARED_SECRET;
}

function hasEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE);
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    ...extra,
  };
}

function tableAllowed(table) {
  return typeof table === 'string' && ALLOWED_TABLES.has(table);
}

function sanitizeLimit(limit) {
  const n = Number(limit ?? 20);
  if (!Number.isFinite(n)) return 20;
  return Math.max(1, Math.min(100, Math.floor(n)));
}

function buildSelectQuery(params = {}) {
  const search = new URLSearchParams();
  search.set('select', params.select || '*');
  const filters = params.filters || {};

  for (const [key, value] of Object.entries(filters)) {
    if (value && typeof value === 'object' && 'op' in value && 'value' in value) {
      search.set(key, `${value.op}.${value.value}`);
    } else {
      search.set(key, `eq.${value}`);
    }
  }

  if (params.orderBy) {
    search.set('order', params.orderBy);
  }

  search.set('limit', String(sanitizeLimit(params.limit)));
  return search.toString();
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, options);
  const text = await response.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: response.ok, status: response.status, data };
}

async function selectRows(table, params) {
  const qs = buildSelectQuery(params);
  return supabaseFetch(`${table}?${qs}`, {
    method: 'GET',
    headers: sbHeaders(),
  });
}

async function insertRows(table, payload, { upsert = false, returning = 'representation' } = {}) {
  return supabaseFetch(table, {
    method: 'POST',
    headers: sbHeaders({
      ...JSON_HEADERS,
      Prefer: `${upsert ? 'resolution=merge-duplicates,' : ''}return=${returning}`,
    }),
    body: JSON.stringify(payload),
  });
}

async function updateRows(table, filters, payload, { returning = 'representation' } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters || {})) {
    if (value && typeof value === 'object' && 'op' in value && 'value' in value) {
      search.set(key, `${value.op}.${value.value}`);
    } else {
      search.set(key, `eq.${value}`);
    }
  }

  return supabaseFetch(`${table}?${search.toString()}`, {
    method: 'PATCH',
    headers: sbHeaders({
      ...JSON_HEADERS,
      Prefer: `return=${returning}`,
    }),
    body: JSON.stringify(payload),
  });
}

async function handleEnqueue(body) {
  const task = {
    task_type: body.task_type,
    payload: body.payload || {},
    status: body.status || 'queued',
    idempotency_key: body.idempotency_key,
    target_worker: body.target_worker || null,
  };

  return insertRows('tasks', task, { returning: 'representation' });
}

async function handleClaim(body) {
  const workerName = body.worker || body.target_worker;
  if (!workerName) {
    return { ok: false, status: 400, data: { ok: false, error: 'worker_required' } };
  }

  const queued = await selectRows('tasks', {
    filters: {
      status: 'queued',
      ...(workerName ? { target_worker: workerName } : {}),
    },
    orderBy: 'created_at.asc',
    limit: 1,
  });

  if (!queued.ok) return queued;
  const task = Array.isArray(queued.data) ? queued.data[0] : null;
  if (!task) {
    return { ok: true, status: 200, data: { ok: true, claimed: false } };
  }

  const claimed = await updateRows(
    'tasks',
    { id: task.id, status: 'queued' },
    {
      status: 'processing',
      claimed_by: workerName,
      claimed_at: new Date().toISOString(),
    },
    { returning: 'representation' },
  );

  if (!claimed.ok) return claimed;
  const row = Array.isArray(claimed.data) ? claimed.data[0] : null;
  if (!row) {
    return { ok: true, status: 200, data: { ok: true, claimed: false, race: true } };
  }

  return { ok: true, status: 200, data: { ok: true, claimed: true, task: row } };
}

async function handleComplete(body) {
  const taskId = body.task_id;
  if (!taskId) {
    return { ok: false, status: 400, data: { ok: false, error: 'task_id_required' } };
  }

  const resultStatus = body.status || 'done';
  const updates = {
    status: resultStatus,
    processed_at: new Date().toISOString(),
  };
  if (body.output !== undefined) updates.output = body.output;
  if (body.error !== undefined) updates.error = body.error;

  const taskUpdate = await updateRows('tasks', { id: taskId }, updates, { returning: 'representation' });
  if (!taskUpdate.ok) return taskUpdate;

  if (body.run_log) {
    const runPayload = {
      task_id: taskId,
      agent: body.run_log.agent || body.worker || 'bridge-worker',
      input: body.run_log.input || null,
      output: body.run_log.output || body.output || null,
      status: body.run_log.status || (resultStatus === 'done' ? 'success' : resultStatus),
    };
    const runInsert = await insertRows('agent_runs', runPayload, { returning: 'representation' });
    if (!runInsert.ok) return runInsert;
  }

  return { ok: true, status: 200, data: { ok: true, task: Array.isArray(taskUpdate.data) ? taskUpdate.data[0] : taskUpdate.data } };
}

async function handleHeartbeat(body) {
  const worker = body.worker || body.name;
  if (!worker) {
    return { ok: false, status: 400, data: { ok: false, error: 'worker_required' } };
  }

  const payload = {
    name: worker,
    type: body.type || 'mcp-worker',
    status: body.status || 'active',
    last_seen: new Date().toISOString(),
    capabilities: body.capabilities || {},
  };

  return insertRows('workers', payload, { upsert: true, returning: 'representation' });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-bridge-secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!hasEnv()) {
    return send(res, 500, { ok: false, error: 'missing_supabase_env' });
  }

  if (!isAuthorized(req)) {
    return send(res, 401, { ok: false, error: 'unauthorized' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  try {
    if (req.method === 'GET') {
      const table = req.query.table;
      if (!tableAllowed(table)) {
        return send(res, 400, { ok: false, error: 'table_not_allowed' });
      }

      const filters = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (['table', 'select', 'orderBy', 'limit'].includes(key)) continue;
        filters[key] = value;
      }

      const result = await selectRows(table, {
        select: req.query.select,
        orderBy: req.query.orderBy,
        limit: req.query.limit,
        filters,
      });

      return send(res, result.status, { ok: result.ok, data: result.data });
    }

    if (req.method !== 'POST' && req.method !== 'PATCH') {
      return send(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    const action = body.action;

    if (action === 'enqueue') {
      const result = await handleEnqueue(body);
      return send(res, result.status, { ok: result.ok, data: result.data });
    }

    if (action === 'claim') {
      const result = await handleClaim(body);
      return send(res, result.status, result.data);
    }

    if (action === 'complete') {
      const result = await handleComplete(body);
      return send(res, result.status, result.data);
    }

    if (action === 'heartbeat') {
      const result = await handleHeartbeat(body);
      return send(res, result.status, { ok: result.ok, data: result.data });
    }

    const table = body.table;
    if (!tableAllowed(table)) {
      return send(res, 400, { ok: false, error: 'table_not_allowed' });
    }

    if (action === 'insert') {
      const result = await insertRows(table, body.payload, {
        upsert: Boolean(body.upsert),
        returning: body.returning || 'representation',
      });
      return send(res, result.status, { ok: result.ok, data: result.data });
    }

    if (action === 'update') {
      const result = await updateRows(table, body.filters || {}, body.payload || {}, {
        returning: body.returning || 'representation',
      });
      return send(res, result.status, { ok: result.ok, data: result.data });
    }

    return send(res, 400, { ok: false, error: 'unknown_action' });
  } catch (error) {
    return send(res, 500, {
      ok: false,
      error: 'bridge_supabase_error',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
