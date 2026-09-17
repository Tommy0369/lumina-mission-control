# Handoff — TASK-011 自分で確認する（Google認証）

WORKER: Cursor / Composer 2.5 Fast  
RESULT: SUCCESS（認証オフ回帰 + 失敗系経路）。**Google 実ログイン一周は `.env.local` 未配置のため Cursor 内では未実施**

## 実施した確認（FACT）

| 項目 | 結果 |
|------|------|
| `pnpm verify:auth`（localhost:3000） | 5/5 pass |
| `pnpm test` | 8 pass |
| dev 稼働 | とみー報告どおり 3000 正常（認証オフ） |
| `apps/web/.env.local` | **なし** → middleware 素通し |

`pnpm verify:auth` が見るもの:

- `/` 200（認証オフ）
- `/login` 200
- `/auth/callback` → `missing_code`
- `GET /auth/signout` 405 / `POST` → `/login`

## Google 実ログイン（とみーが 5 分でやること）

1. Supabase + Google Console（README「Google ログイン（任意）」）
2. `apps/web/.env.local` に URL / anon key / **LUMINA_ALLOWED_EMAILS=自分のメール**
3. dev 再起動（**二重起動しない**。切替時は `.next` 削除）
4. `/` → `/login` → Google → `/auth/callback` → `/` に戻る
5. 別 Google アカウントで `not_allowed` になること（任意）

## UI 改善（TASK-012 指摘に連動）

- ログイン画面: 許可リスト空のとき警告パネル（fail-open の明示）

## NEXT

- **TASK-012 見直す**: Codex 相当のセキュリティレビュー完了 → TASK-010 の review クローズ
- 実ログイン確認後、問題なければ TASK-013「直して仕上げる」はスキップ可
