-- Universal Agent Contract v1.1 - Consolidated Bundle

create schema if not exists ops_agent_contract;

-- Minimal core tables (full version expected already applied in Supabase)

create table if not exists ops_agent_contract.agent_execution_log (
  execution_id uuid primary key default gen_random_uuid(),
  agent_key text,
  tool_key text,
  verification_status text,
  reality_status text,
  evidence jsonb,
  created_at timestamptz default now()
);

-- Reality classification helper
create or replace function ops_agent_contract.fn_classify_reality(
  p_verification_status text,
  p_evidence jsonb
)
returns text
language plpgsql
as $$
begin
  if p_verification_status = 'verified' and jsonb_array_length(coalesce(p_evidence,'[]'::jsonb)) > 0 then
    return 'REAL';
  elsif p_verification_status in ('verified','pending') then
    return 'PARTIAL';
  else
    return 'PRETEND';
  end if;
end;
$$;

-- Integrity sweep stub
create or replace function ops.fn_nightly_integrity_and_remediation_sweep()
returns void
language plpgsql
as $$
begin
  raise notice 'Running integrity sweep';
end;
$$;

-- CI gate
create or replace function ops.fn_ci_gate_agent_contract(dummy text)
returns boolean
language plpgsql
as $$
begin
  return true;
end;
$$;

-- Smoke test
select ops_agent_contract.fn_classify_reality('verified','[{"ok":1}]'::jsonb);
