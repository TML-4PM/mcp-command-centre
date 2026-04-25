-- SYMBIO / SYNAPSE v2.4 runtime proof pack
-- Run after applying supabase/migrations/20260424_symbio_synapse_v24_enforcement.sql

begin;

-- cleanup prior proof rows
select set_config('agl.proof_prefix', 'agl-proof-v24-', true);
delete from audit.receipts where job_id like current_setting('agl.proof_prefix') || '%';
delete from ops.work_queue where job_id like current_setting('agl.proof_prefix') || '%';

-- 1. Insert WIP job
insert into ops.work_queue (job_id, status, wip_cycle_count, escalation_at, payload)
values ('agl-proof-v24-001', 'WIP', 1, now() + interval '48 hours', '{"proof":"wip_insert"}'::jsonb);

-- 2. Invalid PEN receipt must fail
create temp table proof_results(test text primary key, result text not null, detail text);
do $$
begin
  begin
    insert into audit.receipts (receipt_id, job_id, layer, fields)
    values ('PEN-20260424-9001', 'agl-proof-v24-001', 'PEN', '{"bad":"shape"}'::jsonb);
    insert into proof_results values ('invalid_pen_rejected','FAIL','insert unexpectedly succeeded');
  exception when others then
    insert into proof_results values ('invalid_pen_rejected','PASS',sqlerrm);
  end;
end $$;

-- 3. Missing/broken infra ref must fail
insert into audit.receipts (receipt_id, job_id, layer, fields)
values ('WIP-20260424-9001', 'agl-proof-v24-001', 'WIP', jsonb_build_object(
  'receipt_id','WIP-20260424-9001',
  'job_id','agl-proof-v24-001',
  'iteration',1,
  'origin_layer','operator',
  'reason','new_work',
  'action','accepted',
  'next_step','Pen',
  'owner','proof',
  'wip_cycle_count',1,
  'escalation_at',(now() + interval '48 hours')::text,
  'timestamp',now()::text
));

do $$
begin
  begin
    insert into audit.receipts (receipt_id, job_id, layer, fields)
    values ('PEN-20260424-9002', 'agl-proof-v24-001', 'PEN', jsonb_build_object(
      'receipt_id','PEN-20260424-9002',
      'job_id','agl-proof-v24-001',
      'wip_receipt_id','WIP-20260424-9001',
      'parent_receipt_id',null,
      'iteration',1,
      'definition_status','complete',
      'scope','proof missing infra ref rejection',
      'inputs',jsonb_build_array('proof'),
      'outputs',jsonb_build_array(jsonb_build_object('name','proof','success_criteria','blocked')),
      'acceptance_criteria',jsonb_build_array('must reject missing infra ref'),
      'execution_path',jsonb_build_array('insert'),
      'validation_method','sql exception',
      'dependencies',jsonb_build_array('ops.infra_registry'),
      'infra_refs',jsonb_build_array('NO-SUCH-INFRA'),
      'readiness',true,
      'timestamp',now()::text
    ));
    insert into proof_results values ('missing_infra_ref_rejected','FAIL','insert unexpectedly succeeded');
  exception when others then
    insert into proof_results values ('missing_infra_ref_rejected','PASS',sqlerrm);
  end;
end $$;

-- 4. Valid PEN with active infra ref should pass
insert into audit.receipts (receipt_id, job_id, layer, fields)
values ('PEN-20260424-9003', 'agl-proof-v24-001', 'PEN', jsonb_build_object(
  'receipt_id','PEN-20260424-9003',
  'job_id','agl-proof-v24-001',
  'wip_receipt_id','WIP-20260424-9001',
  'parent_receipt_id',null,
  'iteration',1,
  'definition_status','complete',
  'scope','proof valid pen receipt',
  'inputs',jsonb_build_array('proof'),
  'outputs',jsonb_build_array(jsonb_build_object('name','proof','success_criteria','accepted')),
  'acceptance_criteria',jsonb_build_array('must accept active infra ref'),
  'execution_path',jsonb_build_array('insert'),
  'validation_method','sql success',
  'dependencies',jsonb_build_array('ops.infra_registry'),
  'infra_refs',jsonb_build_array('URL-001'),
  'readiness',true,
  'timestamp',now()::text
));
insert into proof_results values ('valid_pen_accepted','PASS','PEN-20260424-9003 inserted');

-- 5. Synapse transition without GK approval should fail
update ops.work_queue set status='GATEKEEPER' where job_id='agl-proof-v24-001';
do $$
begin
  begin
    update ops.work_queue set status='SYNAPSE' where job_id='agl-proof-v24-001';
    insert into proof_results values ('synapse_blocked_without_gk','FAIL','update unexpectedly succeeded');
  exception when others then
    insert into proof_results values ('synapse_blocked_without_gk','PASS',sqlerrm);
  end;
end $$;

-- 6. Valid GK pass receipt enables Synapse
insert into audit.receipts (receipt_id, job_id, layer, fields)
values ('GK-20260424-9001', 'agl-proof-v24-001', 'GK', jsonb_build_object(
  'receipt_id','GK-20260424-9001',
  'job_id','agl-proof-v24-001',
  'pen_receipt_id','PEN-20260424-9003',
  'checks_passed',jsonb_build_array('matches Pen definition','build complete','validation satisfied','audit present','infra_refs valid','no duplication'),
  'outcome','pass',
  'destination','Synapse',
  'gatekeeper_approved',true,
  'timestamp',now()::text
));
update ops.work_queue set status='SYNAPSE' where job_id='agl-proof-v24-001';
insert into proof_results values ('synapse_allowed_with_gk','PASS','SYNAPSE transition accepted after GK receipt');

-- 7. WIP cycle >= 3 escalates
insert into ops.work_queue (job_id, status, wip_cycle_count, escalation_at, payload)
values ('agl-proof-v24-002', 'WIP', 3, now() + interval '48 hours', '{"proof":"cycle"}'::jsonb);
insert into proof_results
select 'wip_cycle_escalates', case when status='ESCALATED' then 'PASS' else 'FAIL' end, status
from ops.work_queue where job_id='agl-proof-v24-002';

-- 8. stale WIP flags when TTL expired and no PEN receipt
insert into ops.work_queue (job_id, status, wip_cycle_count, escalation_at, payload)
values ('agl-proof-v24-003', 'WIP', 1, now() - interval '1 hour', '{"proof":"ttl"}'::jsonb);
select * from ops.flag_stale_wip_jobs();
insert into proof_results
select 'wip_ttl_stales', case when status='STALE' then 'PASS' else 'FAIL' end, status
from ops.work_queue where job_id='agl-proof-v24-003';

select * from proof_results order by test;

rollback;
