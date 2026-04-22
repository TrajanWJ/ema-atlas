import { spawn, execSync, type ChildProcess } from "node:child_process";
import { nanoid } from "nanoid";
import type { ProviderEvent, ToolCall, ToolCallKind } from "@claudeforge/shared";
import { SESSION_PREFIX } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";

/** Provider-level defaults from env vars */
const CODEX_MODEL = process.env.CODEX_MODEL ?? undefined;
const CODEX_APPROVAL_MODE = process.env.CODEX_APPROVAL_MODE ?? "full-auto";

interface CodexSession {
  id: string;
  process: ChildProcess | null;
  tmuxName: string;
  directory: string;
  model?: string;
}

/**
 * Codex provider — spawns `codex exec` CLI for non-interactive use.
 * Uses --json for JSONL streaming output and --full-auto for auto-approval.
 *
 * Session lifecycle:
 *   startSession() — creates tmux session + metadata (lazy, no Codex spawn)
 *   sendMessage()  — spawns `codex exec --json --full-auto` with prompt
 *   Each message is a fresh `codex exec` invocation (Codex has no --resume equivalent).
 */
export class CodexProvider implements AgentProvider {
  readonly name = "codex";
  private sessions = new Map<string, CodexSession>();

  /** Check if codex CLI is available on the host */
  static isInstalled(): boolean {
    try {
      execSync("which codex", { encoding: "utf-8", stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  async *startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent> {
    if (!CodexProvider.isInstalled()) {
      yield { type: "error", message: "Codex CLI not installed. Install with: npm install -g @openai/codex" };
      return;
    }

    const sessionId = options.sessionId ?? nanoid(12);
    const tmuxName = `${SESSION_PREFIX}codex-${sessionId}`;

    // Create tmux session for manual attach / debugging
    const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", options.directory], {
      stdio: "ignore",
    });
    await new Promise<void>((resolve) => tmuxCreate.on("close", () => resolve()));

    const session: CodexSession = {
      id: sessionId,
      process: null,
      tmuxName,
      directory: options.directory,
      model: options.model,
    };
    this.sessions.set(sessionId, session);

    yield { type: "session_init", providerSessionId: sessionId };
    yield { type: "done", sessionId };
  }

  async *sendMessage(sessionId: string, message: string, dbRecord?: unknown, context?: string): AsyncGenerator<ProviderEvent> {
    let session = this.sessions.get(sessionId);

    // Lazy-reconstruct session from DB record after server restart
    if (!session && dbRecord) {
      const rec = dbRecord as { directory: string; model?: string };
      const tmuxName = `${SESSION_PREFIX}codex-${sessionId}`;
      const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", rec.directory], {
        stdio: "ignore",
      });
      await new Promise<void>((resolve) => tmuxCreate.on("close", () => resolve()));

      session = {
        id: sessionId,
        process: null,
        tmuxName,
        directory: rec.directory,
        model: rec.model ?? undefined,
      };
      this.sessions.set(sessionId, session);
      console.log(`[codex-provider] Reconstructed session ${sessionId} from DB`);
    }

    if (!session) {
      yield { type: "error", message: `Session ${sessionId} not found` };
      return;
    }

    if (!CodexProvider.isInstalled()) {
      yield { type: "error", message: "Codex CLI not installed. Install with: npm install -g @openai/codex" };
      return;
    }

    // Kill old process if still running
    if (session.process && session.process.exitCode === null) {
      session.process.kill("SIGTERM");
    }

    // Build the prompt (with optional context prefix)
    const prompt = context ? `${context}\n${message}` : message;

    // Build args for codex exec
    const args = [
      "exec",
      "--json",                            // JSONL output
      `--${CODEX_APPROVAL_MODE}`,          // Approval mode from env
      "-C", session.directory,             // Working directory
    ];

    const model = session.model ?? CODEX_MODEL;
    if (model) {
      args.push("-m", model);
    }

    // Prompt as positional argument
    args.push(prompt);

    const proc = spawn("codex", args, {
      cwd: session.directory,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    session.process = proc;

    // Hard timeout: kill process after 5 minutes
    const TIMEOUT_MS = 5 * 60 * 1000;
    const processTimeout = setTimeout(() => {
      console.error(`[codex-provider] Timeout for ${sessionId}, killing process`);
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (proc.exitCode === null) proc.kill("SIGKILL");
      }, 5000);
    }, TIMEOUT_MS);

    proc.on("close", () => clearTimeout(processTimeout));

    // Close stdin — prompt is passed as argument
    if (proc.stdin) {
      proc.stdin.end();
    }

    // Echo the command to tmux for visibility
    const cmdDisplay = `codex ${args.join(" ").slice(0, 200)}`;
    spawn("tmux", ["send-keys", "-t", session.tmuxName, `# ${cmdDisplay}`, "Enter"], {
      stdio: "ignore",
    });

    // Stream stdout (JSONL events)
    if (proc.stdout) {
      let buffer = "";
      for await (const chunk of proc.stdout) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            const mapped = this.mapEvent(event, sessionId);
            if (mapped) yield mapped;
          } catch {
            // Non-JSON output — treat as text
            yield { type: "text", content: line };
          }
        }
      }
      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim());
          const mapped = this.mapEvent(event, sessionId);
          if (mapped) yield mapped;
        } catch {
          yield { type: "text", content: buffer.trim() };
        }
      }
    }

    // Check for stderr
    let stderrContent = "";
    if (proc.stderr) {
      for await (const chunk of proc.stderr) {
        stderrContent += chunk.toString();
      }
    }
    if (stderrContent.trim()) {
      console.error(`[codex-provider] stderr for ${sessionId}: ${stderrContent.slice(0, 500)}`);
    }

    yield { type: "done", sessionId };
  }

  abort(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session?.process) {
      session.process.kill("SIGINT");
    }
  }

  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.process) {
      session.process.kill("SIGTERM");
    }
    spawn("tmux", ["kill-session", "-t", session.tmuxName], { stdio: "ignore" });
    this.sessions.delete(sessionId);
  }

  isAlive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.process?.exitCode === null ? true : false;
  }

  async isHealthy(): Promise<{ healthy: boolean; error?: string }> {
    try {
      execSync("which codex", { encoding: "utf-8", stdio: "pipe" });
      return { healthy: true };
    } catch {
      return { healthy: false, error: "codex CLI not installed" };
    }
  }

  /**
   * Map Codex JSONL events to ProviderEvent format.
   * Codex --json emits events like:
   *   { type: "message", message: { role: "assistant", content: [...] } }
   *   { type: "function_call", name: "shell", arguments: "..." }
   *   { type: "function_call_output", output: "..." }
   */
  private mapEvent(event: Record<string, unknown>, _sessionId: string): ProviderEvent | null {
    const eventType = event.type as string | undefined;

    switch (eventType) {
      case "message": {
        const msg = event.message as { role?: string; content?: unknown } | undefined;
        if (!msg?.content) return null;

        if (typeof msg.content === "string") {
          return { type: "text", content: msg.content };
        }

        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (typeof block === "string") {
              return { type: "text", content: block };
            }
            if (block.type === "text") {
              return { type: "text", content: block.text };
            }
            if (block.type === "tool_use" || block.type === "function_call") {
              const toolCall = this.mapToolCall(block);
              return {
                type: "tool_use",
                tool: block.name ?? "codex_tool",
                input: JSON.stringify(block.input ?? block.arguments ?? ""),
                toolCall,
              };
            }
          }
        }
        return null;
      }

      case "function_call": {
        const name = (event.name as string) ?? "shell";
        const input = (event.arguments as string) ?? "";
        const toolCall = this.mapToolCall({ name, input });
        return { type: "tool_use", tool: name, input, toolCall };
      }

      case "function_call_output": {
        const output = typeof event.output === "string" ? event.output : JSON.stringify(event.output ?? "");
        const name = (event.name as string) ?? "shell";
        const toolCall = this.mapToolCall({ name, output });
        return { type: "tool_result", tool: name, output, toolCall, isError: Boolean(event.is_error) };
      }

      case "error":
        return { type: "error", message: (event.message as string) ?? "Codex error" };

      default:
        // Unknown event types — if there's text content, emit it
        if (event.content && typeof event.content === "string") {
          return { type: "text", content: event.content };
        }
        return null;
    }
  }

  private mapToolCall(block: Record<string, unknown>): ToolCall {
    const name = (block.name as string) ?? "codex_tool";
    const kind = this.classifyTool(name);
    const input = block.input ?? block.arguments ?? block.output ?? "";
    return {
      id: nanoid(8),
      kind,
      tool: name,
      title: this.toolTitle(name, input),
      input: typeof input === "string" ? input : JSON.stringify(input),
    };
  }

  private classifyTool(name: string): ToolCallKind {
    if (name === "shell" || name.includes("bash") || name.includes("exec")) return "bash";
    if (name.includes("read") || name.includes("file_read")) return "read";
    if (name.includes("edit") || name.includes("file_edit") || name.includes("apply")) return "edit";
    if (name.includes("write") || name.includes("file_write")) return "write";
    if (name.includes("search") || name.includes("grep")) return "search";
    return "generic";
  }

  private toolTitle(name: string, input: unknown): string {
    if (typeof input === "string" && input.length > 0) {
      return `${name}: ${input.slice(0, 80)}`;
    }
    if (input && typeof input === "object") {
      const obj = input as Record<string, unknown>;
      if (obj.command) return `${name}: ${String(obj.command).slice(0, 80)}`;
      if (obj.file_path ?? obj.path) return `${name}: ${String(obj.file_path ?? obj.path)}`;
    }
    return name;
  }
}
