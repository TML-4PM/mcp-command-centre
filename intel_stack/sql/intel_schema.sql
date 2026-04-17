-- Intel Stack Schema — S1 Supabase (lzfgigiyqpuuxslsygjt)
-- Schema: intel
-- Version: 2.0 — 2026-04-09
-- RDTI: is_rd=true, project_code=INTEL-01
-- Idempotent: safe to re-run

CREATE SCHEMA IF NOT EXISTS intel;

-- ── TABLES ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intel.notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text NOT NULL,
  source_hash  text UNIQUE,                        -- SHA256 dedup key
  raw_text     text,
  summary      text,
  tags         text[],
  is_rd        boolean DEFAULT true,               -- RDTI flag
  project_code text DEFAULT 'INTEL-01',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.assumptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id      uuid REFERENCES intel.notes(id) ON DELETE SET NULL,
  assumption   text NOT NULL,
  challenge    text,
  status       text DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_at  timestamptz,
  is_rd        boolean DEFAULT true,
  project_code text DEFAULT 'INTEL-01',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.email_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   text UNIQUE,                        -- Gmail message ID dedup
  sender       text,
  subject      text,
  body         text,
  processed    boolean DEFAULT false,
  campaign_id  text,
  is_rd        boolean DEFAULT true,
  project_code text DEFAULT 'INTEL-01',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.decisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context      text NOT NULL,
  options      jsonb,
  decision     text,
  rationale    text,
  outcome      text,
  is_rd        boolean DEFAULT true,
  project_code text DEFAULT 'INTEL-01',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.run_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           text UNIQUE NOT NULL,            -- intel-run-YYYYMMDD-NNN
  fn               text,                            -- Lambda fn name
  action           text,
  status           text DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  notes_processed  int DEFAULT 0,
  emails_processed int DEFAULT 0,
  challenges_gen   int DEFAULT 0,
  rows_written     int DEFAULT 0,
  error            text,
  execution_ms     int,
  is_rd            boolean DEFAULT true,
  project_code     text DEFAULT 'INTEL-01',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_intel_notes_source_hash ON intel.notes(source_hash);
CREATE INDEX IF NOT EXISTS idx_intel_notes_created     ON intel.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_assumptions_status ON intel.assumptions(status);
CREATE INDEX IF NOT EXISTS idx_intel_email_message_id  ON intel.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_intel_run_log_status    ON intel.run_log(status, created_at DESC);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION intel.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['notes','assumptions','email_events','decisions','run_log']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
        AND tgrelid = ('intel.' || t)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON intel.%s FOR EACH ROW EXECUTE FUNCTION intel.set_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE intel.notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.assumptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.email_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.decisions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.run_log        ENABLE ROW LEVEL SECURITY;

-- Service role full access (bridge Lambda uses service role)
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['notes','assumptions','email_events','decisions','run_log']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='intel' AND tablename=t AND policyname='service_role_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY service_role_all ON intel.%s TO service_role USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;
