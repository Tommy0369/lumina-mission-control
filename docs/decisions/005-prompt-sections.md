# ADR-005: Prompt section templates (V0.1)

## Decision

Manual Orchestration prompts are generated in `@lumina/prompts` with fixed section headers so humans and agents can scan consistently.

| Generator | Required sections |
|-----------|-------------------|
| Task | ROLE, GOAL, TASK, DESCRIPTION, CONTEXT, CURRENT STATE, SCOPE, DO NOT TOUCH, ACCEPTANCE, OUTPUT, STOP CONDITION |
| Review | ROLE, GOAL, TASK, FOCUS, DO NOT TOUCH, OUTPUT, STOP CONDITION |
| Handoff | HANDOFF, TASK, WORKER, MODEL, RESULT, CHANGED FILES, TESTS, KNOWN RISKS, NEXT, ACTION |
| Debug | ROLE, GOAL, TASK, CONTEXT FILES, SCOPE, DO NOT TOUCH, ACCEPTANCE, OUTPUT, STOP CONDITION |

## Why

Copy-paste to external tools must include goal, scope, and stop conditions without the operator memorizing templates.

## Out of scope

Auto-prompt tuning, ML, Local Runner execution.
