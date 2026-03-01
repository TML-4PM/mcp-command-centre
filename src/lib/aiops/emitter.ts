/**
 * AIOps Flow Intelligence Emitter
 * Drop into Command Centre: /src/lib/aiops/emitter.ts
 *
 * Usage:
 *   import { emitRouteEnter, emitWidgetRender, emitUserAction } from '@/lib/aiops/emitter'
 *
 * Wire into layout:
 *   - emitRouteEnter() → root layout useEffect on pathname change
 *   - emitWidgetRender() → each widget component boundary
 *   - emitUserAction() → onClick/onSubmit handlers
 *   - emitMwuTransition() → MWU status change handlers
 *   - emitSurveyStart/Complete() → survey components
 *   - emitAgentRun() → agent execution wrappers
 *   - emitGovernanceGate() → consent/governance gates
 */

// ─── Config ────────────────────────────────────────────────────────────────

const BRIDGE_URL =
  "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";
const FUNCTION_NAME = "troy-sql-executor";

// Default source — override per-deployment
const DEFAULT_SOURCE = "command_centre";

// ─── Types ─────────────────────────────────────────────────────────────────

export type FlowType =
  | "command_centre_decision"
  | "widget_execution"
  | "search_to_action"
  | "survey_participation"
  | "assessment_test"
  | "training_module"
  | "agent_run"
  | "governance_gate"
  | "mwu_lifecycle"
  | "asset_to_outcome";

export interface FlowEvent {
  flow_id: string;
  flow_type: FlowType;
  step: string;
  source?: string;
  program_id?: string;
  asset_id?: string;
  agent_id?: string;
  user_id?: string;
  session_id?: string;
  telemetry?: Record<string, unknown>;
}

export interface PushResult {
  ok: boolean;
  session_id?: string;
  score?: number;
  risk_band?: string;
  states?: string[];
  mwus_created?: number;
  rules_matched?: string[];
  error?: string;
}

// ─── Core ──────────────────────────────────────────────────────────────────

export function newFlowId(): string {
  return crypto.randomUUID();
}

export async function aiOpsPush(evt: FlowEvent): Promise<PushResult> {
  try {
    const payload = {
      flow_id: evt.flow_id,
      flow_type: evt.flow_type,
      step: evt.step,
      source: evt.source ?? DEFAULT_SOURCE,
      ...(evt.program_id && { program_id: evt.program_id }),
      ...(evt.asset_id && { asset_id: evt.asset_id }),
      ...(evt.agent_id && { agent_id: evt.agent_id }),
      ...(evt.user_id && { user_id: evt.user_id }),
      ...(evt.session_id && { session_id: evt.session_id }),
      telemetry: evt.telemetry ?? {},
    };

    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        function: FUNCTION_NAME,
        payload: {
          operation: "rpc",
          function: "rpc_ai_ops_push",
          params: { payload },
        },
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Bridge HTTP ${res.status}` };
    }

    const data = await res.json();

    // Bridge wraps RPC result — extract inner envelope
    const inner = data?.result?.[0]?.rpc_ai_ops_push ?? data?.result ?? data;

    return {
      ok: true,
      session_id: inner?.session_id,
      score: inner?.score,
      risk_band: inner?.risk_band,
      states: inner?.states ?? [],
      mwus_created: inner?.mwus_created ?? 0,
      rules_matched: inner?.rules_matched ?? [],
    };
  } catch (err) {
    console.error("[AIOps] push failed", err);
    return { ok: false, error: String(err) };
  }
}

// ─── Command Centre Emitters ───────────────────────────────────────────────

/**
 * Call on route change in root layout.
 * Returns flowId to pass downstream to widget emitters.
 */
export function emitRouteEnter(route: string): string {
  const flowId = newFlowId();
  aiOpsPush({
    flow_id: flowId,
    flow_type: "command_centre_decision",
    step: "start",
    telemetry: { route, ts_start: Date.now() },
  });
  return flowId;
}

export function emitRouteComplete(
  flowId: string,
  route: string,
  durationMs: number
): void {
  aiOpsPush({
    flow_id: flowId,
    flow_type: "command_centre_decision",
    step: "complete",
    telemetry: { route, duration_ms: durationMs },
  });
}

// ─── Widget Emitters ───────────────────────────────────────────────────────

export function emitWidgetRender(opts: {
  flowId: string;
  widgetId: string;
  ok: boolean;
  durationMs: number;
  retries?: number;
  errors?: number;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "widget_execution",
    step: opts.ok ? "complete" : "error",
    telemetry: {
      widget_id: opts.widgetId,
      duration_ms: opts.durationMs,
      retry_count: opts.retries ?? 0,
      error_count: opts.errors ?? (opts.ok ? 0 : 1),
    },
  });
}

// ─── User Action Emitters ──────────────────────────────────────────────────

export function emitUserAction(opts: {
  flowId: string;
  actionId: string;
  ok: boolean;
  durationMs: number;
  aiAssisted?: boolean;
  overrideCount?: number;
}): void {
  const totalActions = 1;
  const aiActions = opts.aiAssisted ? 1 : 0;
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "command_centre_decision",
    step: opts.ok ? "complete" : "error",
    telemetry: {
      action_id: opts.actionId,
      duration_ms: opts.durationMs,
      total_actions: totalActions,
      ai_actions: aiActions,
      override_count: opts.overrideCount ?? 0,
      error_count: opts.ok ? 0 : 1,
    },
  });
}

// ─── Search Emitters ───────────────────────────────────────────────────────

export function emitSearchStart(opts: { flowId: string; query: string }): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "search_to_action",
    step: "start",
    telemetry: { query_length: opts.query.length, ts_start: Date.now() },
  });
}

export function emitSearchAction(opts: {
  flowId: string;
  resultClicked: boolean;
  durationMs: number;
  clarificationCount?: number;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "search_to_action",
    step: opts.resultClicked ? "complete" : "abandon",
    telemetry: {
      duration_ms: opts.durationMs,
      clarification_count: opts.clarificationCount ?? 0,
    },
  });
}

// ─── MWU Lifecycle Emitters ────────────────────────────────────────────────

export function emitMwuTransition(opts: {
  flowId: string;
  mwuId: string;
  step: "start" | "in_progress" | "complete" | "abandon" | "escalate";
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "mwu_lifecycle",
    step: opts.step,
    program_id: opts.programId,
    telemetry: { mwu_id: opts.mwuId, ts: Date.now() },
  });
}

// ─── Survey Emitters ───────────────────────────────────────────────────────

export function emitSurveyStart(opts: {
  flowId: string;
  surveyId: string;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "survey_participation",
    step: "start",
    asset_id: opts.surveyId,
    program_id: opts.programId,
    telemetry: { ts_start: Date.now() },
  });
}

export function emitSurveyComplete(opts: {
  flowId: string;
  surveyId: string;
  durationMs: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "survey_participation",
    step: "complete",
    asset_id: opts.surveyId,
    program_id: opts.programId,
    telemetry: { duration_ms: opts.durationMs },
  });
}

export function emitSurveyAbandon(opts: {
  flowId: string;
  surveyId: string;
  lastQuestion: number;
  totalQuestions: number;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "survey_participation",
    step: "abandon",
    asset_id: opts.surveyId,
    telemetry: {
      last_question: opts.lastQuestion,
      total_questions: opts.totalQuestions,
      completion_pct: Math.round(
        (opts.lastQuestion / opts.totalQuestions) * 100
      ),
    },
  });
}

// ─── Assessment Emitters ───────────────────────────────────────────────────

export function emitAssessmentStart(opts: {
  flowId: string;
  assessmentId: string;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "assessment_test",
    step: "start",
    asset_id: opts.assessmentId,
    program_id: opts.programId,
    telemetry: { ts_start: Date.now() },
  });
}

export function emitAssessmentComplete(opts: {
  flowId: string;
  assessmentId: string;
  durationMs: number;
  score?: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "assessment_test",
    step: "complete",
    asset_id: opts.assessmentId,
    program_id: opts.programId,
    telemetry: {
      duration_ms: opts.durationMs,
      ...(opts.score !== undefined && { assessment_score: opts.score }),
    },
  });
}

// ─── Training Emitters ─────────────────────────────────────────────────────

export function emitTrainingStart(opts: {
  flowId: string;
  moduleId: string;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "training_module",
    step: "start",
    asset_id: opts.moduleId,
    program_id: opts.programId,
    telemetry: { ts_start: Date.now() },
  });
}

export function emitTrainingComplete(opts: {
  flowId: string;
  moduleId: string;
  durationMs: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "training_module",
    step: "complete",
    asset_id: opts.moduleId,
    program_id: opts.programId,
    telemetry: { duration_ms: opts.durationMs },
  });
}

// ─── Agent Run Emitters ────────────────────────────────────────────────────

export function emitAgentRun(opts: {
  flowId: string;
  agentId: string;
  step: "start" | "complete" | "error" | "override" | "escalate";
  durationMs?: number;
  retries?: number;
  errors?: number;
  overrideCount?: number;
  aiActions?: number;
  totalActions?: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "agent_run",
    step: opts.step,
    agent_id: opts.agentId,
    program_id: opts.programId,
    telemetry: {
      duration_ms: opts.durationMs ?? 0,
      retry_count: opts.retries ?? 0,
      error_count: opts.errors ?? 0,
      override_count: opts.overrideCount ?? 0,
      ai_actions: opts.aiActions ?? 1,
      total_actions: opts.totalActions ?? 1,
    },
  });
}

// ─── Governance Gate Emitters ──────────────────────────────────────────────

export function emitGovernanceGate(opts: {
  flowId: string;
  gateId: string;
  step: "start" | "approve" | "reject" | "escalate" | "override";
  aiIntensityPct?: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "governance_gate",
    step: opts.step,
    asset_id: opts.gateId,
    program_id: opts.programId,
    telemetry: {
      ai_actions: opts.aiIntensityPct ?? 0,
      total_actions: 100,
      override_count: opts.step === "override" ? 1 : 0,
    },
  });
}

// ─── Asset Attribution Emitters ────────────────────────────────────────────

export function emitAssetView(opts: {
  flowId: string;
  assetId: string;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "asset_to_outcome",
    step: "start",
    asset_id: opts.assetId,
    program_id: opts.programId,
    telemetry: { ts_start: Date.now() },
  });
}

export function emitAssetOutcome(opts: {
  flowId: string;
  assetId: string;
  converted: boolean;
  durationMs: number;
  programId?: string;
}): void {
  aiOpsPush({
    flow_id: opts.flowId,
    flow_type: "asset_to_outcome",
    step: opts.converted ? "complete" : "abandon",
    asset_id: opts.assetId,
    program_id: opts.programId,
    telemetry: { duration_ms: opts.durationMs },
  });
}

// ─── React Hook ────────────────────────────────────────────────────────────

/**
 * useAiOpsFlow — convenience hook for component-level flow tracking
 *
 * Usage:
 *   const { flowId, done, fail } = useAiOpsFlow('widget_execution')
 *   // on mount → emits start
 *   // call done(durationMs) on success
 *   // call fail(durationMs) on error
 */
export function useAiOpsFlow(
  flowType: FlowType,
  opts?: {
    source?: string;
    programId?: string;
    assetId?: string;
    agentId?: string;
    telemetry?: Record<string, unknown>;
  }
): {
  flowId: string;
  done: (durationMs: number, extraTelemetry?: Record<string, unknown>) => void;
  fail: (durationMs: number, extraTelemetry?: Record<string, unknown>) => void;
} {
  const flowId = newFlowId();

  // Emit start immediately (called during render — fire and forget)
  aiOpsPush({
    flow_id: flowId,
    flow_type: flowType,
    step: "start",
    source: opts?.source,
    program_id: opts?.programId,
    asset_id: opts?.assetId,
    agent_id: opts?.agentId,
    telemetry: { ...opts?.telemetry, ts_start: Date.now() },
  });

  const done = (
    durationMs: number,
    extraTelemetry?: Record<string, unknown>
  ) => {
    aiOpsPush({
      flow_id: flowId,
      flow_type: flowType,
      step: "complete",
      source: opts?.source,
      program_id: opts?.programId,
      asset_id: opts?.assetId,
      agent_id: opts?.agentId,
      telemetry: { duration_ms: durationMs, ...extraTelemetry },
    });
  };

  const fail = (
    durationMs: number,
    extraTelemetry?: Record<string, unknown>
  ) => {
    aiOpsPush({
      flow_id: flowId,
      flow_type: flowType,
      step: "error",
      source: opts?.source,
      program_id: opts?.programId,
      asset_id: opts?.assetId,
      agent_id: opts?.agentId,
      telemetry: {
        duration_ms: durationMs,
        error_count: 1,
        ...extraTelemetry,
      },
    });
  };

  return { flowId, done, fail };
}
