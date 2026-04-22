# Module 5: Three Screens, One Brain

### Teaching Arc
- **Metaphor:** A sports scoreboard system — the game (source of truth) happens on the field, but the stadium scoreboard, the TV broadcast, and the radio commentary all show the same score simultaneously because they all listen to the same announcer (the event system)
- **Opening hook:** Open a session in Discord. Check the web UI — it's there too. Attach via terminal — same session. How does one action show up in three places simultaneously?
- **Key insight:** Events + a single source of truth (SQLite database) + real-time broadcast (WebSocket) = perfect sync across any number of surfaces
- **"Why should I care?":** The event-driven pattern is how every modern real-time app works — chat apps, dashboards, collaborative editors. Understanding it here means you can direct AI to build any of them.

### Screens
1. **One truth, many views** — SQLite as the source of truth, events as the broadcast
2. **The event system** — ServerEvent types and how they flow
3. **WebSocket: the live wire** — How the web UI stays in sync
4. **Discord: the output handler** — How streaming text becomes Discord embeds
5. **The persistence layer** — SQLite with WAL mode, migrations
6. **Quiz** — 3 questions

### Code Snippets (pre-extracted)

Snippet 1 — Server events (packages/shared/src/events.ts lines 28-42):
```typescript
export type ServerEvent =
  | { type: "session.output"; sessionId: string; data: ProviderEvent }
  | { type: "session.status"; sessionId: string; status: SessionStatus }
  | { type: "session.created"; session: SessionRecord }
  | { type: "session.updated"; session: SessionRecord }
  | { type: "session.closed"; sessionId: string }
  | { type: "message.created"; message: ChatMessage }
  | { type: "project.created"; project: ProjectLocation }
  | { type: "project.updated"; project: ProjectLocation }
  | { type: "task.created"; task: TaskRecord }
  | { type: "task.updated"; task: TaskRecord }
  | { type: "system.health"; data: SystemHealth }
  | { type: "system.status"; data: AppStatus }
  | { type: "system.error"; data: { source: string; message: string; severity: string } }
  | { type: "provider.health"; data: ProviderHealthStatus[] };
```

Snippet 2 — Event emission in consumeProviderStream (packages/server/src/session-manager.ts lines 278-280):
```typescript
        // Emit raw event for real-time subscribers (Discord bot, WebSocket)
        this.emit("session.output", sessionId, event);
```

Snippet 3 — Persistence init (packages/server/src/persistence.ts lines 20-32):
```typescript
export class Persistence {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.init();
    this.applyMigrations();
  }
```

Snippet 4 — Client commands (packages/shared/src/events.ts lines 46-54):
```typescript
export type ClientCommand =
  | { type: "session.message"; sessionId: string; content: string }
  | { type: "session.create"; directory: string; name: string; provider?: string; model?: string }
  | { type: "session.stop"; sessionId: string }
  | { type: "session.resume"; sessionId: string }
  | { type: "task.create"; data: Partial<TaskRecord> }
  | { type: "task.update"; taskId: string; data: Partial<TaskRecord> }
  | { type: "shell.run"; sessionId: string; command: string }
  | { type: "replay"; since: number };
```

### Interactive Elements

- [x] **Data flow animation** — actors: Claude CLI, SessionManager, SQLite DB, WebSocket, Discord Bot, Web UI. Steps: Claude emits event -> SessionManager receives -> stores in SQLite -> emits to EventEmitter -> WebSocket broadcasts to web -> Discord bot renders to channel
- [x] **Code-English translation** — Snippet 1 (ServerEvent types) and Snippet 3 (Persistence init)
- [x] **Icon-label rows** — The 3 surfaces: Discord (mobile-first chat), Web UI (desktop dashboard), Terminal (raw tmux access)
- [x] **Callout** — "Aha!" about WAL mode: SQLite normally locks the whole database when writing. WAL (Write-Ahead Logging) lets readers and writers work simultaneously — critical when you have a streaming AI writing events while the web UI reads them
- [x] **Quiz** — 3 questions about event flow, consistency, and what happens when the web UI reconnects

### Connections
- **Previous module:** "The Claude Whisperer" — showed how events are generated from Claude CLI
- **Next module:** "When Things Break" — what happens when the pipeline fails
- **Tone:** Teal accent. Module background: var(--color-bg) (even module).
