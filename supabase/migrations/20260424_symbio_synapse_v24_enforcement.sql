-- SYMBIO / SYNAPSE v2.4 enforcement migration
-- Doctrine: WIP -> Pen -> Symbio -> Gatekeeper -> Synapse
-- No receipt = no state change. No Synapse write unless gatekeeper_approved = true.

create schema if not exists ops;
create schema if not exists audit;

create table if not exists ops.work_queue (
  job_id text primary key,
  parent_job_id text references ops.work_queue(job_id),
  sibling_ids text[] default '{}',
  status text not null default 'WIP',
  wip_cycle_count int not null default 1,
  gatekeeper_approved boolean not null default false,
  receipt_ids text[] default '{}',
  escalation_at timestamptz,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_queue_status_check check (
    status in ('WIP','PEN','SYMBIO','GATEKEEPER','SYNAPSE','SPLIT','ESCALATED','STALE','DONE','BLOCKED')
  ),
  constraint work_queue_cycle_check check (wip_cycle_count >= 1)
);

create table if not exists audit.receipts (
  receipt_id text primary key,
  job_id text not null references ops.work_queue(job_id),
  layer text not null,
  iteration int not null default 1,
  parent_receipt_id text references audit.receipts(receipt_id),
  fields jsonb not null,
  conversation_ref text,
  created_at timestamptz not null default now(),
  constraint receipts_layer_check check (layer in ('WIP','PEN','SYM','GK','SYN')),
  constraint receipts_iteration_check check (iteration >= 1),
  constraint receipts_id_format_check check (receipt_id ~ '^(WIP|PEN|SYM|GK|SYN)-[0-9]{8}-[0-9]{4}$')
);

create table if not exists ops.infra_registry (
  registry_id text primary key,
  category text not null,
  name text not null,
  status text not null default 'active',
  ref jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint infra_registry_status_check check (status in ('active','broken','retired','unknown'))
);

create or replace function ops.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_work_queue_touch on ops.work_queue;
create trigger trg_work_queue_touch
before update on ops.work_queue
for each row execute function ops.touch_updated_at();

drop trigger if exists trg_infra_registry_touch on ops.infra_registry;
create trigger trg_infra_registry_touch
before update on ops.infra_registry
for each row execute function ops.touch_updated_at();

create or replace function audit.validate_pen_receipt_fields(f jsonb)
returns boolean language plpgsql immutable as $$
begin
  return
    f ? 'receipt_id' and
    f ? 'job_id' and
    f ? 'wip_receipt_id' and
    f ? 'iteration' and
    f ? 'definition_status' and
    f ? 'scope' and
    f ? 'inputs' and
    f ? 'outputs' and
    f ? 'acceptance_criteria' and
    f ? 'execution_path' and
    f ? 'validation_method' and
    f ? 'dependencies' and
    f ? 'infra_refs' and
    f ? 'readiness' and
    f ? 'timestamp' and
    f->>'definition_status' in ('complete','incomplete') and
    jsonb_typeof(f->'inputs') = 'array' and
    jsonb_typeof(f->'outputs') = 'array' and
    jsonb_typeof(f->'acceptance_criteria') = 'array' and
    jsonb_typeof(f->'execution_path') = 'array' and
    jsonb_typeof(f->'dependencies') = 'array' and
    jsonb_typeof(f->'infra_refs') = 'array' and
    jsonb_typeof(f->'readiness') = 'boolean';
end;
$$;

create or replace function audit.validate_gk_receipt_fields(f jsonb)
returns boolean language plpgsql immutable as $$
begin
  return
    f ? 'receipt_id' and
    f ? 'job_id' and
    f ? 'pen_receipt_id' and
    f ? 'checks_passed' and
    f ? 'outcome' and
    f ? 'destination' and
    f ? 'gatekeeper_approved' and
    f ? 'timestamp' and
    jsonb_typeof(f->'checks_passed') = 'array' and
    f->>'outcome' in ('pass','fail') and
    f->>'destination' in ('Synapse','WIP') and
    jsonb_typeof(f->'gatekeeper_approved') = 'boolean';
end;
$$;

create or replace function audit.validate_wip_receipt_fields(f jsonb)
returns boolean language plpgsql immutable as $$
begin
  return
    f ? 'receipt_id' and
    f ? 'job_id' and
    f ? 'iteration' and
    f ? 'origin_layer' and
    f ? 'reason' and
    f ? 'action' and
    f ? 'next_step' and
    f ? 'owner' and
    f ? 'wip_cycle_count' and
    f ? 'escalation_at' and
    f ? 'timestamp';
end;
$$;

create or replace function audit.validate_receipt_before_write()
returns trigger language plpgsql as $$
declare
  infra_ref text;
  infra_refs jsonb;
  missing_count int;
begin
  if new.layer = 'PEN' and not audit.validate_pen_receipt_fields(new.fields) then
    raise exception 'invalid_pen_receipt_schema';
  end if;

  if new.layer = 'GK' and not audit.validate_gk_receipt_fields(new.fields) then
    raise exception 'invalid_gatekeeper_receipt_schema';
  end if;

  if new.layer = 'WIP' and not audit.validate_wip_receipt_fields(new.fields) then
    raise exception 'invalid_wip_receipt_schema';
  end if;

  -- Infra refs must exist and be active when provided.
  if new.fields ? 'infra_refs' then
    infra_refs := new.fields->'infra_refs';
    if jsonb_typeof(infra_refs) = 'array' then
      select count(*) into missing_count
      from jsonb_array_elements_text(infra_refs) r(ref)
      left join ops.infra_registry i on i.registry_id = r.ref and i.status = 'active'
      where i.registry_id is null;
      if missing_count > 0 then
        raise exception 'infra_ref_missing_or_not_active';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_receipt_before_write on audit.receipts;
create trigger trg_validate_receipt_before_write
before insert or update on audit.receipts
for each row execute function audit.validate_receipt_before_write();

create or replace function ops.enforce_work_queue_transition()
returns trigger language plpgsql as $$
declare
  gk_receipts int;
begin
  -- No Synapse movement without Gatekeeper approval and GK receipt.
  if new.status = 'SYNAPSE' and (new.gatekeeper_approved is distinct from true) then
    raise exception 'synapse_blocked_gatekeeper_approved_false';
  end if;

  if new.status = 'SYNAPSE' then
    select count(*) into gk_receipts
    from audit.receipts
    where job_id = new.job_id
      and layer = 'GK'
      and fields->>'outcome' = 'pass'
      and (fields->>'gatekeeper_approved')::boolean = true;

    if gk_receipts = 0 then
      raise exception 'synapse_blocked_missing_gatekeeper_receipt';
    end if;
  end if;

  if new.wip_cycle_count >= 3 and new.status = 'WIP' then
    new.status := 'ESCALATED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_work_queue_transition on ops.work_queue;
create trigger trg_enforce_work_queue_transition
before insert or update on ops.work_queue
for each row execute function ops.enforce_work_queue_transition();

create or replace function ops.flag_stale_wip_jobs()
returns table(job_id text, previous_status text, new_status text) language plpgsql as $$
begin
  return query
  update ops.work_queue q
  set status = 'STALE', updated_at = now()
  where q.status = 'WIP'
    and q.escalation_at is not null
    and now() > q.escalation_at
    and not exists (
      select 1 from audit.receipts r
      where r.job_id = q.job_id and r.layer = 'PEN'
    )
  returning q.job_id, 'WIP'::text, q.status;
end;
$$;

create or replace function ops.append_receipt_to_job()
returns trigger language plpgsql as $$
begin
  update ops.work_queue
  set receipt_ids = array_append(coalesce(receipt_ids, '{}'), new.receipt_id),
      gatekeeper_approved = case
        when new.layer = 'GK' then coalesce((new.fields->>'gatekeeper_approved')::boolean, false)
        else gatekeeper_approved
      end
  where job_id = new.job_id;
  return new;
end;
$$;

drop trigger if exists trg_append_receipt_to_job on audit.receipts;
create trigger trg_append_receipt_to_job
after insert on audit.receipts
for each row execute function ops.append_receipt_to_job();

-- Seed registry IDs from v2.4 doctrine. Secret values are never stored here.
insert into ops.infra_registry (registry_id, category, name, status, ref, notes) values
('URL-001','url','T4H Bridge Endpoint','active','{}','Primary Lambda invocation gateway'),
('URL-002','url','Supabase REST','active','{}','Direct fallback when bridge is down'),
('URL-004','url','MCP Server EC2','active','{}','--allow-http required'),
('URL-005','url','T4H Remote MCP','active','{}','Primary Claude connector'),
('KEY-001','key_ref','T4H Bridge Key','active','{}','Credential value in operator memory; never expose'),
('KEY-002','key_ref','Supabase Service Role Key','active','{}','Credential value in operator memory; never expose'),
('KEY-003','key_ref','GitHub PAT org TML-4PM primary','active','{}','Credential value in operator memory; never expose'),
('KEY-004','key_ref','GitHub PAT org TML-4PM secondary','active','{}','Credential value in operator memory; never expose'),
('LAMBDA-001','lambda','troy-sql-executor','active','{}','Requires debug:true for SELECT'),
('LAMBDA-002','lambda','troy-sql-executor-s2','broken','{}','Broken: wrong Supabase URL'),
('LAMBDA-003','lambda','troy-orchestrator','active','{}','EventBridge scheduled'),
('COMPUTE-001','compute','EC2 i-09f18f2e1123a5702','active','{}','SSM as ssm-user not ubuntu'),
('DB-001','database','Supabase project lzfgigiyqpuuxslsygjt','active','{}','Canonical source of truth'),
('TABLE-001','table','ops.work_queue','active','{}','All work routes here'),
('TABLE-002','table','audit.receipts','active','{}','All receipts stored here'),
('VERCEL-001','vercel','Vercel team team_IKIr2Kcs38KGo8Zs60yNtm7Y','active','{}','Vercel team'),
('GITHUB-001','github','GitHub org TML-4PM','active','{}','GitHub org')
on conflict (registry_id) do update
set category = excluded.category,
    name = excluded.name,
    status = excluded.status,
    notes = excluded.notes,
    updated_at = now();

comment on table ops.work_queue is 'SYMBIO/SYNAPSE v2.4 work queue. No Synapse write without gatekeeper_approved and GK receipt.';
comment on table audit.receipts is 'SYMBIO/SYNAPSE v2.4 receipt truth. No receipt = no state change.';
comment on table ops.infra_registry is 'Canonical infra registry. All endpoints, keys, Lambdas, compute, env vars, and invocation shapes resolve here.';
