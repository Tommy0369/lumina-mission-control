# CURRENT

Dashboard は NEXT ACTION 優先（TASK-003 done）。
Router はルールベース完成（TASK-004 done）。ADR-004 参照。
Prompt Engine 完成（TASK-006 done）。ADR-005 参照。
Task Detail の Run/Handoff配線完了（TASK-007 done）。レビュー待ちの無限ループを修正。ADR-006参照。
TASK-008 監査の阻害と残存リスクを解消（ADR-007）。
TASK-004 見直し完了。review / security は Codex 制限中も担当を落とさない。
Google認証 UI ガード実装済み（TASK-010 done · TASK-012 レビュー合格）。ADR-008。
認証オフ = env 未設定。TASK-011 回帰は `pnpm verify:auth`。Google 実ログインは `.env.local` 設定後にとみー確認。
次の一歩: TASK-013（指摘なしならスキップ可）または dogfood へ戻る。

おすすめは「アプリの画面と同じモデル名 + 仕事量」で出す。

ChatGPT / Codex: 低 / 中 / 高 / 極高 / ウルトラ。GPT-5.5 は極高まで（2026-10-14 退役、推奨しない）。
- 軽い: GPT-5.6 Luna · 低
- いつもの: GPT-5.6 Terra · 中
- 難しい: GPT-5.6 Sol · 高
- いちばん難しい: GPT-6 Astra · 極高

Claude Code: 低 / 中 / 高 / 超高 / 最大。ultracode はセッションモード（おすすめにしない）。
- 軽い: Haiku 4.5（仕事量なし）
- いつもの: Sonnet 5 · 高
- 難しい: Opus 5 · 超高
- いちばん長い: Fable 5.1 · 最大

作戦作成: ホームでやりたいこと + **3 問ヒアリング**（ADR-009）。おすすめは初推定。

日常の入口:
1. ホーム最上段「いまやる一手」を開く（依頼中 → 見直し待ち → これから）
2. 画面のモデルと仕事量を合わせて選ぶ → 依頼文コピー → 外部AI → できた/つまった
3. 申し送り → 次へ
4. 新規は「やりたいことを書く」から作戦作成
5. 直す・やめるは各画面の「詳しく」

使い方: `/how-to`
設定のカタログ: `/settings`
