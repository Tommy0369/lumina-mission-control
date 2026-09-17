# Handoff — TASK-005 Router Review

WORKER: codex / strong
RESULT: SUCCESS

## CHANGED
- `apps/web/src/lib/seed.ts` — display/default routing priorities now match ADR-004: XL first, review/security second, auth/db/security-domain high-complexity later.
- `supabase/seed/001_agents.sql` — seeded routing rule priorities now match ADR-004 and update on conflict so reruns do not preserve stale priority/order.
- `.ai/tasks/TASK-005-router-review.md` — status → done.
- `.ai/handoffs/2026-09-17-task-005-router-review.md` — this handoff.

## REVIEWED
- `packages/router/src/route.ts` — `routeTask` implements deterministic V0.1 routing: XL split first, review/security to Codex strong, planning to ChatGPT/LUMINA, UI/exploration to Cursor, sensitive implementation to Claude + Codex review, resource RED/YELLOW pressure handling.
- `packages/router/src/router.test.ts` — tests cover planning, XL by complexity, XL by file count, review → Codex strong, RED reroute, blocker exception, and YELLOW downgrade.
- `docs/decisions/004-rule-based-routing.md` — route implementation matches the documented rule order.

## REASON
The runtime router already matched the V0.1 rule plan. The only review finding was that display/seed rules ordered auth/db/security-domain before review/security, which contradicted ADR-004 and could mislead the UI or a future table-backed router.

## TESTS
- `pnpm --filter @lumina/router test` — 9/9 pass.
- `pnpm --filter @lumina/router typecheck` — OK.
- `pnpm --filter @lumina/web typecheck` — OK.

## RISKS
- `routingRules` remains a display/default dataset while `routeTask` is the execution source of truth. Keep this explicit until a table-backed router exists.
- Resource pressure can still reroute Codex review/security work to Cursor when Codex is RED and the task is not marked as a blocker. This matches ADR-004, but security-sensitive operations should be marked blocker when reviewer identity must not degrade.

## NEXT
Proceed to TASK-006 Prompt Engine.
