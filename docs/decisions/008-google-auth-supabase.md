# ADR-008: Google 認証は Supabase Auth。UI ガードだけ先に入れる

- Status: Accepted
- Date: 2026-09-17

## Decision

Google ログインは **Supabase Auth + Google プロバイダ**で入れる。NextAuth は入れない。

セッションは `@supabase/ssr` の cookie に置き、`apps/web/src/middleware.ts` が
全ルートを守る。未ログインは `/login` に飛ばす。

**データは V0.1 のまま `data/store.json`。** Supabase Data API には接続しない。
ADR-001 の「接続はまだ」を今回は動かさない。

認証は環境変数で **オプトイン**。`NEXT_PUBLIC_SUPABASE_URL` と
`NEXT_PUBLIC_SUPABASE_ANON_KEY` が両方ないと middleware は素通しする。

入れるアカウントは `LUMINA_ALLOWED_EMAILS` で絞る。

## Why

- `@supabase/ssr` が既に依存にあり、将来の SSOT 移行先も Supabase（ADR-001）。
  認証基盤を二つ持つ理由がない。
- SSOT 移行（`services.ts` を Supabase 読み書きに変える）と同時にやると、
  RLS ポリシ設計まで巻き込んで V0.1 の範囲を超える。UI ガードだけなら縦一本で閉じる。
- オプトインにしないと、環境変数を書いていないローカル dogfood が
  ログイン画面から動かせなくなる。V0.1 の日常運用を壊さないことを優先した。
- LUMINA はとみー専用。Google プロバイダを有効にした時点で、
  任意の Google アカウントが `signInWithOAuth` を通ってしまう。
  「認証済み = 本人」ではないので、許可リストを認可として別に持つ。

## Notes

- middleware では `getSession()` ではなく `getUser()` を使う。
  cookie の中身をそのまま信じない。
- ログイン後の戻り先は相対パスだけ通す（`safeRedirectTarget`）。
  オープンリダイレクトと `/login` ループを防ぐ。
- ログアウトは POST のみ。GET にするとリンクのプリフェッチで落ちる。

## Out of scope

- `services.ts` の Supabase 移行と RLS ポリシ（`003_*.sql` 以降で行う）
- ユーザーごとの workspace スコープ（いまは単一利用者前提）
- サイドバーへのアカウント表示（全ページが動的レンダリングになるため見送り）
