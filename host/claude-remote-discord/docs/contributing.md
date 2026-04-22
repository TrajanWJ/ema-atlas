# Contributing to ClaudeForge

## Local Development Setup

### Prerequisites

- Node.js 22+
- tmux
- Discord bot token + server ID
- Claude Code CLI installed (`claude` on PATH)

### Getting Started

```bash
# Clone and install
git clone <repo-url>
cd claude-remote-discord
npm install

# Create .env in project root
cat > .env << 'EOF'
DISCORD_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-server-id
DEFAULT_DIRECTORY=/home/you/projects
EOF

# Build all packages
npx turbo run build

# Start everything
node --import tsx packages/server/src/start.ts

# Or start individually
npm run dev:server   # Server on port 3001
npm run dev:bot      # Discord bot
npm run dev:web      # Web UI on port 3002
```

### Database

SQLite database lives at `~/.claudeforge/claudeforge.db`. Delete it to reset all state.

```bash
# Reset database
rm ~/.claudeforge/claudeforge.db
# It will be recreated on next server start
```

---

## Package Structure

| Package | Path | Purpose |
|---------|------|---------|
| `@claudeforge/shared` | `packages/shared/` | Types, events, constants shared by all packages |
| `@claudeforge/server` | `packages/server/` | Express REST API, WebSocket, SQLite, providers |
| `@claudeforge/bot` | `packages/bot/` | Discord.js bot, slash commands, output rendering |
| `@claudeforge/web` | `packages/web/` | Next.js 15 web UI |

Dependencies flow one direction: `shared` ← `server` ← `bot`, and `shared` ← `web`.

---

## How to Add a New Provider

1. **Create the provider file** at `packages/server/src/providers/<name>-provider.ts`

2. **Implement the `AgentProvider` interface:**

```typescript
import type { ProviderEvent } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";

export class MyProvider implements AgentProvider {
  readonly name = "my-provider";

  async *startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent> {
    // Create tmux session for terminal access
    // Yield session_init event
    yield { type: "session_init", providerSessionId: "..." };
    yield { type: "done", sessionId: options.sessionId };
  }

  async *sendMessage(
    sessionId: string,
    message: string,
    dbRecord?: any,
    context?: string
  ): AsyncGenerator<ProviderEvent> {
    // Spawn your CLI / SDK
    // Yield text, tool_use, tool_result events as they stream
    yield { type: "text", content: "Response text" };
    yield { type: "done", sessionId, cost: 0.01 };
  }

  async stopSession(sessionId: string): Promise<void> {
    // Kill the process, clean up
  }

  isSessionActive(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
```

3. **Register in `packages/server/src/providers/index.ts`:**

```typescript
import { MyProvider } from "./my-provider.js";

export class ProviderRegistry {
  private providers = new Map<string, AgentProvider>();

  constructor() {
    this.register(new ClaudeProvider());
    this.register(new MyProvider());  // Add here
  }
}
```

4. **Add the provider name to the shared types** in `packages/shared/src/types.ts`:

```typescript
type ProviderName = "claude" | "codex" | "my-provider";
```

---

## How to Add a New Web Page

1. **Create the page** at `packages/web/src/app/<route>/page.tsx`:

```tsx
export default function MyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#E8E8F0] mb-4">
        My Page
      </h1>
      {/* Content */}
    </div>
  );
}
```

2. **Add navigation** in `packages/web/src/components/layout/TopNav.tsx`:

```tsx
const NAV_ITEMS = [
  { label: "Sessions", href: "/" },
  { label: "Tasks", href: "/tasks" },
  { label: "My Page", href: "/my-page" },  // Add here
  // ...
];
```

3. **Use the design system:**
   - Background: `bg-[#0F0F14]` (void)
   - Cards: `bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg`
   - Text: `text-[#E8E8F0]` (primary), `text-[#8892B0]` (secondary)
   - Primary accent: `text-[#7B61FF]` or `bg-[#7B61FF]`
   - Icons: Lucide React only, `strokeWidth={1.5}`

---

## How to Add a New Slash Command

1. **Define the command** in `packages/bot/src/commands.ts`:

```typescript
{
  name: "mycommand",
  description: "Does something useful",
  options: [
    {
      name: "input",
      description: "The input text",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
}
```

2. **Add the handler** in `packages/bot/src/command-handlers.ts`:

```typescript
case "mycommand": {
  const input = interaction.options.getString("input", true);
  await interaction.deferReply();

  // Do work...

  await interaction.editReply({
    embeds: [{
      title: "Result",
      description: `Processed: ${input}`,
      color: EMBED_COLORS.success,
    }],
  });
  break;
}
```

3. **Re-deploy commands** — commands auto-register on bot startup via `bot.ts`.

---

## How to Add a New REST Endpoint

Add routes in `packages/server/src/rest-api.ts`:

```typescript
app.get("/api/my-endpoint", (_req, res) => {
  const data = db.query("SELECT * FROM ...");
  res.json(data);
});

app.post("/api/my-endpoint", (req, res) => {
  const { field } = req.body;
  if (!field) return res.status(400).json({ error: "field is required" });

  // Do work...
  // Broadcast via WebSocket if state changed:
  ws.broadcast({ type: "my.event", data: result });

  res.json({ ok: true });
});
```

Remember: always broadcast state changes via WebSocket so the web UI stays in sync.

---

## Testing

Currently manual testing. The test bridge at `/api/test/*` provides programmatic access:

```bash
# Create a test session
curl -X POST http://localhost:3001/api/test/session \
  -H "Authorization: Bearer dev-test-token" \
  -H "Content-Type: application/json" \
  -d '{"directory": "/tmp/test", "name": "test"}'

# Send a message and wait for response
curl -X POST http://localhost:3001/api/test/send \
  -H "Authorization: Bearer dev-test-token" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "...", "message": "Hello"}'

# Clean up
curl -X DELETE http://localhost:3001/api/test/session/<id> \
  -H "Authorization: Bearer dev-test-token"
```

---

## Code Style

- **TypeScript strict mode** — no `any`, use `unknown`
- **No `as` assertions** without justification
- **`import type`** for type-only imports
- **Functions ≤ 50 lines**, complexity ≤ 8
- **Files ≤ 800 lines**
- **Conventional commits**: `feat|fix|refactor|docs|test|chore: description`
- **Tailwind utility-first** — no `@apply`
- **Lucide React** for all icons — never emoji in UI chrome

See `CLAUDE.md` for the full coding conventions.
