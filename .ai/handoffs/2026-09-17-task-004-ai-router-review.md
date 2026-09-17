# Handoff — TASK-004 AI Router 見直し

WORKER: Cursor（Codex制限のためここで実施） / GPT-5.6 Sol 相当
RESULT: SUCCESS — 1件直して PASS

## FOCUS

独立見直し。実装の再実行ではない。

## FINDINGS

1. **直した** Codex が RED / YELLOW のとき、review / security まで Cursor や弱い帯へ落ちていた。
   制限中でも見直し担当は動かさない。ADR-004 の 7 / 8 を更新。

表示用 `routingRules` は実行正本ではない。これは既知で、画面に注記した。

## CHANGED

- `packages/router/src/route.ts`
- `packages/router/src/router.test.ts`
- `docs/decisions/004-rule-based-routing.md`
- `apps/web/src/lib/seed.ts`
- `apps/web/src/app/routing/page.tsx`

## TESTS

- router tests
- typecheck
- 既存の orchestration テスト
