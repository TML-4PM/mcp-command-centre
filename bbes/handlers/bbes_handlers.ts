// BBES handler stubs (Node/TypeScript compatible)
// Reality state: PARTIAL until deployed and invoked via runner/bridge.

export type RealityState = 'REAL' | 'PARTIAL' | 'PRETEND' | 'UNKNOWN';

export interface HandlerResponse {
  status: 'ok' | 'blocked' | 'failed';
  request_id: string;
  function_name: string;
  reality_state: RealityState;
  data?: any;
  error?: string | null;
  execution_time_ms?: number;
}

function nowMs() { return Date.now(); }

function baseResponse(fn: string): HandlerResponse {
  return {
    status: 'ok',
    request_id: crypto.randomUUID(),
    function_name: fn,
    reality_state: 'PARTIAL',
    data: {},
    error: null,
    execution_time_ms: 0
  };
}

export async function bbesTriage(input: { url: string; intent?: string; business_hint?: string; }): Promise<HandlerResponse> {
  const t0 = nowMs();
  const res = baseResponse('bbes-triage');
  try {
    const lowSignal = !input.intent || input.intent.trim().length < 3;
    const decision = lowSignal ? 'KILL' : 'FULL';
    res.data = { decision, reason: lowSignal ? 'LOW_SIGNAL' : 'SUFFICIENT', confidence: lowSignal ? 0.6 : 0.9 };
    res.reality_state = 'PARTIAL';
  } catch (e: any) {
    res.status = 'failed';
    res.error = e?.message ?? 'triage_error';
  } finally {
    res.execution_time_ms = nowMs() - t0;
  }
  return res;
}

export async function bbesProcess(input: { tab_id: string; record?: any; }): Promise<HandlerResponse> {
  const t0 = nowMs();
  const res = baseResponse('bbes-process');
  try {
    const r = input.record ?? {};
    const payload = {
      fn: 'troy-code-pusher',
      payload: { target: 'bbes', action: 'noop', data: { tab_id: input.tab_id } }
    };
    res.data = {
      enriched: true,
      primary_business: r.primary_business ?? 'UNKNOWN',
      system_layer: r.system_layer ?? 'signal',
      estimated_value_aud: r.estimated_value_aud ?? 0,
      cost_to_execute_aud: r.cost_to_execute_aud ?? 0,
      execution_payload: payload
    };
    res.reality_state = 'PARTIAL';
  } catch (e: any) {
    res.status = 'failed';
    res.error = e?.message ?? 'process_error';
  } finally {
    res.execution_time_ms = nowMs() - t0;
  }
  return res;
}

export async function bbesExecute(input: { tab_id: string; execution_payload: any; }): Promise<HandlerResponse> {
  const t0 = nowMs();
  const res = baseResponse('bbes-execute');
  try {
    if (!input.execution_payload) {
      res.status = 'blocked';
      res.error = 'missing_execution_payload';
      return res;
    }
    res.data = { dispatched: true, payload: input.execution_payload };
    res.reality_state = 'PARTIAL';
  } catch (e: any) {
    res.status = 'failed';
    res.error = e?.message ?? 'execute_error';
  } finally {
    res.execution_time_ms = nowMs() - t0;
  }
  return res;
}

export async function bbesCalibrate(input: { tab_id: string; actual_value_aud?: number; actual_cost_aud?: number; }): Promise<HandlerResponse> {
  const t0 = nowMs();
  const res = baseResponse('bbes-calibrate');
  try {
    const predicted_value = 0;
    const predicted_cost = 0;
    const actual_value = input.actual_value_aud ?? 0;
    const actual_cost = input.actual_cost_aud ?? 0;
    res.data = {
      delta_value: actual_value - predicted_value,
      delta_cost: actual_cost - predicted_cost
    };
    res.reality_state = 'PARTIAL';
  } catch (e: any) {
    res.status = 'failed';
    res.error = e?.message ?? 'calibrate_error';
  } finally {
    res.execution_time_ms = nowMs() - t0;
  }
  return res;
}

export async function bbesReceipt(input: { summary: any; evidence: any; }): Promise<HandlerResponse> {
  const t0 = nowMs();
  const res = baseResponse('bbes-receipt');
  try {
    res.data = {
      status: 'COMPLETE',
      system: 'BBES',
      summary: input.summary,
      evidence: input.evidence
    };
    res.reality_state = 'PARTIAL';
  } catch (e: any) {
    res.status = 'failed';
    res.error = e?.message ?? 'receipt_error';
  } finally {
    res.execution_time_ms = nowMs() - t0;
  }
  return res;
}
