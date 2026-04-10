insert into ops.standard_knowledge_register (knowledge_key, content, active)
values (
  'sql_execution_standard_v1',
  'Canonical SQL execution uses troy-sql-executor-s2 via MCP Bridge with strict payload and audit enforcement.',
  true
)
on conflict (knowledge_key)
do update set content = excluded.content;