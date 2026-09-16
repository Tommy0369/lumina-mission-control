# ADR-002: Subscription First / API Last

- Status: Accepted
- Date: 2026-09-16
- Inherited from: ai-orchestra (spirit only, fresh implementation)

## Decision

Prefer subscription CLI sessions (Cursor / Claude Code / Codex) over metered API keys for coding agents.

- Do not store API keys in the database
- V0.2 Local Runner must strip accidental API key env fallbacks
- API usage, if ever needed, is a separate path outside the runner

## Consequence

V0.1 is Manual Orchestration: copy prompt → human runs subscription tools → register result.
