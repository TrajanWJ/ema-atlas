# Changelog

## 2026-03-22

### Session 2 — Phase 1 Execution (11 Steps)

**Step 1: Documentation + Codebase Audit**
- Created `docs/` skeleton: README, changelog, architecture/, apps/, design/, decisions/, plans/
- ADR-001: Design Token Migration — full old→new mapping
- `docs/design/tokens.md` — canonical token reference
- `docs/architecture/overview.md` — system architecture

**Step 2: Design Token Migration**
- 49 `--place-*` CSS custom properties on `:root` (surfaces, text, teal/blue/amber accents, borders, semantic, typography)
- 14 backward-compatible aliases (old vars → new vars)
- 4 glass tier classes: `.glass-ambient`, `.glass-surface`, `.glass-elevated`, `.glass-accent`
- Body, dock hover, markdown preview updated to new tokens
- Files: `app/globals.css`

**Step 3: Event Bus + App Registry**
- `src/lib/event-bus.ts` — typed event bus with pattern matching, 500-event circular buffer, BroadcastChannel sync
- `src/lib/app-registry.ts` — PlaceApp interface with all optional methods, registerApp/getApp/getAllApps
- `src/lib/app-registrations.ts` — 15 apps registered with id/name/icon/size/dotColor
- 6 stores wired with event emissions (brain-dump, tasks, focus, habits, journal)
- `src/lib/sync-channel.ts` — added `'app_event'` message type

**Step 4: Flux**
- `src/components/apps/flux/` — FluxApp, FluxTimeline, FluxMetaRow
- `src/stores/flux-store.ts` — subscribes to eventBus, persists auto-entries
- `src/db/queries/flux.ts` — CRUD for flux_entries
- `src/lib/flux-formatter.ts` — event-to-human-readable text
- `src/components/icons/FluxIcon.tsx`
- DB migration v7: flux_entries table
- Registered in AppId, constants, AppContent, Dock

**Step 5: Notes App**
- `src/components/apps/notes/` — NotesApp, NotesSidebar, NoteEditor
- `src/stores/notes-store.ts` — CRUD with search, pin, archive, listFiles()
- `src/db/queries/notes.ts` — 8 query functions
- `src/types/note.ts`
- `src/components/icons/NotesIcon.tsx`
- DB migration v6: notes table with source tracking
- Registered in window system + dock

**Step 6: Brain Dump Completion**
- `src/components/apps/brain-dump/KanbanView.tsx` — 3-column board (Inbox/Processing/Done)
- View toggle between Inbox and Board
- "Convert to Note" — creates Note with source_id, opens Notes app
- "Promote to Task" — creates task in Backlog, marks processed
- New store actions: convertToNote, promoteToTask, moveToProcessing
- New queries: setItemAction, getProcessingItems, getAllItems

**Step 7: Timer Widget Mode**
- `src/components/apps/focus/TimerWidget.tsx` — compact 300x48px embeddable widget
- `src/lib/timer-utils.ts` — getTimerStatus(), getTimerFiles()
- Wired getCurrentStatus + listFiles into app registration

**Step 8: Time Blocker Separation**
- `src/components/apps/time-blocker/` — TimeBlockerApp, DayView, WeekView, ActualVsPlanned
- `src/components/icons/TimeBlockerIcon.tsx`
- Embedded TimerWidget in toolbar
- "Start" on blocks launches timer with block's label/duration
- Day view: hourly timeline, drag-to-create, category colors
- Week view: 7-column grid with colored block bars
- Actual vs Planned: dashed outlines vs solid bars, overlap detection
- New queries: getTimeBlocksForDateRange, getFocusBlocksForDateRange
- Registered as "time-blocker" in window system + dock

**Step 9: Tasks Kanban**
- `src/components/apps/tasks/KanbanBoard.tsx`, `KanbanColumn.tsx`, `TaskCard.tsx`
- 4 columns: Backlog/Today/In Progress/Done
- HTML5 drag-and-drop between columns
- TaskCard with priority dots, inline editing, compact design
- View toggle between Kanban (default) and List (existing)
- moveTask() action with event emission
- Brain Dump receiver sends to Backlog

**Step 10+11: System Chrome + Future-proofing**
- `src/components/desktop/WelcomeCard.tsx` — first-run card, localStorage dismiss
- `src/lib/undo-stack.ts` — ReversibleAction protocol, 50-item stack
- `src/stores/theme-store.ts` — three-tier theme merge, applyTheme() via CSS props
- API scaffolding: /api/theme, /api/admin/auth, /api/guestbook, /api/threads, /api/beacon
- `app/canvas/page.tsx` — placeholder
- Drag-to-popout gesture: 200ms outside viewport → auto-detach, edge glow feedback

### Session 1 — Foundation Sprint

**Design & Desktop Chrome**
- Weather-aware generative CSS backgrounds (42 palettes, particles, parallax) — `src/components/desktop/WeatherBackground.tsx`, `WeatherParticles.tsx`, `src/lib/background-images.ts`
- Custom SVG dock icons (15 icons) replacing emoji — `src/components/icons/`
- Rich dock tooltips with name + description — `DockIcon.tsx`, `Tooltip.tsx`
- Tooltip portal fix (stacking context escape via createPortal) — `Tooltip.tsx`
- Interactive menu bar with 4 dropdown menus (brand, processes, clock, status) — `AmbientBar.tsx`, `MenuBarDropdown.tsx`
- Boot screen split layout with auth panel (login/signup/guest) — `BootSequence.tsx`, `AuthPanel.tsx`, `auth-store.ts`
- Portfolio scroll fix (`overflow:hidden` on body) — `(immersive)/layout.tsx`

**Core App Fixes**
- Brain Dump + Tasks interactivity fix: `contain:strict` → `contain:layout paint style`, focusWindow re-render prevention, DB auto-init — `Window.tsx`, `window-store.ts`, `client.ts`
- Brain Dump optimistic add — `inbox-store.ts`
- Journal: timezone bug fix (UTC→local dates), day navigation race condition, CalendarStrip rebuild, OneThingInput, MoodPicker — `journal-store.ts`, `CalendarStrip.tsx`, `date-utils.ts`
- Focus: pause/resume, sound engine init, Pomodoro→TimeBlocks bridge, category legend — `focus-store.ts`, `FocusApp.tsx`, `SessionControls.tsx`
- Terminal: removed invalid hook import
- Settings: fixed `any` casts, built Sound settings tab

**New Features**
- About place.org + About Trajan popup windows — `src/components/apps/about-place/`, `about-trajan/`
- Habits: Week/Month/Streaks views with 7-color system, DB migration v4 — `WeekView.tsx`, `MonthView.tsx`, `StreaksView.tsx`, `HabitTabs.tsx`
- Cool Stuff page: 32 curated items, search, sort, featured section — `src/data/cool-stuff.ts`, `FeaturedSection.tsx`, `SearchInput.tsx`, `SortButtons.tsx`
- Focus app: Timer/TimeBlocks/History tabs, time blocks day planner, session history with bar chart — `TimeBlocksView.tsx`, `HistoryView.tsx`, `MiniTimeline.tsx`

**Windowing System (Modules A-F)**
- A: localStorage persistence with 300ms debounce — `window-persistence.ts`
- B: Popout to real browser windows — `popout-launcher.ts`, `app/popout/[appId]/page.tsx`, `PopoutShell.tsx`, `PopoutTitleBar.tsx`
- C: BroadcastChannel cross-window sync — `sync-channel.ts`, `sync-middleware.ts`, `db-proxy.ts`
- D: Workspace layouts (save/load/delete, 20 cap) — `workspace-store.ts`, AmbientBar integration
- E: Deep links (?ws=BASE64, ?layout=ID) — `deep-links.ts`, `use-deep-link.ts`
- F: Cross-window "Send To" system — `send-to-registry.ts`, `SendToMenu.tsx`, `use-send-to-receiver.ts`
- Smart window placement (cascade → gap-find → center) — `window-store.ts`
- AppContent extracted to shared component — `AppContent.tsx`
- Popout 404 fix: renamed route group to real segment

**DB Migrations**
- v4: `ALTER TABLE habits ADD COLUMN color TEXT`
- v5: `CREATE TABLE time_blocks`
