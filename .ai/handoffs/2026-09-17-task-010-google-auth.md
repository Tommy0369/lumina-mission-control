# Handoff — TASK-010 本体をつくる（Google認証を追加したい）

WORKER: Claude Code / Opus 5 · 超高
RESULT: SUCCESS — 実装完了。本番設定（Supabase / Google Console）は未実施
前段: `.ai/handoffs/2026-09-17-task-009-google-auth-explore.md`

## やったこと

TASK-009 推奨の **A案（UI だけ保護）** を最小縦切りで実装した。
`data/store.json` は触らない。Supabase Data API にも接続しない。

**認証はオプトイン。** `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`
が両方そろわない限り middleware は素通しする。いまのローカル dogfood は今までどおり動く。

決定は `docs/decisions/008-google-auth-supabase.md`（ADR-008）。

## CHANGED FILES

新規:

| ファイル | 役割 |
|---------|------|
| `apps/web/src/middleware.ts` | セッション更新 + 全ルートのガード |
| `apps/web/src/app/login/page.tsx` | ログイン画面（未設定時は手順を表示） |
| `apps/web/src/app/auth/callback/route.ts` | OAuth コールバック（`exchangeCodeForSession`） |
| `apps/web/src/app/auth/signout/route.ts` | ログアウト（POST のみ） |
| `apps/web/src/components/google-sign-in.tsx` | 「Google でログイン」ボタン（client） |
| `apps/web/src/lib/supabase/config.ts` | 環境変数の読み取り・未設定判定 |
| `apps/web/src/lib/supabase/browser.ts` | `createBrowserClient`（cookie セッション） |
| `apps/web/src/lib/supabase/server.ts` | `createServerClient` + `getCurrentUser()` |
| `apps/web/src/lib/auth/policy.ts` | 純粋な判定（公開パス・戻り先検証・許可リスト） |
| `apps/web/src/lib/auth/policy.test.ts` | 上記の単体テスト |
| `docs/decisions/008-google-auth-supabase.md` | ADR-008 |

変更:

| ファイル | 変更 |
|---------|------|
| `apps/web/src/lib/supabase.ts` | 新モジュールへの re-export に置換（deprecated） |
| `apps/web/.env.example` | `LUMINA_ALLOWED_EMAILS` 追記・コメント整理 |
| `README.md` | 「Google ログイン（任意）」の手順を追加 |
| `package.json` | `test` に `policy.test.ts` を追加 |
| `.ai/CURRENT.md` | TASK-010 の状態 |

触っていない: `data/store.json` / `services.ts` / `store.ts` / `supabase/migrations/` / Runner。

## 設計の要点

- **オプトイン**: 未設定なら認証オフ。V0.1 の日常運用を壊さないため（ADR-008）。
- **`getUser()` を使う**: middleware で `getSession()` は使わない。cookie の中身を信じない。
- **許可リスト**: `LUMINA_ALLOWED_EMAILS`（カンマ区切り）。
  Google プロバイダを有効にすると誰でも `signInWithOAuth` を通せる。
  「認証済み = 本人」ではないので、認可を別に持った。空なら全員通る。
- **戻り先の検証**: `safeRedirectTarget` が相対パスだけ通す。
  `//evil.com` `https://...` `/login` は `/` に落とす。
- **リダイレクト時も cookie を載せる**: トークン更新直後に捨てると毎回 refresh が走る。
- **ログアウトは POST**: GET だとプリフェッチで勝手に落ちる。

## TESTS

`pnpm test` — 8 pass / 0 fail（policy 6 件を新規追加）
`pnpm typecheck` — 全パッケージ Done
`pnpm lint` — 0 error（既存の未使用 import 警告 2 件のみ）
`pnpm --filter @lumina/web build` — 成功。Middleware 94.6 kB として登録された

ローカル実機確認（dev サーバー · 偽の Supabase env で認証 ON にして検証）:

| 確認 | 結果 |
|------|------|
| 未設定で `/` | 200。ダッシュボードが今までどおり出る |
| 未設定で `/login` | 200。設定手順を表示 |
| 設定あり・未ログインで `/` | 307 → `/login?next=%2F` |
| 設定あり・未ログインで `/tasks?x=1` | 307 → `/login?next=%2Ftasks%3Fx%3D1`（クエリ保持） |
| `/login` | 200。ループしない |
| `/login?next=https://evil.example.com` | 戻り先が `/` に潰れる |
| `/auth/callback`（code なし） | 307 → `/login?error=missing_code` |
| `GET /auth/signout` | 405 |
| `POST /auth/signout` | 303 → `/login` |
| 静的ファイル `/next.svg` | 200（ガード対象外） |

## KNOWN RISKS

1. **Google 実機ログインは未検証。** Supabase プロジェクトと Google OAuth クライアントが
   まだないため、`signInWithOAuth` → コールバック → cookie の一周は通していない。
   コード経路（コールバックの失敗系・ガード・ログアウト）までは上表のとおり確認済み。
   最初の実ログインで `redirect_uri` 不一致が出たら Supabase の URL Configuration を疑う。
2. **許可リストが空だと誰でも入れる。** `.env.local` に `LUMINA_ALLOWED_EMAILS` を必ず書く。
   README に明記した。
3. **サイドバーにログアウト導線がない。** ログアウトは `/login` を直接開く。
   共通レイアウトに出すと `cookies()` 経由で全ページが動的レンダリングになるため見送った。
4. **RLS はまだ全面 deny のまま**（`002_model_picker_and_rls.sql`）。
   今回は Data API を使わないので問題ないが、SSOT 移行時は `003_*.sql` でポリシ設計が必須。
5. `.next` を共有したまま dev サーバーを二重起動すると、片方の env が
   もう片方に焼き込まれる。検証中に踏んだ。切り替え時は `.next` を消す。

## NEXT

- **TASK-011 自分で確認する（とみー）**: Supabase プロジェクトと Google OAuth を作り、
  `.env.local` を書いて実ログインを一周する。手順は README。
- **TASK-012 見直す（Codex · GPT-5.6 Sol · 高）**: セキュリティ観点。
  cookie の扱い、`safeRedirectTarget`、許可リストの位置、middleware matcher の穴。
- その先（別タスク）: SSOT 移行と RLS ポリシ（B案）。今回のスコープ外。

## ACTION

とみー: Supabase / Google Console の設定 → `.env.local` → 実ログイン確認。
