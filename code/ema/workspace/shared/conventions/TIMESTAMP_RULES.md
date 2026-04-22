# Timestamp Rules

## Default format
Use ISO-8601 UTC timestamps.

Example:
- `2026-04-21T05:11:00Z`

## Required fields where relevant
- `created_at`
- `updated_at`
- `last_activity_at`
- `acknowledged_at`
- `resolved_at`
- `closed_at`

## Rule
If a file claims active current state and has no recent `updated_at`, it should be treated with suspicion.