create table if not exists sql_reality_ledger (
  request_id text primary key,
  classification text,
  replay_match boolean,
  created_at timestamptz default now()
);

insert into sql_reality_ledger (request_id, classification, replay_match)
select
  request_id,
  case
    when status = 'rejected' then 'PRETEND'
    when status = 'success' then 'PARTIAL'
    else 'PARTIAL'
  end,
  null
from sql_execution_audit
on conflict (request_id) do nothing;