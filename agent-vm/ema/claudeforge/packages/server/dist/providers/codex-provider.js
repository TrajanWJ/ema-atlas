import { spawn } from "node:child_process";
import { nanoid } from "nanoid";
import { SESSION_PREFIX } from "@claudeforge/shared";
/**
 * Codex provider — spawns `codex` CLI in tmux sessions.
 * Uses exec mode for non-interactive use.
 */
export class CodexProvider {
    name = "codex";
    sessions = new Map();
    async *startSession(options) {
        const sessionId = options.sessionId ?? nanoid(12);
        const tmuxName = `${SESSION_PREFIX}codex-${sessionId}`;
        // Create tmux session
        const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", options.directory], {
            stdio: "ignore",
        });
        await new Promise((resolve) => tmuxCreate.on("close", () => resolve()));
        const args = ["exec", "--yolo"];
        if (options.model) {
            args.push("--model", options.model);
        }
        const codexProc = spawn("codex", args, {
            cwd: options.directory,
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env },
        });
        const session = { id: sessionId, process: codexProc, tmuxName, directory: options.directory };
        this.sessions.set(sessionId, session);
        yield { type: "session_init", providerSessionId: sessionId };
        if (codexProc.stdout) {
            for await (const chunk of codexProc.stdout) {
                yield { type: "text", content: chunk.toString() };
            }
        }
        yield { type: "done", sessionId };
    }
    async *sendMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            yield { type: "error", message: `Session ${sessionId} not found` };
            return;
        }
        if (session.process.stdin?.writable) {
            session.process.stdin.write(message + "\n");
        }
    }
    abort(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session?.process) {
            session.process.kill("SIGINT");
        }
    }
    kill(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.process.kill("SIGTERM");
        spawn("tmux", ["kill-session", "-t", session.tmuxName], { stdio: "ignore" });
        this.sessions.delete(sessionId);
    }
    isAlive(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.process?.exitCode === null ? true : false;
    }
}
//# sourceMappingURL=codex-provider.js.map