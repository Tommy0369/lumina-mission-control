-- Align model_profiles with local ModelProfile picker fields.
-- Lock public tables behind RLS until a live Data API is connected.

alter table model_profiles
  add column if not exists picker_model text not null default '',
  add column if not exists picker_effort text,
  add column if not exists effort_menu text not null default '';

update model_profiles
set picker_model = label
where picker_model = '';

alter table workspaces enable row level security;
alter table projects enable row level security;
alter table missions enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;
alter table ai_agents enable row level security;
alter table model_profiles enable row level security;
alter table routing_rules enable row level security;
alter table runs enable row level security;
alter table usage_events enable row level security;
alter table handoffs enable row level security;
alter table context_assets enable row level security;
alter table approvals enable row level security;

revoke all on table workspaces from anon, authenticated;
revoke all on table projects from anon, authenticated;
revoke all on table missions from anon, authenticated;
revoke all on table tasks from anon, authenticated;
revoke all on table task_dependencies from anon, authenticated;
revoke all on table ai_agents from anon, authenticated;
revoke all on table model_profiles from anon, authenticated;
revoke all on table routing_rules from anon, authenticated;
revoke all on table runs from anon, authenticated;
revoke all on table usage_events from anon, authenticated;
revoke all on table handoffs from anon, authenticated;
revoke all on table context_assets from anon, authenticated;
revoke all on table approvals from anon, authenticated;
