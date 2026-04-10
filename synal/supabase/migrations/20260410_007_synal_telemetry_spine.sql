-- 007_synal_telemetry_spine.sql
-- Synal telemetry: ai_events, ai_daily_metrics, analysis views
-- Applied 2026-04-10 via audit pass

CREATE TABLE IF NOT EXISTS public.ai_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid,
  org_id                  uuid,
  session_id              uuid,
  ts                      timestamptz NOT NULL DEFAULT now(),
  surface                 text,
  source_app              text,
  event_type              text NOT NULL,
  page_url                text,
  domain                  text,
  title                   text,
  tab_count               int,
  window_count            int,
  active_selection_chars  int,
  intent                  text,
  impact_area             text,
  value_score             text,
  success                 boolean,
  latency_ms              int,
  follow_on_action        text,
  assistant_shown         boolean,
  assistant_used          boolean,
  raw                     jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_events_ts       ON public.ai_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_user     ON public.ai_events (user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_domain   ON public.ai_events (domain);
CREATE INDEX IF NOT EXISTS idx_ai_events_type     ON public.ai_events (event_type);

CREATE TABLE IF NOT EXISTS public.ai_daily_metrics (
  user_id                uuid NOT NULL,
  date                   date NOT NULL,
  snaps                  int NOT NULL DEFAULT 0,
  active_time_minutes    int NOT NULL DEFAULT 0,
  avg_tab_count          float NOT NULL DEFAULT 0,
  success_rate           float NOT NULL DEFAULT 0,
  focus_score            float NOT NULL DEFAULT 0,
  friction_score         float NOT NULL DEFAULT 0,
  augmentation_score     float NOT NULL DEFAULT 0,
  strain_score           float NOT NULL DEFAULT 0,
  opportunity_score      float NOT NULL DEFAULT 0,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.ai_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Analysis views
CREATE OR REPLACE VIEW public.v_user_day_signals AS
SELECT
  user_id,
  date(ts) AS date,
  count(*) FILTER (WHERE event_type = 'snap_created') AS snaps,
  avg(tab_count)                                       AS avg_tab_count,
  avg(CASE WHEN success THEN 1 ELSE 0 END)             AS success_rate,
  avg(CASE WHEN tab_count <= 8  THEN 1
           WHEN tab_count <= 15 THEN 0.5
           ELSE 0 END)                                 AS focus_score,
  avg(CASE WHEN latency_ms > 1000 OR success = false THEN 1 ELSE 0 END) AS friction_score,
  avg(CASE WHEN assistant_used = true THEN 1 ELSE 0 END) AS augmentation_score,
  avg(CASE WHEN tab_count > 20 THEN 1 ELSE 0 END)     AS strain_score
FROM public.ai_events
GROUP BY user_id, date(ts);

CREATE OR REPLACE VIEW public.v_sweet_spots AS
SELECT user_id, date, focus_score, success_rate, snaps
FROM public.v_user_day_signals
WHERE focus_score > 0.7 AND success_rate > 0.7;

CREATE OR REPLACE VIEW public.v_dark_spots AS
SELECT user_id, date, strain_score, friction_score, snaps
FROM public.v_user_day_signals
WHERE strain_score > 0.7 OR friction_score > 0.5;

CREATE OR REPLACE VIEW public.v_repeat_without_outcome AS
SELECT user_id, domain, count(*) AS snaps
FROM public.ai_events
WHERE event_type = 'snap_created'
  AND follow_on_action IS NULL
GROUP BY user_id, domain
HAVING count(*) > 3;

-- RLS on synal tables (idempotent)
ALTER TABLE public.synal_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synal_proof        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synal_agent_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synal_task_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synal_task_actions ENABLE ROW LEVEL SECURITY;
