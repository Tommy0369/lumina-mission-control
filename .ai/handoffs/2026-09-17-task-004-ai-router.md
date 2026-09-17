# Handoff — TASK-004 AI Router

WORKER: claude_code / strong
RESULT: SUCCESS

## CHANGED
- `packages/router/src/route.ts` — review/security → Codex strong（seedルールと一致）
- `packages/router/src/router.test.ts` — XL/RED/YELLOW/blocker/planning を追加（9件）
- `packages/router/tsconfig.json` — test除外で typecheck 安定化
- `apps/web/src/lib/services.ts` — `isBlocker` と resourceStatus を apply/startRun に配線
- `docs/decisions/004-rule-based-routing.md` — ADR（MLなし・ルール優先順）
- `.ai/tasks/TASK-004-ai-router.md` — status → done
- `.ai/CURRENT.md` — Router完了を反映
- `.ai/handoffs/2026-09-17-task-004-ai-router.md` — this file

## REASON
V0.1 は説明可能なルール振り分け。
XL分割と RED 迂回が実経路でも効くよう、サービス層まで配線した。

## TESTS
- `pnpm --filter @lumina/router test` — 9/9 pass
- `pnpm --filter @lumina/router typecheck` — OK
- `pnpm --filter @lumina/web typecheck` — OK

## RISKS
- `routingRules` テーブルは表示用。実行正本は `routeTask` ハードコード
- 二重メンテのズレ余地あり（seed DEFAULT_ROUTING_RULES vs route.ts）
- TASK-005（Codex独立レビュー）でルール妥当性を見る必要あり

## NEXT
TASK-005 Router Review（Codex）→ 続けて TASK-006 Prompt Engine
