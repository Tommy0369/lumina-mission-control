# TASK-007 — UI Integration

Status: done
Recommended: Cursor / Balanced
Actual worker: claude_code / balanced

## Goal

Wire Task Detail: prompt copy, start run, complete run, handoff display.

## Done
- Copy / start / complete / handoff wiring already existed (from prior tasks) and was verified working
- Found and fixed a real loop-termination bug: `completeRun` reused the static
  `reviewRequired` flag on every completion, so a task needing review could
  never reach `"done"` — it kept re-entering `"review"` status, and the
  primary "start" button kept recommending the original implementation agent
  instead of the pending Codex review
- Added `nextRunRecommendation` in `apps/web/src/lib/services.ts`: resolves
  agent/modelTier/mode from current `task.status`, not just the original
  routing snapshot
- `apps/web/src/app/tasks/[id]/page.tsx`: "使うAIとモデル" panel, prompt
  panel, manual agent/model selects, and the start button label now reflect
  "next is review" when `status === "review"`
- ADR-006 + verified with a scripted repro and a full browser click-through
  (create → start → complete → review → complete → done)
- Handoff: `.ai/handoffs/2026-09-17-task-007-ui-integration.md`
