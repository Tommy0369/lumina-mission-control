# ADR-004: Rule-based agent/tier routing (no ML)

## Decision

V0.1 routing is deterministic rules in `@lumina/router` (`routeTask`).
No ML ranking. Humans may override recommendations.

## Rules (priority order)

1. **XL / complexity ≥ 9** → block execution, recommend split, plan via ChatGPT/LUMINA max
2. **review / security** → Codex strong
3. **planning** → ChatGPT/LUMINA
4. **exploration / UI** → Cursor
5. **auth / db / security domain + complexity ≥ 6** → Claude Code strong + Codex review
6. **complexity bands** → Cursor (low) / Claude or Cursor (mid) / Claude or Codex debug (high)
7. **Resource RED** on chosen agent → reroute to Cursor unless the task is a blocker **or** `review` / `security` (independent review must not degrade)
8. **Resource YELLOW** → downgrade strong → balanced when complexity < 7, except `review` / `security`

## Why

Subscription-first Manual Orchestration needs explainable reasons (`routingReasons`),
not opaque model scores. XL split prevents runaway strong-model burns.

## Out of scope

ML routing, Local Runner auto-exec, billing, team ACL.
