# TASK-004 — AI Router

Status: done（見直し完了）
Recommended: Claude Code / Strong → 見直しは Cursor が代行（Codex制限）

## Goal

Rule-based routing in `packages/router` with XL split and resource RED reroute.

## Done
- `routeTask`: XL block / RED→Cursor / YELLOW downgrade / blocker例外
- review / security は RED でも Codex のまま。YELLOW でも strong のまま
- services 配線: `isBlocker` + resourceStatus（applyRouting / startRun）
- ADR-004 + tests
- 実装 handoff: `.ai/handoffs/2026-09-17-task-004-ai-router.md`
- 見直し: `.ai/handoffs/2026-09-17-task-004-ai-router-review.md`
