import { spawn, type ChildProcess } from "node:child_process";
import { nanoid } from "nanoid";
import type { ProviderEvent, ToolCall, ToolCallKind } from "@claudeforge/shared";
import { SESSION_PREFIX } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";

/** Provider-level defaults from env vars */
const DEFAULT_MODEL = process.env.CLAUDE_MODEL ?? undefined;
const DEFAULT_MAX_TURNS = process.env.CLAUDE_MAX_TOKENS ? parseInt(process.env.CLAUDE_MAX_TOKENS, 10) : undefined;
const DEFAULT_PERMISSION_MODE = process.env.CLAUDE_PERMISSION_MODE ?? "bypassPermissions";

interface ClaudeSession {
  id: string;
  process: ChildProcess | null;
  tmuxName: string;
  directory: string;
  providerSessionId?: string;
  model?: string;
  mode?: string;
  _retryNeeded?: boolean;
}

/**
 * Claude Code provider — spawns `claude` CLI in tmux sessions.
 * Uses --print mode with JSON output for structured streaming.
 *
 * Session lifecycle:
 *   startSession() — creates tmux session + metadata (lazy, no Claude spawn)
 *   sendMessage()  — spawns `claude --print` with message on stdin
 *                     First call: fresh session. Subsequent: --resume <id>.
 */
export class ClaudeProvider implements AgentProvider {
  readonly name = "claude";
  private sessions = new Map<string, ClaudeSession>();

  async *startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent> {
    const sessionId = options.sessionId ?? nanoid(12);
    const tmuxName = `${SESSION_PREFIX}${sessionId}`;

    // Create tmux session (useful for manual attach / debugging)
    const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", options.directory], {
      stdio: "ignore",
    });
    await new Promise<void>((resolve) => tmuxCreate.on("close", () => resolve()));

    // Store session metadata — lazy init, no Claude spawn yet
    // providerSessionId starts as undefined; set after first Claude response
    const session: ClaudeSession = {
      id: sessionId,
      process: null,
      tmuxName,
      directory: options.directory,
      providerSessionId: undefined,
      model: options.model,
      mode: options.mode,
    };
    this.sessions.set(sessionId, session);

    yield { type: "session_init", providerSessionId: sessionId };
    yield { type: "done", sessionId };
  }

  async *sendMessage(sessionId: string, message: string, dbRecord?: any, context?: string): AsyncGenerator<ProviderEvent> {
    let session = this.sessions.get(sessionId);

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

    if (!session) {
      yield { type: "error", message: `Session ${sessionId} not found` };
      return;
    }

    if (session.process && session.process.exitCode === null) {
      session.process.kill("SIGTERM");
    }

    const args = [
      "--print",
      "--verbose",
      "--output-format", "stream-json",
      "--permission-mode", DEFAULT_PERMISSION_MODE,
    ];

    const model = session.model ?? DEFAULT_MODEL;
    if (model) {
      args.push("--model", model);
    }

    if (DEFAULT_MAX_TURNS) {
      args.push("--max-turns", String(DEFAULT_MAX_TURNS));
    }

    if (session.providerSessionId) {
      args.push("--resume", session.providerSessionId);
    }

    const proc = spawn("claude", args, {
      cwd: session.directory,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    session.process = proc;

    const TIMEOUT_MS = 5 * 60 * 1000;
    let timedOut = false;
    const processTimeout = setTimeout(() => {
      timedOut = true;
      console.error(`[claude-provider] Timeout for ${sessionId}, killing process`);
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (proc.exitCode === null) proc.kill("SIGKILL");
      }, 5000);
    }, TIMEOUT_MS);

    const closePromise = new Promise<number | null>((resolve) => {
      proc.on("close", (code) => {
        clearTimeout(processTimeout);
        resolve(code);
      });
    });

    if (proc.stdin) {
      const input = context ? `${context}\n${message}` : message;
      proc.stdin.write(input);
      proc.stdin.end();
    }

    const cmdDisplay = `claude ${args.join(" ")}`;
    spawn("tmux", ["send-keys", "-t", session.tmuxName, `# ${cmdDisplay}`, "Enter"], {
      stdio: "ignore",
    });

    const stderrPromise = (async (): Promise<string> => {
      let stderrContent = "";
      if (proc.stderr) {
        for await (const chunk of proc.stderr) {
          stderrContent += chunk.toString();
        }
      }
      return stderrContent;
    })();

    let sawDone = false;
    let sawError = false;

    if (proc.stdout) {
      let buffer = "";
      for await (const chunk of proc.stdout) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          const mapped = this.parseStreamLine(line, sessionId);
          if (!mapped) continue;

          if (mapped.type === "error") sawError = true;
          if (mapped.type === "done") sawDone = true;
          yield mapped;
        }
      }

      const trailing = buffer.trim();
      if (trailing) {
        const mapped = this.parseStreamLine(trailing, sessionId);
        if (mapped) {
          if (mapped.type === "error") sawError = true;
          if (mapped.type === "done") sawDone = true;
          yield mapped;
        }
      }
    }

    const stderrContent = await stderrPromise;
    const exitCode = await closePromise;

    if (stderrContent.trim()) {
      console.error(`[claude-provider] stderr for ${sessionId}: ${stderrContent.slice(0, 500)}`);
    }

    if (session._retryNeeded) {
      delete session._retryNeeded;
      console.log(`[claude-provider] Retrying ${sessionId} without --resume`);
      yield* this.sendMessage(sessionId, message, undefined, context);
      return;
    }

    if (sawError) {
      return;
    }

    const processError = this.deriveProcessError(stderrContent, exitCode, timedOut);
    if (processError) {
      yield { type: "error", message: processError };
      return;
    }

    if (!sawDone) {
      yield { type: "done", sessionId };
    }
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
      const { execSync } = await import("node:child_process");
      execSync("which claude", { encoding: "utf-8", stdio: "pipe" });
      execSync("claude --version", { encoding: "utf-8", stdio: "pipe", timeout: 5000 }).trim();
      return { healthy: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "claude CLI not found";
      return { healthy: false, error: message };
    }
  }

  private parseStreamLine(line: string, sessionId: string): ProviderEvent | null {
    try {
      const event = JSON.parse(line);
      return this.mapEvent(event, sessionId);
    } catch {
      if (this.looksLikeInternalPayload(line)) {
        console.warn(`[claude-provider] Suppressing non-JSON internal stdout fragment for ${sessionId}: ${line.slice(0, 200)}`);
        return null;
      }

      console.warn(`[claude-provider] Suppressing unexpected non-JSON stdout for ${sessionId}: ${line.slice(0, 200)}`);
      return null;
    }
  }

  private looksLikeInternalPayload(line: string): boolean {
    return [
      '"request_id"',
      '"session_id"',
      '"result"',
      '"usage"',
      '"modelUsage"',
      '"permission_denials"',
      '"terminal_reason"',
      '"total_cost_usd"',
      '"duration_ms"',
      '"stop_reason"',
      '"type":"result"',
      '"type": "result"',
      'OAuth token has expired',
      'Failed to authenticate',
    ].some((needle) => line.includes(needle));
  }

  private deriveProcessError(stderrContent: string, exitCode: number | null, timedOut: boolean): string | null {
    if (timedOut) {
      return "Claude request timed out. Try a shorter or more focused prompt.";
    }

    const stderr = stderrContent.trim();
    if (stderr) {
      return this.sanitizeErrorMessage(stderr);
    }

    if (exitCode && exitCode !== 0) {
      return `Claude process exited with code ${exitCode}.`;
    }

    return null;
  }

  private sanitizeErrorMessage(raw: unknown): string {
    const source = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
    const text = source.replace(/\u001b\[[0-9;]*m/g, "").replace(/\s+/g, " ").trim();
    const extractedApiMessage = text.match(/\"message\"\s*:\s*\"([^\"]+)\"/)?.[1];

    if (/OAuth token has expired/i.test(text) || /Failed to authenticate/i.test(text)) {
      const detail = extractedApiMessage ?? "OAuth token has expired.";
      return `Claude authentication failed: ${detail} Refresh the token and try again.`;
    }

    if (/No conversation found/i.test(text) || /session ID/i.test(text)) {
      return "Claude session went stale. Retrying with a fresh session.";
    }

    if (/timed out|timeout/i.test(text)) {
      return "Claude request timed out. Try a shorter or more focused prompt.";
    }

    if (extractedApiMessage) {
      return extractedApiMessage;
    }

    return text.slice(0, 280) || "Claude request failed.";
  }

  private extractErrorMessage(event: any): string {
    const errors = Array.isArray(event.errors) ? event.errors.filter(Boolean).join("; ") : "";
    const candidates = [errors, event.error?.message, event.result, event.message];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return this.sanitizeErrorMessage(candidate);
      }
    }

    return "Claude request failed.";
  }

  private mapEvent(event: any, sessionId: string): ProviderEvent | null {
    switch (event.type) {
      case "assistant":
        if (event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "thinking") {
              return { type: "thinking", content: block.thinking } as ProviderEvent;
            }
            if (block.type === "text") {
              return { type: "text", content: block.text };
            }
            if (block.type === "tool_use") {
              const toolCall = this.mapToolCall(block);
              return {
                type: "tool_use",
                tool: block.name,
                input: JSON.stringify(block.input),
                toolCall,
              };
            }
          }
        }
        return null;

      case "tool":
      case "tool_result": {
        const toolCall = this.mapToolCall(event);
        return {
          type: "tool_result",
          tool: event.name ?? event.tool ?? "unknown",
          output: typeof event.output === "string" ? event.output : JSON.stringify(event.output ?? ""),
          toolCall,
          isError: event.is_error ?? false,
        };
      }

      case "system":
        return null;

      case "result": {
        if (event.is_error) {
          const errMsg = this.extractErrorMessage(event);
          const isStaleResume = errMsg.includes("stale") || errMsg.includes("fresh session");
          if (isStaleResume) {
            const session = this.sessions.get(sessionId);
            if (session) {
              console.log(`[claude-provider] Stale resume detected for ${sessionId}, will retry fresh`);
              session.providerSessionId = undefined;
              session._retryNeeded = true;
            }
            return null;
          }
          return { type: "error", message: errMsg };
        }

        let capturedSessionId: string | undefined;
        if (event.session_id) {
          const session = this.sessions.get(sessionId);
          if (session) {
            session.providerSessionId = event.session_id;
            capturedSessionId = event.session_id;
          }
        }
        return {
          type: "done",
          sessionId,
          cost: event.cost_usd,
          inputTokens: event.input_tokens,
          outputTokens: event.output_tokens,
          providerSessionId: capturedSessionId,
        } as ProviderEvent;
      }

      default:
        return null;
    }
  }

  private mapToolCall(block: any): ToolCall {
    const kind = this.classifyTool(block.name);
    return {
      id: block.id ?? nanoid(8),
      kind,
      tool: block.name,
      title: this.toolTitle(block.name, block.input),
      input: typeof block.input === "string" ? block.input : JSON.stringify(block.input),
      filePath: block.input?.file_path ?? block.input?.path,
    };
  }

  private classifyTool(name: string): ToolCallKind {
    if (name.includes("read") || name === "View") return "read";
    if (name.includes("edit") || name === "Edit") return "edit";
    if (name.includes("write") || name === "Write" || name === "Create") return "write";
    if (name.includes("bash") || name === "Bash" || name === "Terminal") return "bash";
    if (name.includes("search") || name === "Search" || name === "Grep") return "search";
    return "generic";
  }

  private toolTitle(name: string, input: any): string {
    if (input?.file_path || input?.path) {
      return `${name}: ${input.file_path ?? input.path}`;
    }
    if (input?.command) {
      return `${name}: ${input.command.slice(0, 80)}`;
    }
    return name;
  }
}
