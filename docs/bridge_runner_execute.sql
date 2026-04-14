-- ============================================================
-- bridge_runner_execute.sql
-- Executor: troy-sql-executor
-- Trigger: READY_FOR_PICKUP detected in bridge_runner/trigger.json
-- ============================================================

-- 1. Verify task substrate exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_task_queue') THEN
    RAISE EXCEPTION 'MISSING: t4h_task_queue not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_task_run') THEN
    RAISE EXCEPTION 'MISSING: t4h_task_run not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_task_dependency') THEN
    RAISE EXCEPTION 'MISSING: t4h_task_dependency not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_task_calendar_match') THEN
    RAISE EXCEPTION 'MISSING: t4h_task_calendar_match not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_launch_snapshot') THEN
    RAISE EXCEPTION 'MISSING: t4h_launch_snapshot not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t4h_board_pack_run') THEN
    RAISE EXCEPTION 'MISSING: t4h_board_pack_run not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='fn_t4h_task_dequeue') THEN
    RAISE EXCEPTION 'MISSING: fn_t4h_task_dequeue not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_t4h_tasks_open') THEN
    RAISE EXCEPTION 'MISSING: v_t4h_tasks_open not found';
  END IF;
END $$;

-- 2. Ensure new columns present on t4h_task_queue
ALTER TABLE public.t4h_task_queue
  ADD COLUMN IF NOT EXISTS business_key text,
  ADD COLUMN IF NOT EXISTS launch_key text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS bucket text,
  ADD COLUMN IF NOT EXISTS execution_type text,
  ADD COLUMN IF NOT EXISTS calendar_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calendar_mode text,
  ADD COLUMN IF NOT EXISTS calendar_owner_email text,
  ADD COLUMN IF NOT EXISTS calendar_event_type_slug text,
  ADD COLUMN IF NOT EXISTS evidence_status text NOT NULL DEFAULT 'PRETEND';

-- 3. Ensure new columns present on t4h_task_run
ALTER TABLE public.t4h_task_run
  ADD COLUMN IF NOT EXISTS runner text,
  ADD COLUMN IF NOT EXISTS logs text,
  ADD COLUMN IF NOT EXISTS evidence_status text NOT NULL DEFAULT 'PRETEND',
  ADD COLUMN IF NOT EXISTS finished_at timestamptz;

-- 4. Ensure new columns present on t4h_task_dependency
ALTER TABLE public.t4h_task_dependency
  ADD COLUMN IF NOT EXISTS dependency_type text NOT NULL DEFAULT 'hard',
  ADD COLUMN IF NOT EXISTS depends_on_task_id bigint;

-- 5. Idempotent table creates
CREATE TABLE IF NOT EXISTS public.t4h_task_calendar_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id bigint NOT NULL REFERENCES public.t4h_task_queue(task_id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'cal.com',
  owner_email text, event_type_slug text, event_type_id bigint,
  booking_uid text, booking_status text, booking_url text, meeting_url text,
  webhook_last_event text, webhook_last_at timestamptz,
  sync_status text NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending','matched','booked','rescheduled','cancelled','completed','failed')),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.t4h_launch_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key text NOT NULL, launch_key text NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  traffic_count numeric, signup_count numeric, booking_count numeric,
  conversion_rate numeric, revenue_amount numeric, refund_amount numeric,
  support_ticket_count numeric, uptime_pct numeric,
  severity1_incidents integer, severity2_incidents integer, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_key, launch_key, snapshot_date)
);

CREATE TABLE IF NOT EXISTS public.t4h_board_pack_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key text NOT NULL, launch_key text NOT NULL,
  period_start date, period_end date,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','complete','failed')),
  artifact_url text, summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.t4h_board_pack_artifact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_pack_run_id uuid NOT NULL REFERENCES public.t4h_board_pack_run(id) ON DELETE CASCADE,
  artifact_type text NOT NULL, title text NOT NULL,
  storage_path text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Dequeue function (bigint PK, idempotent)
CREATE OR REPLACE FUNCTION public.fn_t4h_task_dequeue(p_business_key text DEFAULT NULL)
RETURNS SETOF public.t4h_task_queue LANGUAGE sql AS $$
  SELECT q.* FROM public.t4h_task_queue q
  WHERE q.status = 'queued'
    AND (p_business_key IS NULL OR q.business_key = p_business_key)
    AND NOT EXISTS (
      SELECT 1 FROM public.t4h_task_dependency d
      JOIN public.t4h_task_queue dep ON dep.task_id = COALESCE(d.depends_on_task_id, d.depends_on)
      WHERE d.task_id = q.task_id
        AND COALESCE(d.dependency_type,'hard') = 'hard'
        AND dep.status <> 'complete'
    )
  ORDER BY q.priority ASC, q.created_at ASC LIMIT 25;
$$;

-- 7. Seed post-launch tasks (idempotent)
INSERT INTO public.t4h_task_queue
  (domain, task_type, intent_type, status, priority,
   business_key, launch_key, title, bucket, execution_type,
   assigned_agent, calendar_required, calendar_mode,
   calendar_owner_email, calendar_event_type_slug, execution_payload)
VALUES
  ('core-platform','report','safe_write','queued',1,
   'core-platform','post-launch-001','Generate launch board pack',
   'Board Pack','report','bridge-runner',false,'none',null,null,
   '{"action":"generate_board_pack"}'::jsonb),
  ('core-platform','bridge','evaluate','queued',1,
   'core-platform','post-launch-001','Review launch incidents and assign fixes',
   'Operations','bridge','bridge-runner',true,'availability_check',
   'troy.latter@gmail.com','incident-review','{"action":"incident_review"}'::jsonb),
  ('core-platform','calendar_sync','notify','queued',2,
   'core-platform','post-launch-001','Schedule customer follow-up sessions',
   'Customer','calendar_sync','bridge-runner',true,'booking',
   'troy.latter@gmail.com','customer-followup','{"action":"schedule_followups"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 8. Validation assertions
DO $$ DECLARE
  v_task_count int;
  v_dep_count int;
  v_view_exists boolean;
  v_fn_exists boolean;
BEGIN
  SELECT COUNT(*) INTO v_task_count FROM public.t4h_task_queue;
  SELECT COUNT(*) INTO v_dep_count FROM public.t4h_task_dependency;
  SELECT EXISTS(SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_t4h_tasks_open') INTO v_view_exists;
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='fn_t4h_task_dequeue') INTO v_fn_exists;

  IF v_task_count < 3 THEN RAISE EXCEPTION 'VALIDATION FAIL: task_count=% < 3', v_task_count; END IF;
  IF NOT v_view_exists THEN RAISE EXCEPTION 'VALIDATION FAIL: v_t4h_tasks_open missing'; END IF;
  IF NOT v_fn_exists THEN RAISE EXCEPTION 'VALIDATION FAIL: fn_t4h_task_dequeue missing'; END IF;

  RAISE NOTICE 'VALIDATION PASS: tasks=%, deps=%, view=%, fn=%', v_task_count, v_dep_count, v_view_exists, v_fn_exists;
END $$;

-- Final: return state
SELECT
  (SELECT COUNT(*) FROM public.t4h_task_queue)       AS task_count,
  (SELECT COUNT(*) FROM public.t4h_task_dependency)  AS dependency_count,
  (SELECT COUNT(*) FROM public.t4h_task_run)          AS run_count,
  EXISTS(SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_t4h_tasks_open') AS view_exists,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname='fn_t4h_task_dequeue') AS fn_exists,
  NOW() AS executed_at;
