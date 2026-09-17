-- Seed agents, model profiles, routing rules
-- Run after 001_init.sql

insert into ai_agents (id, name, role, best_for, daily_soft_cap_rp, weekly_soft_cap_rp, active) values
  ('chatgpt_lumina', 'ChatGPT / LUMINA', 'Strategist / PM / Orchestrator', array['planning','requirements'], 80, 400, true),
  ('cursor', 'Cursor', 'Explorer / Daily Developer', array['ui','exploration','crud'], 100, 500, true),
  ('claude_code', 'Claude Code', 'Senior Builder / Architect', array['auth','db','architecture'], 80, 400, true),
  ('codex', 'Codex', 'Reviewer / Debugger / Independent Engineer', array['review','security','debugging'], 80, 400, true)
on conflict (id) do nothing;

insert into model_profiles (
  id, agent_id, tier, label, picker_model, picker_effort, effort_menu, provider_model_hint, active
) values
  ('mp_cursor_fast', 'cursor', 'fast', 'Composer 2.5 Fast', 'Composer 2.5 Fast', null, 'Cursorのモデル一覧から選ぶ', 'composer-2.5-fast', true),
  ('mp_cursor_balanced', 'cursor', 'balanced', 'Composer 2 / Auto', 'Composer 2 / Auto', null, 'Cursorのモデル一覧から選ぶ', 'composer-2', true),
  ('mp_cursor_strong', 'cursor', 'strong', 'Claude Sonnet 4.6（Cursor内）', 'Claude Sonnet 4.6', null, 'Cursorのモデル一覧から選ぶ', 'claude-4.6-sonnet-medium-thinking', true),
  ('mp_cursor_max', 'cursor', 'max', 'Claude Opus 4.6 Max Mode', 'Claude Opus 4.6', 'Max Mode', 'Cursorのモデル一覧 + Max Mode', 'claude-opus-4-6-max', true),
  ('mp_claude_fast', 'claude_code', 'fast', 'Haiku 4.5', 'Haiku 4.5', null, '仕事量なし（Haikuはスライダー非対応）', 'claude-haiku-4-5', true),
  ('mp_claude_balanced', 'claude_code', 'balanced', 'Sonnet 5 · 高', 'Sonnet 5', '高', '低 / 中 / 高 / 超高 / 最大 / ultracode', 'claude-sonnet-5', true),
  ('mp_claude_strong', 'claude_code', 'strong', 'Opus 5 · 超高', 'Opus 5', '超高', '低 / 中 / 高 / 超高 / 最大 / ultracode', 'claude-opus-5', true),
  ('mp_claude_max', 'claude_code', 'max', 'Fable 5.1 · 最大', 'Fable 5.1', '最大', '低 / 中 / 高 / 超高 / 最大 / ultracode', 'claude-fable-5-1', true),
  ('mp_codex_fast', 'codex', 'fast', 'GPT-5.6 Luna · 低', 'GPT-5.6 Luna', '低', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-luna', true),
  ('mp_codex_balanced', 'codex', 'balanced', 'GPT-5.6 Terra · 中', 'GPT-5.6 Terra', '中', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-terra', true),
  ('mp_codex_strong', 'codex', 'strong', 'GPT-5.6 Sol · 高', 'GPT-5.6 Sol', '高', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-sol', true),
  ('mp_codex_max', 'codex', 'max', 'GPT-6 Astra · 極高', 'GPT-6 Astra', '極高', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-6-astra', true),
  ('mp_lumina_fast', 'chatgpt_lumina', 'fast', 'GPT-5.6 Luna · 低', 'GPT-5.6 Luna', '低', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-luna', true),
  ('mp_lumina_balanced', 'chatgpt_lumina', 'balanced', 'GPT-5.6 Terra · 中', 'GPT-5.6 Terra', '中', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-terra', true),
  ('mp_lumina_strong', 'chatgpt_lumina', 'strong', 'GPT-5.6 Sol · 高', 'GPT-5.6 Sol', '高', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-5.6-sol', true),
  ('mp_lumina_max', 'chatgpt_lumina', 'max', 'GPT-6 Astra · 極高', 'GPT-6 Astra', '極高', '低 / 中 / 高 / 極高 / ウルトラ（GPT-5.5 は極高まで）', 'gpt-6-astra', true)
on conflict (id) do update set
  label = excluded.label,
  picker_model = excluded.picker_model,
  picker_effort = excluded.picker_effort,
  effort_menu = excluded.effort_menu,
  provider_model_hint = excluded.provider_model_hint,
  active = excluded.active;

insert into routing_rules (id, name, priority, condition, result, active) values
  ('rr_split_xl', 'Split XL / complexity 9+', 100, '{"minComplexity":9}'::jsonb, '{"agent":"chatgpt_lumina","modelTier":"max","mode":"plan","splitRecommended":true}'::jsonb, true),
  ('rr_review_codex', 'Review/Security → Codex', 90, '{"taskTypes":["review","security"]}'::jsonb, '{"agent":"codex","modelTier":"strong","mode":"review"}'::jsonb, true),
  ('rr_auth_strong', 'Auth/DB high complexity → Claude Strong', 70, '{"domains":["auth","db","security"],"minComplexity":6}'::jsonb, '{"agent":"claude_code","modelTier":"strong","reviewRequired":true,"reviewAgent":"codex"}'::jsonb, true),
  ('rr_low_cursor', 'Low complexity → Cursor', 10, '{"maxComplexity":3}'::jsonb, '{"agent":"cursor","modelTier":"fast"}'::jsonb, true)
on conflict (id) do update set
  name = excluded.name,
  priority = excluded.priority,
  condition = excluded.condition,
  result = excluded.result,
  active = excluded.active;
