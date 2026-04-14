begin;

create schema if not exists t4h_control;

create table if not exists t4h_control.t4h_identity_core (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  display_name text not null,
  role_title text,
  organisation text,
  business_group text,
  biz_key text,
  priority_vector jsonb not null default '[]'::jsonb,
  current_focus jsonb not null default '[]'::jsonb,
  decision_rules jsonb not null default '[]'::jsonb,
  risk_profile jsonb not null default '{}'::jsonb,
  operating_mode text not null default 'default',
  autonomy_tier text not null default 'AUTONOMOUS' check (autonomy_tier in ('AUTONOMOUS','LOG-ONLY','GATED','BLOCKED')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists t4h_control.t4h_voice_profile (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null references t4h_control.t4h_identity_core(identity_key) on delete cascade,
  version text not null default '1.0',
  tone text,
  style_rules jsonb not null default '[]'::jsonb,
  sentence_patterns jsonb not null default '[]'::jsonb,
  preferred_formats jsonb not null default '[]'::jsonb,
  contrarian_positions jsonb not null default '[]'::jsonb,
  banned_phrases jsonb not null default '[]'::jsonb,
  banned_openers jsonb not null default '[]'::jsonb,
  banned_endings jsonb not null default '[]'::jsonb,
  australian_spelling boolean not null default true,
  humour_allowed boolean not null default true,
  data_density_preference text not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(identity_key, version)
);

create index if not exists idx_t4h_identity_core_active on t4h_control.t4h_identity_core(is_active, operating_mode);
create index if not exists idx_t4h_voice_profile_identity on t4h_control.t4h_voice_profile(identity_key, is_active);

create or replace function t4h_control.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_t4h_identity_core_updated_at
before update on t4h_control.t4h_identity_core
for each row execute function t4h_control.set_updated_at();

create trigger trg_t4h_voice_profile_updated_at
before update on t4h_control.t4h_voice_profile
for each row execute function t4h_control.set_updated_at();

insert into t4h_control.t4h_identity_core (
  identity_key,
  display_name,
  role_title,
  organisation,
  business_group,
  biz_key,
  priority_vector,
  current_focus,
  decision_rules,
  risk_profile,
  operating_mode,
  autonomy_tier,
  is_active
)
values (
  'troy-default',
  'Troy Latter',
  'Founder / CEO',
  'Tech 4 Humanity',
  'CORE',
  'Tech for Humanity',
  '["prove what is real","build to wave 10","remove manual drag","bind outputs to evidence"]'::jsonb,
  '["identity enforcement","style enforcement","multi-agent execution","command centre visibility"]'::jsonb,
  '["no clarification loops by default","full end-state delivery","all enhancements yes unless blocked by safety or authority","evidence before reality classification"]'::jsonb,
  '{"default_risk":"medium","false_progress":"high","style_drift":"high"}'::jsonb,
  'default',
  'AUTONOMOUS',
  true
)
on conflict (identity_key) do update
set display_name = excluded.display_name,
    role_title = excluded.role_title,
    organisation = excluded.organisation,
    business_group = excluded.business_group,
    biz_key = excluded.biz_key,
    priority_vector = excluded.priority_vector,
    current_focus = excluded.current_focus,
    decision_rules = excluded.decision_rules,
    risk_profile = excluded.risk_profile,
    operating_mode = excluded.operating_mode,
    autonomy_tier = excluded.autonomy_tier,
    is_active = excluded.is_active,
    updated_at = now();

insert into t4h_control.t4h_voice_profile (
  identity_key,
  version,
  tone,
  style_rules,
  sentence_patterns,
  preferred_formats,
  contrarian_positions,
  banned_phrases,
  banned_openers,
  banned_endings,
  australian_spelling,
  humour_allowed,
  data_density_preference,
  is_active
)
values (
  'troy-default',
  '1.0',
  'direct, plainspoken, evidence-led, commercially aware',
  '["lead with the answer","prefer operational language over theory","show system consequences not slogans","keep sections useful and named"]'::jsonb,
  '["problem -> move -> result","before -> after","gap -> control","signal -> action -> proof"]'::jsonb,
  '["exec summary","runbook","decision memo","bridge payload","sql pack","investor narrative"]'::jsonb,
  '["hard-coded is not real","distribution matters as much as build","evidence beats aspiration"]'::jsonb,
  '["leverage synergy","delve","in today''s fast-paced landscape","game-changing","seamless"]'::jsonb,
  '["Short answer:","Short version:","If you want","If you mean"]'::jsonb,
  '["I can help with that.","Let me know if you''d like more."]'::jsonb,
  true,
  true,
  'medium',
  true
)
on conflict (identity_key, version) do update
set tone = excluded.tone,
    style_rules = excluded.style_rules,
    sentence_patterns = excluded.sentence_patterns,
    preferred_formats = excluded.preferred_formats,
    contrarian_positions = excluded.contrarian_positions,
    banned_phrases = excluded.banned_phrases,
    banned_openers = excluded.banned_openers,
    banned_endings = excluded.banned_endings,
    australian_spelling = excluded.australian_spelling,
    humour_allowed = excluded.humour_allowed,
    data_density_preference = excluded.data_density_preference,
    is_active = excluded.is_active,
    updated_at = now();

commit;
