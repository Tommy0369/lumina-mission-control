# Handoff — TASK-009 場所を探す（Google認証を追加したい）

WORKER: Cursor / Composer 2.5 Fast  
RESULT: SUCCESS — 調査のみ。実装・本番設定変更なし

## ゴール

「Google認証を追加したい」を **このリポジトリ（LUMINA Mission Control）** に入れる場合の、触る場所と現状の整理。

## 現状サマリ

| 項目 | 状態 |
|------|------|
| Google / OAuth 実装 | **なし** |
| `middleware.ts` | **なし** |
| ログイン・callback ルート | **なし** |
| `@supabase/supabase-js` | 依存あり（未配線の stub のみ） |
| `@supabase/ssr` | 依存あり（**コード未使用**） |
| データ | V0.1 は `data/store.json`。Supabase はスキーマ正本・**未接続**（ADR-001） |
| RLS | 002 で全テーブル RLS 有効 + `anon`/`authenticated` から revoke（接続前の安全側） |
| API Key / OAuth secret | DB・seed 禁止（AGENTS.md）。Supabase Dashboard / 環境変数のみ |

## 既存で関連するファイル

- `apps/web/src/lib/supabase.ts` — `isSupabaseConfigured()` / `createBrowserSupabase()` のみ。SSR・cookie セッションなし。
- `apps/web/.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` のプレースホルダ。
- `supabase/migrations/001_init.sql` — プロダクト用テーブル（workspace/project/task…）。**`auth.users` は Supabase 組み込み**（この repo の migration には含めない）。
- `supabase/migrations/002_model_picker_and_rls.sql` — 接続後に **RLS ポリシ設計が必須**（現状は全面 deny）。
- `apps/web/src/app/layout.tsx` — 全ページ共通シェル。**認証ガードなし**（誰でもローカル UI を見られる）。
- `apps/web/src/lib/services.ts` + `store.ts` — Server Actions 経由で JSON を読み書き。**ユーザー ID 概念なし**。
- `docs/architecture/product-brief.md` — V0.1 はローカル JSON、Supabase 接続は「まだ」。

ルーティング・作戦生成（参考のみ）:

- `createPlanFromIdea` — 「Google」「認証」で auth ドメインの 5 段作戦を生成。
- `packages/router` — auth 高 complexity → Claude strong + Codex review。

## 推奨：Google 認証の置き場（Next 15 + Supabase Auth）

**方針**: NextAuth は入れない。既に `@supabase/ssr` があるので **Supabase Auth + Google プロバイダ** が最短。

### 新規作成が想定されるパス（TASK-010 用）

1. `apps/web/src/lib/supabase/browser.ts` — `createBrowserClient`（@supabase/ssr）
2. `apps/web/src/lib/supabase/server.ts` — `createServerClient` + cookies（Server Components / Actions）
3. `apps/web/src/middleware.ts` — セッション更新（Supabase 公式 Next.js ガイドと同型）
4. `apps/web/src/app/auth/callback/route.ts` — OAuth コールバック（`exchangeCodeForSession`）
5. `apps/web/src/app/login/page.tsx` — 「Google でログイン」→ `signInWithOAuth({ provider: 'google' })`
6. （任意）`apps/web/src/app/(protected)/layout.tsx` — 未ログイン時 `/login` へ。既存ページを `(protected)` 配下に移すか、middleware matcher で `/projects` 等だけ保護。

### 触るがロジックは薄い

- `apps/web/.env.example` — ローカル Supabase / 本番 URL のコメント追記（secret は example に書かない）
- `apps/web/src/lib/supabase.ts` — 上記に分割したら deprecated 統合 or 再エクスポート

### インフラ・コンソール（コード外）

1. **Supabase プロジェクト** — Authentication → Providers → Google 有効化（Client ID/Secret は Dashboard）
2. **Google Cloud Console** — OAuth 同意画面 + Web クライアント。Redirect URI は Supabase が提示する `https://<ref>.supabase.co/auth/v1/callback`
3. **ローカル開発** — `supabase start` 時は CLI の auth URL / `http://127.0.0.1:54321` 系を Google に登録
4. **接続後 RLS** — `workspace_id` と `auth.uid()` を結ぶポリシを **003 以降の migration** で追加（002 の revoke を置き換え）

### V0.1 とのギャップ（TASK-010 で決める）

- **A. UI だけ保護** — ログインしないと Mission Control を見られない（JSON store はサーバー側 FS のまま）
- **B. SSOT 移行とセット** — `services.ts` を Supabase 読み書きに切替 + RLS（スコープ大。V0.1 の「接続はまだ」と衝突しやすい）

**推奨（小さく始める）**: まず **A**（middleware + login + callback）。store は従来どおり。将来 B で migration。

## TASK-010（本体をつくる）への申し送り

- **担当**: Claude Code · Opus 5 · 超高（store 上の recommendation のまま）
- **スコープ**: 上記 1–5 の最小縦切り + `.env.local` の手順 README 1 段落（secret なし）
- **DO NOT TOUCH**: `data/store.json` の dogfood データ削除、Runner V0.2、API key を DB/seed に保存
- **ACCEPTANCE**: ローカルで Google ログイン → セッション cookie → 保護ルートに入れる / 未ログインは `/login`
- **レビュー**: Codex（TASK-010 は `reviewRequired: true`）

## contextFiles（TASK-010 に載せるとよい）

- `.ai/handoffs/2026-09-17-task-009-google-auth-explore.md`（本ファイル）
- `apps/web/src/lib/supabase.ts`
- `docs/decisions/001-ssot-supabase.md`
- `supabase/migrations/002_model_picker_and_rls.sql`

## TESTS

- 探索のみ — `pnpm test` 変更なし

## RISKS

- RLS が deny のまま Supabase に接続すると Data API が使えない → 認証だけ先に入れるなら JSON store 継続で OK
- 全ページをいきなり protected にするとローカル dogfood が面倒 → `(protected)` か matcher を段階的に
