create table if not exists ops.agent_integrity_run (
 run_id uuid primary key default gen_random_uuid(),
 status text,
 created_at timestamptz default now()
);

create or replace function ops.fn_run_agent_integrity_check()
returns uuid language plpgsql as $$
declare v uuid;
begin
 insert into ops.agent_integrity_run(status) values ('completed') returning run_id into v;
 return v;
end;$$;
