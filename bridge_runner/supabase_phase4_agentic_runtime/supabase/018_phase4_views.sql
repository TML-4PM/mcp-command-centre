create or replace view cc.v_agent_activity as
select
  agent_key,
  agent_name,
  lifecycle_state,
  last_active_at
from ops.agent_registry;

create or replace view cc.v_orchestration_queue as
select
  orchestration_key,
  agent_key,
  task_type,
  status,
  priority,
  created_at
from runtime.orchestration_queue
order by priority asc, created_at desc;

create or replace view cc.v_llm_handoffs as
select
  handoff_key,
  source_provider,
  target_provider,
  status,
  created_at
from ops.cross_llm_handoff
order by created_at desc;