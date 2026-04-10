alter table ops.system_registry enable row level security;
alter table audit.evidence_register enable row level security;
alter table audit.reality_ledger enable row level security;
alter table ops.gap_register enable row level security;

create policy service_role_all_system_registry
on ops.system_registry
for all
to service_role
using (true)
with check (true);

create policy service_role_all_evidence_register
on audit.evidence_register
for all
to service_role
using (true)
with check (true);

create policy service_role_all_reality_ledger
on audit.reality_ledger
for all
to service_role
using (true)
with check (true);

create policy service_role_all_gap_register
on ops.gap_register
for all
to service_role
using (true)
with check (true);
