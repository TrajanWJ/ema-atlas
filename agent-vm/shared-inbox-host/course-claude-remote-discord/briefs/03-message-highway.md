# Module 3: The Message Highway

### Teaching Arc
- **Metaphor:** Airport security checkpoint — your message goes through three layers of inspection (Interpreter classifies it, Router decides where it goes, Executor handles it), just like luggage goes through X-ray, then manual check, then gets loaded onto the right plane
- **Opening hook:** When you type "fix the auth bug" in a Discord channel, how does ClaudeForge know you want to talk to an AI agent and not run a shell command?
- **Key insight:** A 3-layer classification system (Interpreter -> Router -> Executor) ensures messages go to the right place with the right context
- **"Why should I care?":** Understanding message routing helps you debug "why didn't my message reach the agent?" and helps you design similar multi-input systems

### Screens
1. **The 3-layer pipeline** — Flow diagram: Interpreter -> Router -> Executor
2. **Layer 1: The Interpreter** — Classifies intent (chat/shell/tool/meta/confirm)
3. **Layer 2: The Intent Router** — Smart routing with fuzzy matching
4. **Layer 3: The Executor** — Who actually handles it
5. **The safety gate** — Block, warn, safe levels
6. **Quiz** — 4 scenario questions

### Code Snippets (pre-extracted)

Snippet 1 — IntentRouter.route method (packages/bot/src/intent-router.ts lines 87-155):
```typescript
route(
    classified: ClassifiedIntent,
    channelId: string,
    categoryId: string | null,
    isProjectChannel: boolean,
  ): RouteResult {
    // 1. Shell and meta pass through directly
    if (classified.kind === "shell" || classified.kind === "tool") {
      return { kind: "shell", classified };
    }
    if (classified.kind === "meta") {
      return { kind: "meta", classified };
    }

    // 2. Check for system-level queries (even in project channels)
    const systemIntent = this.detectSystemIntent(classified.raw);
    if (systemIntent) {
      return { kind: "system", intent: systemIntent, classified };
    }

    // 3. Check for explicit session references
    const sessionRef = this.resolveSessionReference(classified.raw);
    if (sessionRef) {
      if (sessionRef.sessionId) {
        return { kind: "session", sessionId: sessionRef.sessionId, classified };
      }
      if (sessionRef.suggestions.length > 0) {
        return {
          kind: "concierge",
          classified,
          suggestions: sessionRef.suggestions,
          fallbackMessage: `No session found matching "${sessionRef.query}". Did you mean one of these?`,
        };
      }
    }

    // 4. Project channel → route to session (auto-create if needed)
    if (isProjectChannel && categoryId) {
      const project = this.projects.getByCategory(categoryId);
      if (project) {
        const session = this.sessions.getByChannel(channelId);
        if (session) {
          return { kind: "session", sessionId: session.id, classified };
        }
        return {
          kind: "session",
          projectId: project.id,
          classified,
          autoCreate: true,
        };
      }
    }

    // 5. Non-project channel — check for path mentions
    const detectedPath = this.detectPath(classified.raw);
    if (detectedPath) {
      return {
        kind: "concierge",
        classified,
        detectedPath,
        fallbackMessage: `Detected directory path: \`${detectedPath}\`. Use \`/open ${detectedPath}\` to open it as a project.`,
      };
    }

    // 6. Non-project channel with no special routing → concierge (global chat)
    return { kind: "concierge", classified };
  }
```

Snippet 2 — Intent types (packages/shared/src/types.ts lines 222-247):
```typescript
export type IntentKind = "chat" | "shell" | "tool" | "meta" | "confirm";

export interface ClassifiedIntent {
  kind: IntentKind;
  raw: string;
  payload: string;
  target?: string;
  safety: SafetyResult;
  context?: PromptContext;
}

export interface SafetyResult {
  level: "safe" | "warn" | "block";
  reason?: string;
  confirmPrompt?: string;
}
```

Snippet 3 — System intent detection patterns (packages/bot/src/intent-router.ts lines 44-55):
```typescript
const SYSTEM_PATTERNS: Array<{ pattern: RegExp; intent: SystemIntent }> = [
  { pattern: /\b(list|show|all)\s+(sessions?|running)\b/i, intent: "list-sessions" },
  { pattern: /\bwhat('?s| is)\s+(running|active)\b/i, intent: "list-sessions" },
  { pattern: /\b(list|show|all)\s+projects?\b/i, intent: "list-projects" },
  { pattern: /\b(list|show|all)\s+tasks?\b/i, intent: "list-tasks" },
  { pattern: /\b(show|what('?s| is))\s+(the\s+)?(cost|spend|usage|bill)\b/i, intent: "show-cost" },
  { pattern: /\bhow\s+much\s+(have\s+)?(i\s+)?(spent|cost)\b/i, intent: "show-cost" },
  { pattern: /\b(system\s+)?status\b/i, intent: "system-status" },
  { pattern: /\bhealth\s*check\b/i, intent: "show-health" },
  { pattern: /\b(system\s+)?health\b/i, intent: "show-health" },
  { pattern: /\bhelp\b/i, intent: "show-help" },
];
```

Snippet 4 — Fuzzy matching (packages/bot/src/intent-router.ts lines 222-249):
```typescript
private similarityScore(query: string, target: string): number {
    if (query === target) return 1;
    if (target.includes(query)) return 0.8;
    if (query.length < 3) return 0;

    const words = target.split(/[-_\s]+/);
    for (const word of words) {
      if (word.startsWith(query)) return 0.7;
    }

    // Character-level overlap (Dice coefficient)
    const bigrams = (s: string): Set<string> => {
      const set = new Set<string>();
      for (let i = 0; i < s.length - 1; i++) {
        set.add(s.slice(i, i + 2));
      }
      return set;
    };

    const qBigrams = bigrams(query);
    const tBigrams = bigrams(target);
    let intersection = 0;
    for (const b of qBigrams) {
      if (tBigrams.has(b)) intersection++;
    }

    return (2 * intersection) / (qBigrams.size + tBigrams.size);
  }
```

### Interactive Elements

- [x] **Data flow animation** — actors: Message, Interpreter, Router, Executor. Steps: message arrives -> classified as chat/shell/meta -> router checks system patterns -> checks session references -> routes to session/concierge/shell
- [x] **Code-English translation** — Snippet 1 (router.route) and Snippet 2 (intent types)
- [x] **Pattern cards** — 5 intent kinds (chat, shell, tool, meta, confirm) with icons and descriptions
- [x] **Callout** — "Aha!" about separation of concerns: classification vs routing vs execution
- [x] **Quiz** — 4 scenario questions: "User types X — what intent kind? Where does it route?"

### Connections
- **Previous module:** "Meet the Cast" — introduced the packages; now we zoom into the bot package
- **Next module:** "The Claude Whisperer" — what happens after the message is routed to a session
- **Tone:** Teal accent. Module background: var(--color-bg) (even module).
