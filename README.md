# LUMINA

やりたいことを書くと、  
**どのAIの・どのモデルで・どこまで作って・次に何を渡すか** をデザインし、  
完成まで伴走する。

## 使い方（これだけ）

1. ホームでやりたいことを書く
2. 作戦（段取り）が出る
3. 「いまの一歩」で依頼文をコピー → 外部AIで作業
4. 「できた / つまった」を押す
5. 申し送りを見て次へ。完成まで繰り返す

自動でCLIは動かさない（手動伴走）。

## 起動

```bash
pnpm install
pnpm dev
```

http://localhost:3000  
詳しい説明: アプリ内「使い方」または `docs/architecture/product-brief.md`

## Mac デスクトップから開く

```bash
pnpm desktop:install
```

デスクトップに **LUMINA.app** ができる。ダブルクリックで dev が未起動なら自動起動し、ブラウザのアプリウィンドウで開く。  
アイコン再生成: `assets/macos/README.md`

## Google ログイン（任意）

`apps/web/.env.local` に Supabase の URL と anon key を書くと、認証が有効になる。
**書かなければ認証はオフのまま**で、いままでどおり `data/store.json` だけで動く。

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
LUMINA_ALLOWED_EMAILS=you@example.com
```

`LUMINA_ALLOWED_EMAILS` は入れるアカウントの許可リスト（カンマ区切り）。
空にすると Google でログインできた人は誰でも入れるので、個人利用なら必ず書く。

コンソール側の設定は一度だけ:

1. Supabase → Authentication → Providers → Google を有効化し、Client ID / Secret を入れる
2. Google Cloud Console → OAuth クライアント（Web）を作り、承認済みリダイレクト URI に Supabase が示す `https://<project-ref>.supabase.co/auth/v1/callback` を登録
3. Supabase → Authentication → URL Configuration に `http://localhost:3000/**` を追加
4. `.env.local` を書いたら dev サーバーを再起動

Client ID / Secret・service role key はこのリポジトリにも DB にも置かない（`AGENTS.md`）。

## 構成

```text
apps/web                 伴走UI
packages/core            型・見積もり
packages/router          おすすめAIのルール（裏）
packages/prompts         依頼文・申し送り生成（裏）
packages/ui              UI部品
supabase/                将来の正本スキーマ
data/store.json          いまのローカルデータ
```

## 思想

強いAIを全部に使わない。  
必要な最小のAI計算で、完成まで届ける。
