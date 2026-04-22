import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type EnqueueBody = {
  task_type?: string;
  payload?: Record<string, unknown>;
  idempotency_key?: string;
  priority?: number;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  }

  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normaliseBody(req: VercelRequest): EnqueueBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body as EnqueueBody;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { task_type, payload, idempotency_key, priority } = normaliseBody(req);

    if (!task_type || typeof task_type !== 'string') {
      return res.status(400).json({ ok: false, error: 'missing_task_type' });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ ok: false, error: 'missing_payload' });
    }

    if (!idempotency_key || typeof idempotency_key !== 'string') {
      return res.status(400).json({ ok: false, error: 'missing_idempotency_key' });
    }

    const supabase = getSupabase();

    const existing = await supabase
      .from('ops_work_queue')
      .select('*')
      .eq('idempotency_key', idempotency_key)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      return res.status(500).json({
        ok: false,
        error: 'queue_lookup_failed',
        detail: existing.error.message,
      });
    }

    if (existing.data) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        task: existing.data,
      });
    }

    const insert = await supabase
      .from('ops_work_queue')
      .insert({
        task_type,
        payload,
        idempotency_key,
        priority: Number.isFinite(priority) ? priority : 5,
      })
      .select('*')
      .single();

    if (insert.error) {
      return res.status(500).json({
        ok: false,
        error: 'queue_insert_failed',
        detail: insert.error.message,
      });
    }

    return res.status(200).json({ ok: true, duplicate: false, task: insert.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return res.status(500).json({ ok: false, error: 'enqueue_failed', detail: message });
  }
}
