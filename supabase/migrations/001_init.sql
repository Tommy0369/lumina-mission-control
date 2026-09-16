-- LUMINA Mission Control V0.1 schema
-- SSOT target: Supabase Postgres
-- V0.1 app may also use local JSON store mirroring this schema.

create extension if not exists "pgcrypto";

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  goal text not null,
  status text not null check (status in ('active','paused','archived','done')),
  repo_url text,
  default_branch text not null default 'main',
  local_path_hint text,
  tech_stack text[] not null default '{}',
  progress int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  goal text not null,
  status text not null,
  priority int not null default 50,
  risk text not null,
  complexity numeric(4,1) not null default 5,
  progress int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references missions(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null default '',
  goal text not null,
  status text not null,
  priority int not null default 50,
  complexity numeric(4,1) not null,
  risk text not null,
  task_type text not null,
  domain text not null,
  scope text not null default '',
  out_of_scope text not null default '',
  acceptance_criteria text[] not null default '{}',
  estimated_files int not null default 1,
  context_files text[] not null default '{}',
  context_size text not null default 'small',
  recommended_agent text,
  recommended_model_tier text,
  recommended_mode text,
  resource_budget numeric(10,2),
  review_required boolean default false,
  review_agent text,
  split_recommended boolean default false,
  routing_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade
);

create table if not exists ai_agents (
  id text primary key,
  name text not null,
  role text not null,
  best_for text[] not null default '{}',
  daily_soft_cap_rp numeric(10,2) not null,
  weekly_soft_cap_rp numeric(10,2) not null,
  active boolean not null default true
);

create table if not exists model_profiles (
  id text primary key,
  agent_id text not null references ai_agents(id) on delete cascade,
  tier text not null check (tier in ('fast','balanced','strong','max')),
  label text not null,
  provider_model_hint text not null,
  active boolean not null default true
);

create table if not exists routing_rules (
  id text primary key,
  name text not null,
  priority int not null,
  condition jsonb not null,
  result jsonb not null,
  active boolean not null default true
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  code text not null,
  agent text not null,
  model_tier text not null,
  mode text not null,
  status text not null,
  prompt_snapshot text not null,
  permissions text[] not null default '{}',
  session_id text,
  started_at timestamptz not null,
  finished_at timestamptz,
  git_sha_before text,
  git_sha_after text,
  exit_code int,
  resource_points numeric(10,2) not null default 0,
  resource_points_actual numeric(10,2),
  result text,
  result_notes text,
  changed_files text[] not null default '{}',
  tests_summary text,
  human_intervention boolean not null default false,
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  provider text not null,
  model text,
  input_tokens int,
  output_tokens int,
  cached_tokens int,
  estimated_cost numeric(12,6),
  resource_points numeric(10,2) not null,
  source text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists handoffs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  summary text not null,
  changed_files text[] not null default '{}',
  tests text not null default '',
  risks text[] not null default '{}',
  blockers text[] not null default '{}',
  next_agent text,
  next_action text,
  review_prompt text,
  created_at timestamptz not null default now()
);

create table if not exists context_assets (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  path text not null,
  kind text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete set null,
  run_id uuid references runs(id) on delete set null,
  action text not null,
  status text not null,
  notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_mission on tasks(mission_id);
create index if not exists idx_runs_task on runs(task_id);
create index if not exists idx_handoffs_task on handoffs(task_id);
