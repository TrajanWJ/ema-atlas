# Module 1: What Is ClaudeForge?

### Teaching Arc
- **Metaphor:** Air traffic control tower — a single control room that coordinates all the planes (AI coding agents) on the runway (your machine), letting you talk to them from anywhere via radio (Discord/web)
- **Opening hook:** Imagine typing a message on your phone in Discord, and watching an AI agent edit code files on your computer hundreds of miles away.
- **Key insight:** ClaudeForge bridges three surfaces (Discord, web browser, terminal) to one source of truth — your machine running AI coding agents
- **"Why should I care?":** Understanding this system means you can direct AI coding agents remotely, manage multiple coding sessions at once, and know what's happening under the hood when something goes wrong

### Screens
1. **What does ClaudeForge actually do?** — Product overview with a visual diagram of the 3 surfaces
2. **Your first message: end-to-end trace** — Step cards tracing a Discord message through the system
3. **The three surfaces** — Pattern cards for Discord, Web UI, Terminal
4. **Quiz** — 3 scenario questions

### Code Snippets (pre-extracted)

Snippet 1 — Session creation (packages/server/src/session-manager.ts lines 32-58):
```typescript
async createSession(req: CreateSessionRequest): Promise<SessionRecord> {
    const id = nanoid(12);
    const tmuxName = `${SESSION_PREFIX}${req.name}-${id.slice(0, 6)}`;
    const now = Date.now();

    const session: SessionRecord = {
      id,
      name: req.name,
      projectId: req.projectId,
      projectName: req.projectName,
      directory: req.directory,
      channelId: req.channelId ?? null,
      provider: req.provider ?? "claude",
      providerSessionId: null,
      tmuxName,
      model: req.model ?? null,
      mode: req.mode ?? "auto",
      agentPersona: null,
      systemPrompt: req.systemPrompt ?? null,
      status: "active",
      verbose: false,
      createdAt: now,
      lastActivity: now,
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
    };

    this.db.upsertSession(session);
```

Snippet 2 — Architecture overview from SPEC.md:
```
┌─────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Claude Code   │    │ Claude Code   │    │   Codex      │  │
│  │ Session A     │    │ Session B     │    │  Session C   │  │
│  │ (tmux-a)      │    │ (tmux-b)      │    │ (tmux-c)     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         └────────────┬───────┘────────────────────┘          │
│              ┌───────▼────────┐                              │
│              │  ClaudeForge   │                              │
│              │    Server      │                              │
│              └──┬─────────┬──┘                              │
│         ┌───────▼──┐  ┌──▼────────┐                         │
│         │ Discord  │  │  Web UI   │                         │
│         │   Bot    │  │  Server   │                         │
│         └────┬─────┘  └─────┬────┘                          │
└──────────────│──────────────│────────────────────────────────┘
       ┌───────▼──┐    ┌─────▼──────┐
       │ Discord  │    │  Browser   │
       │ Server   │    │  (Web UI)  │
       └──────────┘    └────────────┘
```

### Interactive Elements

- [x] **Code-English translation** — Snippet 1 (session creation)
- [x] **Data flow animation** — actors: Discord User, Discord Bot, ClaudeForge Server, Claude CLI, Host Filesystem. Steps: user types message -> bot receives -> server routes -> Claude CLI spawns -> reads/edits files -> streams response -> back to Discord
- [x] **Pattern cards** — 3 cards for the 3 surfaces (Discord, Web, Terminal)
- [x] **Quiz** — 3 scenario questions testing understanding of the 3-surface architecture

### Connections
- **Previous module:** None (this is module 1)
- **Next module:** "Meet the Cast" — introduces the 4 packages that make up ClaudeForge
- **Tone:** Teal accent (#2A7B9B). Actor colors: Discord Bot = actor-1 (vermillion), Server = actor-2 (teal), Claude CLI = actor-3 (plum), Web UI = actor-4 (golden), Terminal = actor-5 (forest). Module background: var(--color-bg) (even module).
