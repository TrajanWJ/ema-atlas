# Track F — Human Productivity / Capture / Utility vApps

Date: 2026-04-13
Plane: planning
Owning canon: `INT-HUMAN-OPS-BOOTSTRAP`, `INT-PERSONAL-OS-BOOTSTRAP`, `DEC-008-daily-validation-ritual`

## Scope

Today, capture, schedule, journal, focus, responsibilities. Every human productivity surface must attach to shared entity truth — no decorative vApps.

## Entity implications

- **Reuse**: `task`, `brain-dump.inbox-item`, `calendar-entry`, `goal`, `intent`, `human-ops.day-object`
- **New**: none (tier 2) — all productivity surfaces should plug into existing entities

## Current reality

- Wired: `tasks` (239 LOC), `brain-dump` (66 LOC), `notes`, `human-ops` service with routes
- Stub: `journal`, `focus`, `responsibilities` (all 6-LOC)
- Absent: Schedule/Calendar renderer (service `calendar` + schema exist)
- `INT-HUMAN-OPS-BOOTSTRAP` and `INT-PERSONAL-OS-BOOTSTRAP` — both `status: active, phase: execute` but **no execution record created yet**. Stale. Captured in session-recovery intent.

## Implementation sequence

1. **CalendarApp renderer** — new `apps/renderer/src/components/calendar/CalendarApp.tsx`:
   - Day / week view
   - Reads `/api/calendar/entries`
   - Human blocks + agent virtual blocks (both supported in `calendar-entry.kind`)
   - Create/edit entry from the view
2. **Today surface** — extend `apps/renderer/src/components/hq/` with a Today panel:
   - Top 3 tasks (priority-weighted)
   - Today's calendar entries
   - Active workstream + next step
   - Quick-capture input that writes to `/api/brain-dump`
3. **JournalApp** — replace stub with real component that writes `human-ops.day-object` rows:
   - One journal entry per day, append-only
   - Reads last 7 days in side list
4. **ResponsibilitiesApp** — replace stub with list view over `goal` entities filtered to `kind: responsibility` (new enum value on goal schema if needed)
5. **FocusApp** — tier 2, keep stub but wire to local state + optional `human-ops.day-object.focus_minutes`
6. **HumanOpsBootstrap execution** — fulfill `INT-HUMAN-OPS-BOOTSTRAP`:
   - Desk component + daily brief read model
   - Wire inbox triage → tasks
   - Attach to user-state mode/signal axes
   - Create `EXE-*` execution record
7. **PersonalOSBootstrap execution** — fulfill `INT-PERSONAL-OS-BOOTSTRAP`:
   - Persisted day object
   - Daily brief
   - Human + agent schedule in one frame
   - Create `EXE-*` execution record

## Dependencies

- None blocking — this track can run fully in parallel with Tracks A-E if workstream schema has landed
- HumanOps/PersonalOS executions overlap with Track A's Today panel; coordinate via `workstream_id`

## Steal-now imports

- Lunatask Today + capture → Today panel composition
- Sunsama daily planning ritual → CalendarApp day view interactions
- Routine habit-to-calendar → future habit integration (tier 2)
- Braintoss one-tap capture → quick-capture input shape
- Akiflow / Morgen / Twos → reference for unified inbox pattern

## Risk areas

- **Scope creep**: Today can become a dashboard of everything. Cap v1.1 at: top-3 tasks, today's calendar, active workstream next step, quick capture. Nothing else.
- **Focus gimmicks**: No pomodoro audio/animation fireworks. Minimum working timer tied to `day-object.focus_minutes`.
- **Journal storage**: keep append-only. No rewriting past entries from UI.

## Minimum real MVP

- Today panel in HQ shows real tasks, real calendar entries, real workstream next step
- CalendarApp renders today/week with at least one human and one agent block
- JournalApp writes a real `day-object` row with today's journal body
- `INT-HUMAN-OPS-BOOTSTRAP` and `INT-PERSONAL-OS-BOOTSTRAP` each have an execution record linking to the code that fulfilled them
- Responsibilities vApp lists at least two real goal rows
