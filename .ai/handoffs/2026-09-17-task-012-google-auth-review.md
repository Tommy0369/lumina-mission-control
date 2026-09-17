# Handoff — TASK-012 見直す（Google認証 · セキュリティ）

WORKER: Cursor Security Review（Codex 代行 · Codex 制限中）  
RESULT: SUCCESS — **High/Critical なし**。Medium 1 件は運用 + UI 警告で緩和

## レビュー結論

| 観点 | 判定 |
|------|------|
| OAuth / PKCE コールバック | OK（`exchangeCodeForSession` + 許可外は signOut） |
| middleware | OK（`getUser()`、cookie 引き継ぎ） |
| オープンリダイレクト | OK（`safeRedirectTarget` + テスト） |
| ログアウト | OK（POST のみ） |
| UI ガードのみ（Server Actions 再チェックなし） | ADR-008 意図どおり |

## Finding（Medium · 設定依存）

**許可リスト空 = 任意の Google アカウントがフル UI + Server Actions にアクセス**

- コード: `isEmailAllowed` が空配列で true
- 緩和: README 手順 + ログイン画面の警告パネル（TASK-011/012 で追加）
- 公開デプロイ時は **必ず** `LUMINA_ALLOWED_EMAILS` を設定

## スコープ外（今回触らない）

- RLS / Data API（002 の deny のまま）
- Server Actions への per-request auth（SSOT 移行時）
- サイドバー logout（全ページ dynamic 化のため見送り済み）

## TASK-010 review

本レビュー内容で **TASK-010（本体をつくる）の Codex レビュー合格** とする。

## NEXT

- とみー: `.env.local` で実ログイン一周（TASK-011 残タスク）
- 問題なければ TASK-013 は no-op で close 可
- コミットはとみー承認後
