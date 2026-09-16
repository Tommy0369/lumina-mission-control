-- Seed agents, model profiles, routing rules
-- Run after 001_init.sql

insert into ai_agents (id, name, role, best_for, daily_soft_cap_rp, weekly_soft_cap_rp, active) values
  ('chatgpt_lumina', 'ChatGPT / LUMINA', 'Strategist / PM / Orchestrator', array['planning','requirements'], 80, 400, true),
  ('cursor', 'Cursor', 'Explorer / Daily Developer', array['ui','exploration','crud'], 100, 500, true),
  ('claude_code', 'Claude Code', 'Senior Builder / Architect', array['auth','db','architecture'], 80, 400, true),
  ('codex', 'Codex', 'Reviewer / Debugger / Independent Engineer', array['review','security','debugging'], 80, 400, true)
on conflict (id) do nothing;

insert into model_profiles (id, agent_id, tier, label, provider_model_hint, active) values
  ('mp_cursor_fast', 'cursor', 'fast', 'Composer / Fast', 'cursor-fast', true),
  ('mp_cursor_balanced', 'cursor', 'balanced', 'Auto Balance', 'cursor-balanced', true),
  ('mp_cursor_strong', 'cursor', 'strong', 'Auto Intelligence', 'cursor-strong', true),
  ('mp_cursor_max', 'cursor', 'max', 'Max Mode', 'cursor-max', true),
  ('mp_claude_fast', 'claude_code', 'fast', 'Haiku-class', 'claude-haiku', true),
  ('mp_claude_balanced', 'claude_code', 'balanced', 'Sonnet-class', 'claude-sonnet', true),
  ('mp_claude_strong', 'claude_code', 'strong', 'Opus-class', 'claude-opus', true),
  ('mp_claude_max', 'claude_code', 'max', 'Latest strongest', 'claude-max', true),
  ('mp_codex_fast', 'codex', 'fast', 'Codex Fast', 'codex-fast', true),
  ('mp_codex_balanced', 'codex', 'balanced', 'Codex Balanced', 'codex-balanced', true),
  ('mp_codex_strong', 'codex', 'strong', 'Codex Strong', 'codex-strong', true),
  ('mp_codex_max', 'codex', 'max', 'Codex Max', 'codex-max', true),
  ('mp_lumina_balanced', 'chatgpt_lumina', 'balanced', 'GPT Balanced', 'gpt-balanced', true),
  ('mp_lumina_strong', 'chatgpt_lumina', 'strong', 'GPT Strong', 'gpt-strong', true),
  ('mp_lumina_max', 'chatgpt_lumina', 'max', 'GPT Max', 'gpt-max', true)
on conflict (id) do nothing;

insert into routing_rules (id, name, priority, condition, result, active) values
  ('rr_split_xl', 'Split XL / complexity 9+', 100, '{"minComplexity":9}'::jsonb, '{"agent":"chatgpt_lumina","modelTier":"max","mode":"plan","splitRecommended":true}'::jsonb, true),
  ('rr_auth_strong', 'Auth/DB high complexity → Claude Strong', 80, '{"domains":["auth","db","security"],"minComplexity":6}'::jsonb, '{"agent":"claude_code","modelTier":"strong","reviewRequired":true,"reviewAgent":"codex"}'::jsonb, true),
  ('rr_review_codex', 'Review/Security → Codex', 70, '{"taskTypes":["review","security"]}'::jsonb, '{"agent":"codex","modelTier":"strong","mode":"review"}'::jsonb, true),
  ('rr_low_cursor', 'Low complexity → Cursor', 10, '{"maxComplexity":3}'::jsonb, '{"agent":"cursor","modelTier":"fast"}'::jsonb, true)
on conflict (id) do nothing;
