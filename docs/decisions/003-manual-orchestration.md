# ADR-003: V0.1 Manual Orchestration + State-First Runs

- Status: Accepted
- Date: 2026-09-16

## Decision

V0.1 does not auto-execute CLIs. Runs are recorded manually.

When a run starts, insert the `runs` row immediately with status `running` (state-first). Do not wait until completion to create the record.

## Rationale

Learned from ai-orchestra: writing state only at the end causes duplicate / lost work under concurrency and long jobs.
