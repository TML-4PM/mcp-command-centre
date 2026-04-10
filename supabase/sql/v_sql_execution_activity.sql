create or replace view v_sql_execution_activity as
select
  request_id,
  source,
  left(sql_text, 120) as sql_text,
  status,
  execution_time_ms,
  timestamp_utc,
  reality_classification
from sql_execution_audit
order by timestamp_utc desc;