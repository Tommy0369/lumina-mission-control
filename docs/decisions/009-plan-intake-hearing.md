# ADR-009: 作戦作成時の 3 問ヒアリング（初推定の入力）

- Status: Accepted
- Date: 2026-09-17

## Decision

ホームで作戦をつくるとき、**3 問**を必ず答える。

1. どこを触るか（既存 / 新規 / UI のみ / 不明）
2. 本番・ユーザーへの影響（手元のみ / 触れるかも）
3. いつまでに（余裕 / 今週 / 今日）

回答は `Project.planIntake` に保存し、`createPlanFromIdea` が
ミッションの risk・complexity、各タスクの scope/risk/domain、
`routingReasons`（`plan_intake` 等）に反映する。

依頼文（`generateTaskPrompt`）の CONTEXT にヒアリング要約を載せる。

## Why

- おすすめAIは ADR-004 の固定ルール。**一行アイデアだけでは逆算が浅い**。
- 「推薦 = 正解」ではなく **初推定** と明示し、完成まで伴走するため入力を厚くする。
- ML ルーティングは入れない。説明可能なルール + ヒアリングで十分。

## Notes

- 既存プロジェクト（ヒアリング前に作ったもの）に `planIntake` は無い。表示・依頼文は従来どおり。
- 人は Run 開始時に AI / モデルを上書きできる（ADR-004）。

## Out of scope

- Run 直前の追加ヒアリング（B）
- 上書き理由の必須記録（B）
- `routeTask` への intake 専用引数（C — いまは task メタ経由）
