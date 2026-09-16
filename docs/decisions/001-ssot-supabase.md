# ADR-001: Single Source of Truth = Supabase

- Status: Accepted
- Date: 2026-09-16

## Decision

Product SSOT is Supabase (Postgres). Notion / Google Sheets are never source of truth.

## V0.1 note

Until a live Supabase project is connected, the app uses a local JSON store at `data/store.json` that mirrors the schema. Migrations in `supabase/migrations/` remain the canonical schema definition.
