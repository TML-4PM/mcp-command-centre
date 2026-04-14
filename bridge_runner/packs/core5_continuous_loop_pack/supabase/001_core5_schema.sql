create table if not exists core5_tasks (id uuid primary key, title text, status text, created_at timestamptz);
create table if not exists core5_runs (id uuid primary key, task_id uuid, status text, iteration_count int, created_at timestamptz);
create table if not exists core5_agent_visits (id uuid primary key, run_id uuid, agent text, status text, summary text, output jsonb, created_at timestamptz);
create table if not exists core5_outputs (id uuid primary key, run_id uuid, content jsonb, is_final boolean, created_at timestamptz);
create table if not exists core5_stage_gates (id uuid primary key, run_id uuid, gate text, status text, created_at timestamptz);
