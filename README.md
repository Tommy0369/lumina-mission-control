# LUMINA AI Mission Control

**Plan. Route. Build. Review. Learn.**

開発管制塔。やりたいことを入力すると、Task分解・AI推薦・Prompt生成・手動Run記録・Handoff・次AI提示・Resource Pointsまでを回す。

## V0.1 = Manual Orchestration

自動CLI実行はしない。

1. Taskを開く
2. Recommended Agent / Tier を確認
3. Promptをコピー
4. 外部AI（Cursor / Claude Code / Codex / ChatGPT）で作業
5. Resultを登録
6. Handoffと次AIが出る

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

Dashboard の **Seed Dogfood Project** で Mission Control 自身の開発タスクが入る。

## Monorepo

```text
apps/web              Next.js UI
packages/core         types / RP / task size
packages/router       rule-based AI router
packages/prompts      prompt + handoff generator
packages/ui           shared UI primitives
packages/runner-protocol  V0.2 types only
supabase/             migrations + seed
runner/               empty stub (V0.2)
data/store.json       local SSOT for V0.1
```

## Principles

- Projectは共有、Task記憶は分離、モデルは仕事に合わせる
- Subscription First / API Last（V0.2 runner）
- Run開始時に行を先に作る（状態先確定）
- Capability Tier: fast / balanced / strong / max
- API KeyをDBに保存しない

## Supabase

Migrations: `supabase/migrations/`

V0.1はローカルJSONで動く。Supabase接続時は:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## Docs

- [Product brief](docs/architecture/product-brief.md)
- [ADRs](docs/decisions/)
