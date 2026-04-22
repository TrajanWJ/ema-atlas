import { spawn, type ChildProcess } from "node:child_process";
import { nanoid } from "nanoid";
import type { ProviderEvent } from "@claudeforge/shared";
import { SESSION_PREFIX } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";

interface CodexSession {
  id: string;
  process: ChildProcess;
  tmuxName: string;
  directory: string;
}

/**
 * Codex provider — spawns `codex` CLI in tmux sessions.
 * Uses exec mode for non-interactive use.
 */
export class CodexProvider implements AgentProvider {
  readonly name = "codex";
  private sessions = new Map<string, CodexSession>();

  async *startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent> {
    const localSessionId = options.localSessionId ?? nanoid(12);
    const tmuxName = `${SESSION_PREFIX}codex-${localSessionId}`;

    const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", options.directory], {
      stdio: "ignore",
    });
    await new Promise<void>((resolve) => tmuxCreate.on("close", () => resolve()));

    const args = ["exec", "--yolo"];
    if (options.model) {
      args.push("--model", options.model);
    }

    const codexProc = spawn("codex", args, {
      cwd: options.directory,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    const session: CodexSession = { id: localSessionId, process: codexProc, tmuxName, directory: options.directory };
    this.sessions.set(localSessionId, session);

    yield { type: "session_init", providerSessionId: localSessionId };

    if (codexProc.stdout) {
      for await (const chunk of codexProc.stdout) {
        yield { type: "text", content: chunk.toString() };
      }
    }

    yield { type: "done", sessionId: localSessionId };
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<ProviderEvent> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      yield { type: "error", message: `Session ${sessionId} not found` };
      return;
    }

    if (session.process.stdin?.writable) {
      session.process.stdin.write(message + "\n");
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

    session.process.kill("SIGTERM");
    spawn("tmux", ["kill-session", "-t", session.tmuxName], { stdio: "ignore" });
    this.sessions.delete(sessionId);
  }

  isAlive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.process?.exitCode === null ? true : false;
  }
}
