# Handoff — TASK-003 UI Prototype / Dashboard

WORKER: cursor / balanced
RESULT: SUCCESS

## CHANGED
- `apps/web/src/app/page.tsx` — Dashboard order: NEXT → BLOCKER → RUNNING → RESOURCE → PROGRESS
- `.ai/CURRENT.md` — 日常入口を NEXT ACTION 優先に更新
- `.ai/tasks/TASK-003-ui-dashboard.md` — status → done
- `.ai/handoffs/2026-09-17-task-003-ui-dashboard.md` — this file

## REASON
朝開いて「いまこれやれ」が最上位に来る。
詰まり → 実行中 → 使いすぎ目安 → 今日の進み、の順で判断できる。
新規アイデア入力は二次導線として末尾に残した。

## TESTS
- [ ] `pnpm --filter @lumina/web dev` で `/` を開き、セクション順を目視
- [ ] seed済みなら「いまやる一手」に nextTask が出る
- [ ] blocked / running が空でも空状態文が出る
- [ ] リソース行と「詳しく」→ `/resources` が繋がる
- [ ] 「作戦をつくって…」で新規プラン導線が動く

## RISKS
- getDashboard の nextTask 選定（ready優先→running）は既存ロジックのまま。優先度UIは未追加
- 日常用語を維持したため、内部ラベル（RP等）は画面に出していない
- 実ブラウザでのレイアウト確認は未実施（実装側スモークのみ想定）

## NEXT
TASK-007 UI Integration（Task Detail: prompt copy / start / complete / handoff）
または TASK-004 AI Router を並行で進めてよい。
