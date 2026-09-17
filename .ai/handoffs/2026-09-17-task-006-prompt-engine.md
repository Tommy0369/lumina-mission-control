# Handoff — TASK-006 Prompt Engine

WORKER: cursor / balanced
RESULT: SUCCESS

## CHANGED
- `packages/prompts/src/generate.ts` — Review prompt を必須セクション形式に統一
- `packages/prompts/src/prompts.test.ts` — Task / Review / Handoff / Debug のセクション検証（5件）
- `packages/prompts/tsconfig.json` — test 除外で typecheck 安定化
- `docs/decisions/005-prompt-sections.md` — ADR-005
- `.ai/tasks/TASK-006-prompt-engine.md` — status → done
- `.ai/CURRENT.md` — Prompt Engine 完了を反映

## REASON
外部AIへコピーする依頼文を、毎回同じ見出しで読めるようにした。
Review だけ短文だったため、Task/Debug と同じ GOAL/SCOPE/STOP 構造に揃えた。

## TESTS
- `pnpm --filter @lumina/prompts test` — 5/5 pass
- `pnpm --filter @lumina/prompts typecheck` — OK

## RISKS
- UI は TASK-007 で copy/start/complete 配線の完成度を確認する必要あり
- Handoff の NEXT/ACTION は completeRun 側の日本語文案に依存（プロンプト生成器自体は英語テンプレ）

## NEXT
TASK-007 UI Integration
