-- =============================================================================
-- SIGNAL ENGINE (SE) — Ennead Signal-Decision-Execution Stack
-- Namespace: se_ prefix (avoids conflict with existing signals/businesses)
-- Linked to: t4h_business_registry.business_key
-- Axes: Function × Dimension × Signal × Surface = 6,561 cells
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSION
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. ENUM LOOKUP TABLES (9 each)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_functions (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_functions (key) VALUES
  ('finance'),('hr'),('legal'),('sales'),('marketing'),
  ('support'),('operations'),('product'),('leadership')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.se_dimensions (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_dimensions (key) VALUES
  ('demand'),('flow'),('delay'),('risk'),('value'),
  ('experience'),('compliance'),('efficiency'),('drift')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.se_signal_types (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_signal_types (key) VALUES
  ('user_message'),('direct_command'),('system_event'),
  ('state_change'),('scheduled_sweep'),('detected_pattern'),
  ('escalation_event'),('agent_request'),('external_trigger')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.se_surfaces (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_surfaces (key) VALUES
  ('individual'),('team'),('business_unit'),('organisation'),
  ('multi_org'),('industry_segment'),('national'),('regional'),('global')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.se_decision_modes (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_decision_modes (key) VALUES
  ('AUTONOMOUS'),('GATED'),('LOG_ONLY'),('BLOCKED')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.se_decision_actions (
  key TEXT PRIMARY KEY
);
INSERT INTO public.se_decision_actions (key) VALUES
  ('respond'),('notify'),('create_task'),('book'),('escalate'),('ignore')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. ASSISTANTS (linked to t4h_business_registry via business_key)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_assistants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_key  TEXT NOT NULL UNIQUE,
  business_key   TEXT NOT NULL,   -- FK concept to t4h_business_registry.business_key
  name           TEXT NOT NULL,
  channel        TEXT,            -- telegram / web / email / whatsapp
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_assistants_biz_idx ON public.se_assistants(business_key);

ALTER TABLE public.se_assistants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_assistants_svc ON public.se_assistants;
CREATE POLICY se_assistants_svc ON public.se_assistants
  USING (auth.role() = 'service_role');

-- Seed 3 assistants
INSERT INTO public.se_assistants (assistant_key, business_key, name, channel) VALUES
  ('wfa_support_telegram',  'work-family-ai',           'WFA Support',               'telegram'),
  ('or_support_telegram',   'outcome-ready',             'Outcome Ready Support',     'telegram'),
  ('ahc_support_telegram',  'augmented-humanity-coach',  'AHC Support',               'telegram')
ON CONFLICT (assistant_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. WEIGHTS (configurable per scope)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_weights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type  TEXT NOT NULL,   -- global / business / assistant / function
  scope_id    TEXT,            -- NULL for global
  category    TEXT NOT NULL,   -- dimension / surface / signal_type
  weight_key  TEXT NOT NULL,
  weight      NUMERIC(12,4) NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  version     TEXT NOT NULL DEFAULT '1.0',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS se_weights_uq
  ON public.se_weights(scope_type, COALESCE(scope_id,''), category, weight_key, version);

ALTER TABLE public.se_weights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_weights_svc ON public.se_weights;
CREATE POLICY se_weights_svc ON public.se_weights
  USING (auth.role() = 'service_role');

-- Seed global defaults
INSERT INTO public.se_weights(scope_type, scope_id, category, weight_key, weight, version) VALUES
  ('global',NULL,'dimension','demand',5,'1.0'),
  ('global',NULL,'dimension','flow',6,'1.0'),
  ('global',NULL,'dimension','delay',7,'1.0'),
  ('global',NULL,'dimension','risk',9,'1.0'),
  ('global',NULL,'dimension','value',8,'1.0'),
  ('global',NULL,'dimension','experience',5,'1.0'),
  ('global',NULL,'dimension','compliance',9,'1.0'),
  ('global',NULL,'dimension','efficiency',6,'1.0'),
  ('global',NULL,'dimension','drift',7,'1.0'),
  ('global',NULL,'surface','individual',1,'1.0'),
  ('global',NULL,'surface','team',2,'1.0'),
  ('global',NULL,'surface','business_unit',3,'1.0'),
  ('global',NULL,'surface','organisation',5,'1.0'),
  ('global',NULL,'surface','multi_org',6,'1.0'),
  ('global',NULL,'surface','industry_segment',7,'1.0'),
  ('global',NULL,'surface','national',8,'1.0'),
  ('global',NULL,'surface','regional',8,'1.0'),
  ('global',NULL,'surface','global',9,'1.0'),
  ('global',NULL,'signal_type','user_message',4,'1.0'),
  ('global',NULL,'signal_type','direct_command',9,'1.0'),
  ('global',NULL,'signal_type','system_event',6,'1.0'),
  ('global',NULL,'signal_type','state_change',7,'1.0'),
  ('global',NULL,'signal_type','scheduled_sweep',5,'1.0'),
  ('global',NULL,'signal_type','detected_pattern',8,'1.0'),
  ('global',NULL,'signal_type','escalation_event',9,'1.0'),
  ('global',NULL,'signal_type','agent_request',6,'1.0'),
  ('global',NULL,'signal_type','external_trigger',7,'1.0'),
  -- Business overrides
  ('business','outcome-ready','dimension','compliance',10,'1.0'),
  ('business','outcome-ready','dimension','risk',10,'1.0'),
  ('business','augmented-humanity-coach','dimension','value',9,'1.0'),
  ('business','augmented-humanity-coach','dimension','experience',8,'1.0'),
  ('business','work-family-ai','dimension','flow',7,'1.0'),
  ('business','work-family-ai','dimension','efficiency',8,'1.0')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. SIGNALS (full ennead schema)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT,
  source          TEXT NOT NULL,
  signal_type     TEXT NOT NULL REFERENCES public.se_signal_types(key),
  business_key    TEXT NOT NULL,
  assistant_key   TEXT,

  function_key    TEXT NOT NULL REFERENCES public.se_functions(key),
  dimension_key   TEXT NOT NULL REFERENCES public.se_dimensions(key),
  surface_key     TEXT NOT NULL REFERENCES public.se_surfaces(key),

  user_id         TEXT,
  conversation_id TEXT,
  priority        TEXT DEFAULT 'normal',
  confidence      NUMERIC(5,4) DEFAULT 1.0000,
  urgency         NUMERIC(8,4) DEFAULT 1.0000,

  title           TEXT,
  content         TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB,

  score           NUMERIC(12,4),
  classification  JSONB,
  status          TEXT NOT NULL DEFAULT 'new',  -- new/evaluated/executed/escalated/ignored/failed

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_signals_biz_idx    ON public.se_signals(business_key);
CREATE INDEX IF NOT EXISTS se_signals_status_idx ON public.se_signals(status);
CREATE INDEX IF NOT EXISTS se_signals_created_idx ON public.se_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS se_signals_type_idx   ON public.se_signals(signal_type);
CREATE INDEX IF NOT EXISTS se_signals_score_idx  ON public.se_signals(score DESC NULLS LAST);

ALTER TABLE public.se_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_signals_svc ON public.se_signals;
CREATE POLICY se_signals_svc ON public.se_signals
  USING (auth.role() = 'service_role');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.se_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_se_signals_updated_at ON public.se_signals;
CREATE TRIGGER trg_se_signals_updated_at
  BEFORE UPDATE ON public.se_signals
  FOR EACH ROW EXECUTE FUNCTION public.se_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. DECISION RULES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_decision_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key    TEXT,
  assistant_key   TEXT,
  rule_name       TEXT NOT NULL,
  priority        INT NOT NULL DEFAULT 100,
  active          BOOLEAN NOT NULL DEFAULT TRUE,

  match_all       JSONB NOT NULL DEFAULT '[]'::JSONB,
  match_any       JSONB NOT NULL DEFAULT '[]'::JSONB,
  score_min       NUMERIC(12,4),
  score_max       NUMERIC(12,4),

  action_key      TEXT NOT NULL REFERENCES public.se_decision_actions(key),
  mode_key        TEXT NOT NULL REFERENCES public.se_decision_modes(key),
  response_template TEXT,
  params          JSONB NOT NULL DEFAULT '{}'::JSONB,

  version         TEXT NOT NULL DEFAULT '1.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_rules_biz_idx ON public.se_decision_rules(business_key, active, priority);

ALTER TABLE public.se_decision_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_rules_svc ON public.se_decision_rules;
CREATE POLICY se_rules_svc ON public.se_decision_rules
  USING (auth.role() = 'service_role');

-- Seed rules: WFA
INSERT INTO public.se_decision_rules(business_key,assistant_key,rule_name,priority,match_all,match_any,score_min,action_key,mode_key,response_template,params)
VALUES
  ('work-family-ai','wfa_support_telegram','WFA escalate critical risk',10,
   '[{"field":"dimension_key","operator":"eq","value":"risk"}]',
   '[{"field":"signal_type","operator":"eq","value":"escalation_event"}]',
   90,'escalate','GATED','This looks critical — escalating now.','{"queue":"critical_ops"}'),
  ('work-family-ai','wfa_support_telegram','WFA book session',20,
   '[{"field":"signal_type","operator":"eq","value":"user_message"}]',
   '[{"field":"content","operator":"contains","value":"book"},{"field":"content","operator":"contains","value":"appointment"},{"field":"content","operator":"contains","value":"session"}]',
   NULL,'book','AUTONOMOUS','I can help with that booking — starting the flow now.','{"flow":"wfa_booking"}'),
  ('work-family-ai','wfa_support_telegram','WFA default respond',999,
   '[]','[]',NULL,'respond','AUTONOMOUS','Thanks — received and processing.','{}'),
-- OR rules
  ('outcome-ready','or_support_telegram','OR compliance escalation',10,
   '[{"field":"dimension_key","operator":"eq","value":"compliance"}]',
   '[{"field":"content","operator":"contains","value":"incident"},{"field":"content","operator":"contains","value":"breach"},{"field":"content","operator":"contains","value":"complaint"}]',
   80,'escalate','GATED','Escalated for compliance review.','{"queue":"or_compliance"}'),
  ('outcome-ready','or_support_telegram','OR booking support',20,
   '[{"field":"signal_type","operator":"eq","value":"user_message"}]',
   '[{"field":"content","operator":"contains","value":"book"},{"field":"content","operator":"contains","value":"session"}]',
   NULL,'book','AUTONOMOUS','Starting the booking flow for you now.','{"flow":"or_booking"}'),
  ('outcome-ready','or_support_telegram','OR default respond',999,
   '[]','[]',NULL,'respond','AUTONOMOUS','Received — I will help from here.','{}'),
-- AHC rules
  ('augmented-humanity-coach','ahc_support_telegram','AHC qualification',20,
   '[{"field":"signal_type","operator":"eq","value":"user_message"}]',
   '[{"field":"content","operator":"contains","value":"workshop"},{"field":"content","operator":"contains","value":"strategy"},{"field":"content","operator":"contains","value":"advisory"}]',
   NULL,'notify','AUTONOMOUS','Captured — moving to the next step.','{"flow":"ahc_qualification"}'),
  ('augmented-humanity-coach','ahc_support_telegram','AHC default respond',999,
   '[]','[]',NULL,'respond','AUTONOMOUS','Thanks — I have your message and will help from here.','{}')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. DECISIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_decisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id     UUID NOT NULL REFERENCES public.se_signals(id) ON DELETE CASCADE,
  rule_id       UUID REFERENCES public.se_decision_rules(id) ON DELETE SET NULL,
  action_key    TEXT NOT NULL REFERENCES public.se_decision_actions(key),
  mode_key      TEXT NOT NULL REFERENCES public.se_decision_modes(key),
  score         NUMERIC(12,4),
  confidence    NUMERIC(8,4),
  reason        TEXT,
  response_text TEXT,
  params        JSONB NOT NULL DEFAULT '{}'::JSONB,
  status        TEXT NOT NULL DEFAULT 'created',  -- created/executed/blocked/failed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_decisions_signal_idx ON public.se_decisions(signal_id);
CREATE INDEX IF NOT EXISTS se_decisions_status_idx ON public.se_decisions(status);

ALTER TABLE public.se_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_decisions_svc ON public.se_decisions;
CREATE POLICY se_decisions_svc ON public.se_decisions
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 7. EXECUTIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id     UUID NOT NULL REFERENCES public.se_decisions(id) ON DELETE CASCADE,
  channel         TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  result_payload  JSONB NOT NULL DEFAULT '{}'::JSONB,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending/sent/failed/skipped
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_executions_decision_idx ON public.se_executions(decision_id);

ALTER TABLE public.se_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_executions_svc ON public.se_executions;
CREATE POLICY se_executions_svc ON public.se_executions
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 8. EXECUTION TASKS (SQS task queue mirror)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.execution_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type   TEXT NOT NULL,   -- github_push/lambda_deploy/bridge_invoke/signal_process/execute_decision
  business_key TEXT,
  status      TEXT NOT NULL DEFAULT 'queued',  -- queued/running/completed/failed/retrying
  payload     JSONB NOT NULL DEFAULT '{}'::JSONB,
  result      JSONB,
  attempts    INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_msg   TEXT,
  sqs_message_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS execution_tasks_status_idx  ON public.execution_tasks(status);
CREATE INDEX IF NOT EXISTS execution_tasks_type_idx    ON public.execution_tasks(task_type);
CREATE INDEX IF NOT EXISTS execution_tasks_created_idx ON public.execution_tasks(created_at DESC);

ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS execution_tasks_svc ON public.execution_tasks;
CREATE POLICY execution_tasks_svc ON public.execution_tasks
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_execution_tasks_updated_at ON public.execution_tasks;
CREATE TRIGGER trg_execution_tasks_updated_at
  BEFORE UPDATE ON public.execution_tasks
  FOR EACH ROW EXECUTE FUNCTION public.se_set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. ACTION QUEUE (booking / escalation / notify buffer)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.se_action_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type  TEXT NOT NULL,   -- booking/escalation/notify
  business_key TEXT,
  assistant_key TEXT,
  signal_id   UUID,
  decision_id UUID,
  status      TEXT NOT NULL DEFAULT 'queued',
  payload     JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.se_action_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS se_action_queue_svc ON public.se_action_queue;
CREATE POLICY se_action_queue_svc ON public.se_action_queue
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_se_action_queue_updated_at ON public.se_action_queue;
CREATE TRIGGER trg_se_action_queue_updated_at
  BEFORE UPDATE ON public.se_action_queue
  FOR EACH ROW EXECUTE FUNCTION public.se_set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. LATTICE VIEW (6,561 cell model — active signals only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_se_lattice_activity AS
SELECT
  s.function_key,
  s.dimension_key,
  s.signal_type,
  s.surface_key,
  s.business_key,
  COUNT(*) AS signal_count,
  AVG(s.score) AS avg_score,
  MAX(s.score) AS max_score,
  SUM(CASE WHEN s.status = 'evaluated' THEN 1 ELSE 0 END) AS evaluated,
  SUM(CASE WHEN s.status = 'executed' THEN 1 ELSE 0 END) AS executed,
  MAX(s.created_at) AS last_signal_at
FROM public.se_signals s
GROUP BY s.function_key, s.dimension_key, s.signal_type, s.surface_key, s.business_key;

-- ---------------------------------------------------------------------------
-- 11. SCORING SUMMARY VIEW
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_se_decision_summary AS
SELECT
  s.business_key,
  s.function_key,
  s.dimension_key,
  s.surface_key,
  d.action_key,
  d.mode_key,
  COUNT(*) AS decision_count,
  AVG(d.score) AS avg_score,
  MAX(d.score) AS max_score,
  SUM(CASE WHEN d.status = 'executed' THEN 1 ELSE 0 END) AS executed,
  MAX(s.created_at) AS last_at
FROM public.se_decisions d
JOIN public.se_signals s ON s.id = d.signal_id
GROUP BY s.business_key, s.function_key, s.dimension_key, s.surface_key, d.action_key, d.mode_key;

-- ---------------------------------------------------------------------------
-- 12. SCORING FUNCTION (callable via bridge)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_se_compute_score(
  p_business_key TEXT,
  p_function_key TEXT,
  p_dimension_key TEXT,
  p_signal_type TEXT,
  p_surface_key TEXT,
  p_confidence NUMERIC DEFAULT 1.0,
  p_urgency NUMERIC DEFAULT 1.0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_dim_w NUMERIC;
  v_surf_w NUMERIC;
  v_sig_w NUMERIC;
  v_base NUMERIC;
  v_final NUMERIC;
BEGIN
  -- dimension weight: business override > global
  SELECT COALESCE(
    (SELECT weight FROM public.se_weights WHERE scope_type='business' AND scope_id=p_business_key AND category='dimension' AND weight_key=p_dimension_key AND active LIMIT 1),
    (SELECT weight FROM public.se_weights WHERE scope_type='global' AND scope_id IS NULL AND category='dimension' AND weight_key=p_dimension_key AND active LIMIT 1),
    1.0
  ) INTO v_dim_w;

  SELECT COALESCE(
    (SELECT weight FROM public.se_weights WHERE scope_type='business' AND scope_id=p_business_key AND category='surface' AND weight_key=p_surface_key AND active LIMIT 1),
    (SELECT weight FROM public.se_weights WHERE scope_type='global' AND scope_id IS NULL AND category='surface' AND weight_key=p_surface_key AND active LIMIT 1),
    1.0
  ) INTO v_surf_w;

  SELECT COALESCE(
    (SELECT weight FROM public.se_weights WHERE scope_type='business' AND scope_id=p_business_key AND category='signal_type' AND weight_key=p_signal_type AND active LIMIT 1),
    (SELECT weight FROM public.se_weights WHERE scope_type='global' AND scope_id IS NULL AND category='signal_type' AND weight_key=p_signal_type AND active LIMIT 1),
    1.0
  ) INTO v_sig_w;

  v_base  := (v_dim_w * 5) + (v_surf_w * 3) + (v_sig_w * 2);
  v_final := v_base * p_confidence * p_urgency;

  RETURN jsonb_build_object(
    'dimension_weight', v_dim_w,
    'surface_weight',   v_surf_w,
    'signal_type_weight', v_sig_w,
    'base_score',       ROUND(v_base, 4),
    'final_score',      ROUND(v_final, 4)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 13. REGISTER IN mcp_lambda_registry
-- ---------------------------------------------------------------------------

INSERT INTO public.mcp_lambda_registry
  (function_name, description, business_key, autonomy_tier, invocation_pattern, active, is_rd, project_code, created_at)
VALUES
  ('troy-signal-engine',   'Ennead signal ingest + score + decision engine',   'tech-for-humanity', 'AUTONOMOUS', 'DIRECT', TRUE, TRUE, 'WFAI-SE', NOW()),
  ('troy-signal-executor', 'Ennead decision executor — Telegram/booking/queue', 'tech-for-humanity', 'GATED',      'ASYNC',  TRUE, TRUE, 'WFAI-SE', NOW()),
  ('troy-worker',          'SQS-triggered cloud worker — all task types',       'tech-for-humanity', 'AUTONOMOUS', 'QUEUE',  TRUE, FALSE,'WFAI-SE', NOW())
ON CONFLICT (function_name) DO UPDATE SET
  description = EXCLUDED.description,
  active      = TRUE;

-- ---------------------------------------------------------------------------
-- 14. COMMAND CENTRE PAGE + CCQs
-- ---------------------------------------------------------------------------

INSERT INTO public.command_centre_pages (page_key, title, description, sort_order, active)
VALUES ('ennead-signals', 'Ennead Signal Engine', 'Signal-decision-execution lattice (Function × Dimension × Signal × Surface)', 95, TRUE)
ON CONFLICT (page_key) DO NOTHING;

INSERT INTO public.command_centre_queries (page_key, query_key, title, sql, sort_order, active)
VALUES
  ('ennead-signals','se_live_signals','Live Signals (last 50)',
   'SELECT id, business_key, function_key, dimension_key, signal_type, surface_key, score, status, created_at FROM public.se_signals ORDER BY created_at DESC LIMIT 50',
   10, TRUE),
  ('ennead-signals','se_decision_feed','Decision Feed (last 50)',
   'SELECT d.id, s.business_key, d.action_key, d.mode_key, d.score, d.reason, d.status, d.created_at FROM public.se_decisions d JOIN public.se_signals s ON s.id=d.signal_id ORDER BY d.created_at DESC LIMIT 50',
   20, TRUE),
  ('ennead-signals','se_lattice_activity','Active Lattice Cells',
   'SELECT function_key, dimension_key, signal_type, surface_key, business_key, signal_count, ROUND(avg_score,2) avg_score, max_score, last_signal_at FROM public.v_se_lattice_activity ORDER BY signal_count DESC LIMIT 100',
   30, TRUE),
  ('ennead-signals','se_weights_config','Weight Configuration',
   'SELECT scope_type, COALESCE(scope_id,''global'') scope, category, weight_key, weight, version, active FROM public.se_weights ORDER BY scope_type, category, weight_key',
   40, TRUE),
  ('ennead-signals','se_execution_tasks','Execution Task Queue',
   'SELECT id, task_type, business_key, status, attempts, error_msg, created_at FROM public.execution_tasks ORDER BY created_at DESC LIMIT 50',
   50, TRUE)
ON CONFLICT (page_key, query_key) DO UPDATE SET
  sql    = EXCLUDED.sql,
  title  = EXCLUDED.title,
  active = TRUE;
