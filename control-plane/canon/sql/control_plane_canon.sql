-- T4H Control Plane Canon Injector Schema v1.0
-- idempotent | rdti: is_rd=true, project_code=CP-CANON-001
create schema if not exists control_plane;

create table if not exists control_plane.prompt_profile (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null,
  version text not null default '1.0',
  target_model_family text not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists prompt_profile_uq on control_plane.prompt_profile(profile_key, version, target_model_family);

create table if not exists control_plane.injection_rule (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  trigger_type text not null,
  severity text not null,
  command_to_inject text not null,
  applies_to_model_family text default 'all',
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists control_plane.session_state (
  id uuid primary key default gen_random_uuid(),
  session_key text not null,
  model_family text not null,
  biz_key text,
  thread_key text,
  task_type text,
  canon_version text default '1.0',
  alignment_state text default 'ALIGNED',
  last_command text,
  last_drift_score int default 0,
  last_classification text,
  last_injected_at timestamptz,
  last_checked_at timestamptz default now(),
  support_state text default 'MONITORED',
  created_at timestamptz default now()
);
create unique index if not exists session_state_uq on control_plane.session_state(session_key, model_family);

create table if not exists control_plane.drift_event (
  id uuid primary key default gen_random_uuid(),
  session_key text,
  model_family text,
  biz_key text,
  thread_key text,
  trigger_type text,
  severity text,
  drift_score int default 0,
  detected_from text,
  action_taken text,
  pre_state text,
  post_state text,
  canon_version text default '1.0',
  classification text,
  evidence jsonb,
  resolved boolean default false,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists control_plane.command_registry (
  id uuid primary key default gen_random_uuid(),
  command text not null unique,
  action_key text not null,
  handler_name text not null,
  autonomy_tier text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace view control_plane.v_session_alignment as
select session_key, model_family, biz_key, thread_key, alignment_state,
  last_command, last_drift_score, last_classification, last_checked_at, support_state
from control_plane.session_state order by last_checked_at desc;

create or replace view control_plane.v_drift_hotspots as
select model_family, biz_key, trigger_type, severity,
  count(*) as event_count, max(created_at) as last_seen
from control_plane.drift_event group by 1,2,3,4 order by event_count desc;

create or replace view control_plane.v_canon_compliance as
select model_family,
  count(*) filter (where alignment_state='ALIGNED') as aligned,
  count(*) filter (where alignment_state='DRIFTING') as drifting,
  count(*) filter (where alignment_state='REBOUND') as rebound,
  count(*) filter (where alignment_state='QUARANTINED') as quarantined
from control_plane.session_state group by 1;

create or replace function control_plane.detect_drift(input_text text)
returns jsonb language plpgsql as $$
declare score int:=0; hits text[]:='{}';
begin
  if input_text not ilike '%evidence%' then score:=score+3; hits:=array_append(hits,'missing_evidence'); end if;
  if input_text not ilike '%runtime%' then score:=score+3; hits:=array_append(hits,'missing_runtime'); end if;
  if input_text not ilike '%registry%' then score:=score+2; hits:=array_append(hits,'missing_registry'); end if;
  if input_text not ilike '%recovery%' and input_text not ilike '%rollback%' then score:=score+2; hits:=array_append(hits,'missing_recovery'); end if;
  if input_text ilike '%done%' and input_text not ilike '%evidence%' then score:=score+4; hits:=array_append(hits,'false_completion'); end if;
  return jsonb_build_object('score',score,'hits',hits,
    'severity',case when score>=9 then 'quarantine' when score>=6 then 'rebind' when score>=3 then 'soft' else 'none' end,
    'command',case when score>=9 then '/canon-quarantine' when score>=6 then '/canon-rebind' when score>=3 then '/canon' else null end,
    'alignment_state',case when score>=9 then 'QUARANTINED' when score>=6 then 'REBOUND' when score>=3 then 'DRIFTING' else 'ALIGNED' end);
end; $$;

insert into control_plane.prompt_profile (profile_key,version,target_model_family,content) values
('universal_canon','1.0','all','Portfolio-scale autonomous control plane. Rules: Registry-first | Reality Ledger: REAL/PARTIAL/PRETEND | Closure-first | Bridge-first | AUTONOMOUS/LOG-ONLY/GATED/BLOCKED | Support-state mandatory | Wave10 min. All outputs: executable, observable, recoverable, evidenced.'),
('gpt_operator_overlay','1.0','gpt','Do not assume completion without evidence. Correctness over helpfulness. Surface gaps. Uncertainty=PARTIAL. Unverified=PRETEND.')
on conflict (profile_key,version,target_model_family) do update set content=excluded.content,updated_at=now();

insert into control_plane.injection_rule (rule_key,trigger_type,severity,command_to_inject) values
('missing_evidence','no_evidence_logic','rebind','/canon-rebind'),
('false_done','false_completion','quarantine','/canon-quarantine'),
('no_registry','missing_registry','rebind','/canon-rebind'),
('model_switch','session_change','soft','/canon'),
('new_thread','new_context','soft','/canon')
on conflict (rule_key) do nothing;

insert into control_plane.command_registry (command,action_key,handler_name,autonomy_tier) values
('/canon','control_plane.canon.inject','canon_inject_handler','AUTONOMOUS'),
('/canon-rebind','control_plane.canon.rebind','canon_rebind_handler','AUTONOMOUS'),
('/canon-quarantine','control_plane.canon.quarantine','canon_quarantine_handler','GATED'),
('/canon-check','control_plane.canon.check','canon_check_handler','AUTONOMOUS'),
('/canon-sync','control_plane.canon.sync_profiles','canon_sync_profiles_handler','AUTONOMOUS'),
('/canon-nightly','control_plane.canon.nightly_audit','canon_nightly_audit_handler','AUTONOMOUS')
on conflict (command) do update set action_key=excluded.action_key,handler_name=excluded.handler_name,updated_at=now();
