# ADR-007: V0.1 CRUD is companion-scale, not an admin console

- Status: Accepted
- Date: 2026-09-17

## Decision

V0.1 keeps Project / Mission / Task create-read-update-delete.

Daily UI is still the companion path: write an idea, read the plan, advance a step through Run. Edit and delete live under 「詳しく」, with a typed confirmation for delete.

Status is not edited by hand. `completeRun` moves a step through running / review / done / blocked.

## Why

The original V0.1 brief asked for CRUD. The companion rewrite hid admin screens, which looked like a silent scope cut. This records the actual surface: services and UI both have C/R/U/D, without turning LUMINA into a table editor.

## Out of scope

Bulk edit, permissioned multi-user delete, and live Supabase Data API CRUD.
