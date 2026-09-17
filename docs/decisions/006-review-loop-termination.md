# ADR-006: Review step terminates the loop instead of repeating

## Decision

A task's `reviewRequired` flag describes the *original* routing decision
(this task type needed a review pass). It must not be re-read after the
review itself has run. Task Detail resolves what to do **next** from
`task.status` + `run.mode`, not from `reviewRequired` alone:

- No active run, `status !== "review"` → next run uses `task.recommendedAgent /
  recommendedModelTier / recommendedMode` (the original decision).
- No active run, `status === "review"` → next run uses `task.reviewAgent`,
  `modelTier: "strong"`, `mode: "review"`.
- `completeRun` on a run with `mode === "review"` never re-enters `"review"`
  status on success, even though `task.reviewRequired` is still `true`. It
  resolves to `"done"`. Any failed run (implementation or review) still goes
  to `"blocked"`.

## Why

Before this fix, `completeRun` checked `task.reviewRequired` on every
completion. Since that flag is never cleared, a task that needed review
would return to `"review"` status forever — the loop never reached `"done"`,
and the Task Detail page kept recommending the original implementation
agent/prompt instead of the pending review, even though the handoff panel
correctly named Codex as next. Confirmed with a scripted repro
(`createTask` domain `auth` complexity 7 → `completeRun` twice) and a manual
click-through in the browser before and after the fix.

## Scope

`apps/web/src/lib/services.ts` (`nextRunRecommendation`, `startRun`,
`completeRun`) and `apps/web/src/app/tasks/[id]/page.tsx` display only.
Does not change `@lumina/router` or `@lumina/prompts` — both already
produce the correct `reviewAgent` / `reviewPrompt`, they just weren't being
read again at the right moment.

## Out of scope

Local Runner, ML routing, billing, team ACL. Dashboard "next task" bucketing
still excludes `"review"`-status tasks (pre-existing, not touched — see
handoff risks).
