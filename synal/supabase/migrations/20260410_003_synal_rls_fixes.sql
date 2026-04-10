-- 20260410_003_synal_rls_and_fixes.sql
-- Applied directly to S1 2026-04-10 — trigger cast fix + RLS enable

-- RLS already enabled via run_sql. This is the idempotent version.
ALTER TABLE synal.asset_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.action ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.command ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.value ENABLE ROW LEVEL SECURITY;
ALTER TABLE synal.event_log ENABLE ROW LEVEL SECURITY;

-- Fix touch_asset_counters enum cast bug (applied live 2026-04-10)
CREATE OR REPLACE FUNCTION synal.touch_asset_counters()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_table_name='signal' THEN
    UPDATE synal.asset_registry SET signal_count=signal_count+1, last_signal_at=now(),
      status=CASE WHEN status='REGISTERED'::synal.runtime_status THEN 'WIRED'::synal.runtime_status ELSE status END
    WHERE id=new.asset_id;
  ELSIF tg_table_name='task' THEN
    UPDATE synal.asset_registry SET task_count=task_count+1,
      status=CASE WHEN status IN ('REGISTERED','WIRED') THEN 'ACTIVE'::synal.runtime_status ELSE status END
    WHERE id=new.asset_id;
  ELSIF tg_table_name='flow' THEN
    UPDATE synal.asset_registry SET flow_count=flow_count+1,
      status=CASE WHEN status IN ('REGISTERED','WIRED') THEN 'ACTIVE'::synal.runtime_status ELSE status END
    WHERE id=new.asset_id;
  ELSIF tg_table_name='action' THEN
    UPDATE synal.asset_registry SET action_count=action_count+1, last_action_at=COALESCE(new.executed_at,now()),
      status=CASE WHEN status IN ('REGISTERED','WIRED','ACTIVE') THEN 'PROVING'::synal.runtime_status ELSE status END
    WHERE id=new.asset_id;
  ELSIF tg_table_name='proof' THEN
    UPDATE synal.asset_registry SET proof_count=proof_count+1, last_proof_at=now(),
      reality_status=new.classification,
      status=CASE WHEN new.classification='REAL'::synal.reality_status THEN 'REAL'::synal.runtime_status
                  WHEN new.classification='PARTIAL'::synal.reality_status THEN 'PROVING'::synal.runtime_status
                  ELSE 'PRETEND'::synal.runtime_status END
    WHERE id=new.asset_id;
  END IF;
  RETURN new;
END; $$;

