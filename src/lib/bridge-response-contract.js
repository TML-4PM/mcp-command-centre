"use strict";
/**
 * bridge-response-contract.js
 * Canonical 14-key response wrapper for all T4H Lambda bridge tools.
 * Import and call wrapResponse() before returning from any Lambda handler.
 *
 * Required shape enforced:
 *   success, phase_name, tool_name, action_type, started_at, completed_at,
 *   duration_ms, result_summary, raw_payload, evidence_refs,
 *   classification_hint, error_code, error_detail, rollback_available
 */

const REQUIRED_KEYS = [
  "success","phase_name","tool_name","action_type","started_at","completed_at",
  "duration_ms","result_summary","raw_payload","evidence_refs",
  "classification_hint","error_code","error_detail","rollback_available"
];

const VALID_HINTS = ["REAL","PARTIAL","PRETEND"];

/**
 * Wrap a Lambda result into the canonical bridge response contract.
 * @param {object} result    - Raw result from tool execution
 * @param {object} meta      - { tool_name, action_type, phase_name, started_at, rollback_available? }
 * @returns {object}         - Canonical 14-key response
 */
function wrapResponse(result, meta = {}) {
  const now = new Date().toISOString();
  const started = meta.started_at || now;
  const ms = Math.round(Date.now() - new Date(started).getTime());
  const success = result?.success !== false && !result?.errorMessage;

  const hint = success
    ? (result?.rows?.length > 0 || result?.affected_rows > 0 ? "REAL" : "PARTIAL")
    : "PRETEND";

  return {
    success,
    phase_name:           meta.phase_name   || "unknown",
    tool_name:            meta.tool_name    || "unknown",
    action_type:          meta.action_type  || "execute",
    started_at:           started,
    completed_at:         now,
    duration_ms:          ms,
    result_summary:       result?.rows
                            ? { rows_returned: result.rows.length }
                            : { affected: result?.affected_rows ?? 0 },
    raw_payload:          result ?? {},
    evidence_refs:        result?.evidence_refs || [],
    classification_hint:  VALID_HINTS.includes(result?.classification_hint)
                            ? result.classification_hint
                            : hint,
    error_code:           result?.errorMessage ? "LAMBDA_ERROR" : (result?.error_code || null),
    error_detail:         result?.errorMessage || result?.error_detail || null,
    rollback_available:   meta.rollback_available ?? false,
  };
}

/**
 * Validate that a response object contains all required keys.
 * Returns { valid, violations[] }
 */
function validateResponse(response) {
  const violations = REQUIRED_KEYS
    .filter(k => !(k in response))
    .map(k => ({ code: "MISSING_KEY", key: k }));

  if (response.classification_hint && !VALID_HINTS.includes(response.classification_hint)) {
    violations.push({ code: "INVALID_CLASSIFICATION_HINT", value: response.classification_hint });
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Express middleware / Lambda wrapper.
 * Wraps the entire handler output through wrapResponse before returning.
 */
function withContract(handler, meta = {}) {
  return async (event, context) => {
    const started_at = new Date().toISOString();
    try {
      const result = await handler(event, context);
      return wrapResponse(result, { ...meta, started_at });
    } catch (err) {
      return wrapResponse(
        { success: false, errorMessage: err.message, error_code: "HANDLER_EXCEPTION" },
        { ...meta, started_at }
      );
    }
  };
}

module.exports = { wrapResponse, validateResponse, withContract, REQUIRED_KEYS };
