# AGENTS.md — LUMINA Mission Control

## Product

AI Development Resource Orchestrator. Manual Orchestration in V0.1.

## Agent roles

| Agent | Role |
|-------|------|
| ChatGPT / LUMINA | Plan, requirements, routing decisions |
| Cursor | Explore, UI, small-medium impl |
| Claude Code | Complex impl, auth, db, architecture |
| Codex | Review, security, independent debug |

## Rules

- Prefer recommended routing; override consciously
- Complexity 9+ / XL → split first, do not execute
- Keep prompts scoped: GOAL / SCOPE / DO NOT TOUCH / ACCEPTANCE / STOP
- Record runs and handoffs; do not keep state only in chat
- Never store API keys in DB
- COMMIT / PUSH / DEPLOY / migration / delete require human approval

## Packages

- `@lumina/router` — routing brain
- `@lumina/prompts` — prompt / handoff generation
- `@lumina/core` — types, RP, task size

## Dogfooding

This repo is the first project. See `.ai/CURRENT.md` and `.ai/tasks/`.
