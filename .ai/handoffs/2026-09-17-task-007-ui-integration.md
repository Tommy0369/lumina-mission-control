# Handoff — TASK-007 UI Integration

WORKER: claude_code / balanced
RESULT: SUCCESS

## CHANGED
- `apps/web/src/lib/services.ts` — added `nextRunRecommendation`; `getTask`
  now returns `nextRecommendation`; `startRun`'s recommended path and
  `completeRun`'s status/handoff logic use it instead of the static
  `task.reviewRequired` flag
- `apps/web/src/app/tasks/[id]/page.tsx` — "使うAIとモデル" panel, prompt
  panel (primary vs. review prompt), manual agent/model select defaults, and
  the start button label/hint now switch when the task is waiting on review
- `docs/decisions/006-review-loop-termination.md` — ADR
- `.ai/tasks/TASK-007-ui-integration.md` — status → done
- `.ai/CURRENT.md` — reflects TASK-007 done
- `.ai/handoffs/2026-09-17-task-007-ui-integration.md` — this file

## REASON
Copy/start/complete/handoff were already wired from earlier tasks. Reading
the flow closely (and reproducing it with a scripted task + a full browser
click-through) found that once a task entered `"review"` status, two things
were wrong: (1) the primary "start" button still recommended the *original*
implementation agent instead of the pending Codex review, and (2)
`completeRun` re-checked the static `reviewRequired` flag on every
completion, so a successful review run sent the task back to `"review"`
instead of `"done"` — the loop never terminated. Both come from the same
root cause: review-readiness was being inferred from a flag that's never
cleared, instead of from current `task.status` / `run.mode`.

## TESTS
- `pnpm typecheck` (all 6 workspace packages) — OK
- `pnpm test` (`@lumina/router` 9/9, `@lumina/prompts` 5/5) — pass, unchanged
- Scripted repro against `createTask({domain:"auth", complexity:7})`:
  before fix — run2 repeated cursor/implementation, task stuck in
  `"review"`; after fix — run2 routed to codex/strong/review, task reached
  `"done"`
- Manual browser click-through on a throwaway idea-generated task
  (`http://localhost:3001`, separate dev port from the user's own running
  instance on 3000 — never touched that one): create → start → complete
  (success) → page correctly showed "次はレビュー" / Codex / GPT-5.4 Pro →
  "レビューを始める" → complete (success) → status "できた", handoff says
  "次の一手はホームか作戦画面で確認。" No console errors at any step.
- `data/store.json` (gitignored, real dogfood data) was mutated by both the
  script and the browser run; restored from a scratchpad backup after each,
  verified task/run/handoff counts match pre-test state (23/8/8) and no
  leftover test project

## RISKS
- `/tasks` (all-tasks list) and other pages still print the *static*
  `recommendedAgent/recommendedModelTier` as a secondary label for
  review-status tasks — same staleness this fix addresses, but on a
  different page than "Task Detail," so left untouched (out of this task's
  stated scope)
- Dashboard's `nextTask` selection (`getDashboard`) only looks at
  `ready`/`todo`/`running` — a task sitting in `"review"` status is not
  surfaced as "いまやる一手" and is only reachable via `/tasks` or the
  project page. Pre-existing, not part of "Task Detail" wiring, not changed
- Manual "AIとモデルを自分で選ぶ" override during a review step still has no
  mode selector — if you pick a non-review agent while `status === "review"`,
  `mode` still resolves to `"review"` (read-only permissions). Same
  pre-existing limitation the non-review manual path already had; not a
  regression, not fixed here

## NEXT
TASK-008 Final Audit (Codex / Strong) — the review-loop fix directly affects
plan §66 completion criteria ("loop works"), worth confirming there.
