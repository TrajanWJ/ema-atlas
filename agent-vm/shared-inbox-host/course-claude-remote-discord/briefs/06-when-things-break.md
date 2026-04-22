# Module 6: When Things Break

### Teaching Arc
- **Metaphor:** A building's fire safety system — smoke detectors (safety gates) catch problems before they spread, sprinklers (timeouts) contain damage automatically, and fire exits (error handlers) give people a safe way out. The building doesn't just hope nothing catches fire — it's designed to handle it.
- **Opening hook:** What happens when someone types `rm -rf /` in a Discord channel? What if Claude hangs for 10 minutes? What if the server restarts mid-session?
- **Key insight:** Production software isn't about preventing all errors — it's about designing systems that fail gracefully and recover automatically
- **"Why should I care?":** Understanding defensive patterns (safety gates, timeouts, retries, graceful degradation) helps you tell AI agents to build robust software instead of fragile demos

### Screens
1. **The safety gate** — Block, warn, safe classification for shell commands
2. **Timeouts: the dead man's switch** — 5-minute process timeout, 2-minute hang detection
3. **Graceful recovery** — Lazy session reconstruction after server restart
4. **The concierge** — Helpful fallbacks when routing fails
5. **Quiz** — 4 scenario debugging questions

### Code Snippets (pre-extracted)

Snippet 1 — Safety result types (packages/shared/src/types.ts lines 237-242):
```typescript
export interface SafetyResult {
  level: "safe" | "warn" | "block";
  reason?: string;
  confirmPrompt?: string;
}
```

Snippet 2 — Process timeout (packages/server/src/providers/claude-provider.ts lines 132-140):
```typescript
    const TIMEOUT_MS = 5 * 60 * 1000;
    const processTimeout = setTimeout(() => {
      console.error(`[claude-provider] Timeout for ${sessionId}, killing process`);
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (proc.exitCode === null) proc.kill("SIGKILL");
      }, 5000);
    }, TIMEOUT_MS);
```

Snippet 3 — Lazy reconstruction (packages/server/src/providers/claude-provider.ts lines 67-86):
```typescript
    // Lazy-reconstruct session from DB record after server restart
    if (!session && dbRecord) {
      const tmuxName = `${SESSION_PREFIX}${sessionId}`;
      const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", dbRecord.directory], {
        stdio: "ignore",
      });
      await new Promise<void>((resolve) => tmuxCreate.on("close", () => resolve()));
      
      session = {
        id: sessionId,
        process: null,
        tmuxName,
        directory: dbRecord.directory,
        providerSessionId: dbRecord.providerSessionId ?? undefined,
        model: dbRecord.model ?? undefined,
        mode: dbRecord.mode ?? undefined,
      };
      this.sessions.set(sessionId, session);
      console.log(`[claude-provider] Reconstructed session ${sessionId} from DB`);
    }
```

Snippet 4 — Error handling with actionable messages (packages/bot/src/message-handler.ts lines 665-699):
```typescript
  private async handleSessionError(message: Message, errorMsg: string, sessionId: string): Promise<void> {
    try { await message.reactions.cache.get("⏳")?.users.remove(message.client.user!.id); } catch { /* */ }
    try { await message.react("❌"); } catch { /* */ }

    const session = this.sessions.get(sessionId);
    let suggestion = "";

    if (errorMsg.includes("No conversation found") || errorMsg.includes("stale")) {
      suggestion = "\nThe session may be stale. Retrying with a fresh session...";
    } else if (errorMsg.includes("SIGTERM") || errorMsg.includes("timeout") || errorMsg.includes("Timed out")) {
      suggestion = "\nThe request timed out. Try a shorter or more focused question.";
    } else if (errorMsg.includes("spawn") || errorMsg.includes("ENOENT")) {
      suggestion = "\nIs `claude` CLI installed and on PATH? Check with `which claude`.";
    } else if (errorMsg.includes("tmux") || errorMsg.includes("TMUX")) {
      suggestion = "\nIs tmux installed? Try `tmux -V` to verify. Install with `sudo apt install tmux`.";
    } else if (errorMsg.includes("permission") || errorMsg.includes("EACCES")) {
      suggestion = "\nPermission denied. Check file/directory permissions.";
    } else {
      suggestion = "\nTry `/session end` then send your message again to start fresh.";
    }
```

### Interactive Elements

- [x] **Code-English translation** — Snippet 2 (timeout) and Snippet 3 (lazy reconstruction)
- [x] **Pattern cards** — 4 defensive patterns: Safety Gates, Timeouts, Lazy Recovery, Actionable Errors
- [x] **Step cards** — The timeout escalation: 1) 5-minute timer starts 2) SIGTERM sent (polite ask) 3) 5 more seconds 4) SIGKILL (force kill)
- [x] **Callout** — "Aha!" about SIGTERM vs SIGKILL: SIGTERM asks a process to clean up and exit. SIGKILL forces it dead immediately. Always try SIGTERM first — it lets the process save state. SIGKILL is the last resort.
- [x] **Quiz** — 4 debugging scenarios: "User reports X, where do you look?"

### Connections
- **Previous module:** "Three Screens, One Brain" — showed the happy path; now we cover the unhappy path
- **Next module:** None (this is the final module). End with a summary of all the patterns learned.
- **Tone:** Teal accent. Module background: var(--color-bg-warm) (odd module).
