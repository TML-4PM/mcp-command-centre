create schema if not exists comms;
create schema if not exists scheduling;

create table if not exists comms.domain_registry (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  status text not null default 'PENDING_AUDIT',
  mail_provider text,
  booking_provider text,
  owner_name text,
  owner_email text,
  backup_owner_name text,
  backup_owner_email text,
  migration_complexity text default 'UNKNOWN',
  cutover_blocked boolean not null default true,
  evidence_status text default 'PARTIAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comms.domain_mailbox (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  email_address text not null unique,
  mailbox_type text not null,
  provider text not null default 'Migadu',
  owner_email text,
  backup_owner_email text,
  shared_access jsonb not null default '[]'::jsonb,
  retention_policy text,
  status text not null default 'PLANNED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into comms.domain_registry (domain, status, mail_provider, booking_provider)
values
('all-chemist.org','PENDING_AUDIT','Migadu','Cal.com'),
('apexpredatorinsurance.com','PENDING_AUDIT','Migadu','Cal.com'),
('augmentedhumanity.coach','PENDING_AUDIT','Migadu','Cal.com'),
('enteraustralia.tech','PENDING_AUDIT','Migadu','Cal.com'),
('far-cage.org','PENDING_AUDIT','Migadu','Cal.com'),
('gcbat.org','PENDING_AUDIT','Migadu','Cal.com'),
('globaltyres.org','PENDING_AUDIT','Migadu','Cal.com'),
('holo-org.com','PENDING_AUDIT','Migadu','Cal.com'),
('innovateme.link','PENDING_AUDIT','Migadu','Cal.com'),
('innovateme.systems','PENDING_AUDIT','Migadu','Cal.com'),
('mcp-native.com','PENDING_AUDIT','Migadu','Cal.com'),
('workfamilyai.org','PENDING_AUDIT','Migadu','Cal.com');
