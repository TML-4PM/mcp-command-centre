-- ============================================================
-- T4H Control Tower Schema
-- Pack: T4H_CT_SEAL_TO_REAL_V1
-- Schema: control_tower
-- RDTI: is_rd=true, project_code=T4H-CTEL
-- Idempotent: all CREATE IF NOT EXISTS / OR REPLACE
-- ============================================================

CREATE SCHEMA IF NOT EXISTS control_tower;

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS control_tower.organ_unit (
  ou_key                text PRIMARY KEY,
  title                 text NOT NULL,
  biz_key               text NOT NULL,
  purpose               text NOT NULL,
  owner_layer           text NOT NULL CHECK (owner_layer IN ('human','agent','hybrid','autonomous')),
  architecture_level    int  NOT NULL DEFAULT 35,
  automation_level      int  NOT NULL DEFAULT 20,
  wave_target           int  NOT NULL DEFAULT 10,
  truth_state           text NOT NULL DEFAULT 'PARTIAL'
    CHECK (truth_state IN ('REAL','PARTIAL','PRETEND')),
  current_status        text NOT NULL DEFAULT 'planned'
    CHECK (current_status IN (
      'planned','forged','registered','bound','swept','proved',
      'scheduled','monitored','recoverable','complete','degraded','retired'
    )),
  repo_url              text,
  invoke_function_name  text,
  command_centre_slug   text,
  trigger_types         text[] NOT NULL DEFAULT '{}',
  recovery_strategy     text,
  schedule_type         text,
  schedule_ref          text,
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  last_validated_at     timestamptz,
  last_executed_at      timestamptz,
  last_proved_at        timestamptz
);

CREATE TABLE IF NOT EXISTS control_tower.organ_unit_gate (
  ou_key                  text PRIMARY KEY
    REFERENCES control_tower.organ_unit(ou_key) ON DELETE CASCADE,
  registry_bound          boolean NOT NULL DEFAULT false,
  bridge_invokable        boolean NOT NULL DEFAULT false,
  trigger_defined         boolean NOT NULL DEFAULT false,
  telemetry_visible       boolean NOT NULL DEFAULT false,
  command_centre_visible  boolean NOT NULL DEFAULT false,
  dry_run_passed          boolean NOT NULL DEFAULT false,
  live_run_passed         boolean NOT NULL DEFAULT false,
  proof_captured          boolean NOT NULL DEFAULT false,
  recovery_verified       boolean NOT NULL DEFAULT false,
  schedule_active         boolean NOT NULL DEFAULT false,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_tower.organ_unit_event (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ou_key            text NOT NULL
    REFERENCES control_tower.organ_unit(ou_key) ON DELETE CASCADE,
  event_type        text NOT NULL,
  execution_mode    text,
  truth_state_before text,
  truth_state_after  text,
  execution_status  text,
  evidence_ref      text,
  error_ref         text,
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_tower.organ_unit_proof (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ou_key       text NOT NULL
    REFERENCES control_tower.organ_unit(ou_key) ON DELETE CASCADE,
  proof_class  text NOT NULL
    CHECK (proof_class IN ('structural','runtime','data','control_plane','recovery')),
  proof_name   text NOT NULL,
  proof_status text NOT NULL CHECK (proof_status IN ('pass','fail','warn')),
  evidence_ref text,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_tower.organ_unit_dependency (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ou_key            text NOT NULL
    REFERENCES control_tower.organ_unit(ou_key) ON DELETE CASCADE,
  depends_on_ou_key text NOT NULL,
  dependency_type   text NOT NULL DEFAULT 'hard',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_tower.legacy_asset_inventory (
  asset_key      text PRIMARY KEY,
  asset_type     text NOT NULL,
  source_system  text NOT NULL,
  source_ref     text,
  title          text,
  mapped_ou_key  text,
  truth_state    text NOT NULL DEFAULT 'PRETEND'
    CHECK (truth_state IN ('REAL','PARTIAL','PRETEND')),
  current_status text NOT NULL DEFAULT 'discovered',
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  notes          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS control_tower.execution_run (
  run_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type    text NOT NULL
    CHECK (run_type IN ('forge','sweep','prove','rehydrate','recover','execute')),
  scope       text NOT NULL,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  run_status  text NOT NULL DEFAULT 'running'
    CHECK (run_status IN ('running','passed','failed','partial')),
  summary     jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ------------------------------------------------------------
-- FUNCTIONS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION control_tower.fn_ou_is_complete(p_ou_key text)
RETURNS boolean
LANGUAGE sql AS
$$
  SELECT
    g.registry_bound
    AND g.bridge_invokable
    AND g.trigger_defined
    AND g.telemetry_visible
    AND g.command_centre_visible
    AND g.dry_run_passed
    AND g.live_run_passed
    AND g.proof_captured
    AND g.recovery_verified
    AND g.schedule_active
    AND u.truth_state = 'REAL'
  FROM control_tower.organ_unit_gate g
  JOIN control_tower.organ_unit u ON u.ou_key = g.ou_key
  WHERE g.ou_key = p_ou_key
$$;

CREATE OR REPLACE FUNCTION control_tower.fn_ou_recompute_status(p_ou_key text)
RETURNS void
LANGUAGE plpgsql AS
$fn$
DECLARE
  v_complete boolean;
BEGIN
  SELECT control_tower.fn_ou_is_complete(p_ou_key) INTO v_complete;

  IF v_complete THEN
    UPDATE control_tower.organ_unit
    SET current_status = 'complete',
        updated_at     = now(),
        truth_state    = 'REAL'
    WHERE ou_key = p_ou_key;
  ELSE
    UPDATE control_tower.organ_unit
    SET current_status = CASE
          WHEN truth_state = 'PRETEND' THEN 'planned'
          ELSE 'degraded'
        END,
        updated_at = now()
    WHERE ou_key = p_ou_key;
  END IF;
END;
$fn$;

-- ------------------------------------------------------------
-- VIEWS
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW control_tower.v_ou_status AS
SELECT
  u.ou_key, u.title, u.biz_key, u.truth_state, u.current_status,
  u.invoke_function_name, u.trigger_types,
  u.last_validated_at, u.last_executed_at, u.last_proved_at,
  g.registry_bound, g.bridge_invokable, g.trigger_defined,
  g.telemetry_visible, g.command_centre_visible,
  g.dry_run_passed, g.live_run_passed, g.proof_captured,
  g.recovery_verified, g.schedule_active
FROM control_tower.organ_unit u
JOIN control_tower.organ_unit_gate g ON g.ou_key = u.ou_key;

CREATE OR REPLACE VIEW control_tower.v_ctel_summary AS
SELECT
  count(*)                                                AS total_ou,
  count(*) FILTER (WHERE truth_state = 'REAL')            AS real_count,
  count(*) FILTER (WHERE truth_state = 'PARTIAL')         AS partial_count,
  count(*) FILTER (WHERE truth_state = 'PRETEND')         AS pretend_count,
  count(*) FILTER (WHERE current_status = 'complete')     AS complete_count,
  count(*) FILTER (WHERE current_status = 'degraded')     AS degraded_count
FROM control_tower.organ_unit;

CREATE OR REPLACE VIEW control_tower.v_legacy_inventory_summary AS
SELECT
  count(*)                                                AS total_assets,
  count(*) FILTER (WHERE truth_state = 'REAL')            AS real_assets,
  count(*) FILTER (WHERE truth_state = 'PARTIAL')         AS partial_assets,
  count(*) FILTER (WHERE truth_state = 'PRETEND')         AS pretend_assets
FROM control_tower.legacy_asset_inventory;
