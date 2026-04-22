import { spawn } from "node:child_process";
import { nanoid } from "nanoid";
import { SESSION_PREFIX } from "@claudeforge/shared";
/**
 * Claude Code provider — spawns `claude` CLI in tmux sessions.
 * Uses --print mode with JSON output for structured streaming.
 */
export class ClaudeProvider {
    name = "claude";
    sessions = new Map();
    async *startSession(options) {
        const sessionId = options.sessionId ?? nanoid(12);
        const tmuxName = `${SESSION_PREFIX}${sessionId}`;
        // Create tmux session
        const tmuxCreate = spawn("tmux", ["new-session", "-d", "-s", tmuxName, "-c", options.directory], {
            stdio: "ignore",
        });
        await new Promise((resolve) => tmuxCreate.on("close", () => resolve()));
        // Build claude command args
        const args = ["--print", "--output-format", "stream-json", "--permission-mode", "bypassPermissions"];
        if (options.model) {
            args.push("--model", options.model);
        }
        if (options.sessionId) {
            args.push("--resume", options.sessionId);
        }
        if (options.systemPrompt) {
            args.push("--system-prompt", options.systemPrompt);
        }
        // Spawn claude in the tmux session
        const proc = spawn("tmux", ["send-keys", "-t", tmuxName, `claude ${args.join(" ")}`, "Enter"], {
            stdio: "ignore",
        });
        await new Promise((resolve) => proc.on("close", () => resolve()));
        // For --print mode, spawn directly and capture output
        const claudeProc = spawn("claude", args, {
            cwd: options.directory,
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env },
        });
        const session = { id: sessionId, process: claudeProc, tmuxName, directory: options.directory };
        this.sessions.set(sessionId, session);
        yield { type: "session_init", providerSessionId: sessionId };
        // Stream stdout (JSON lines)
        if (claudeProc.stdout) {
            let buffer = "";
            for await (const chunk of claudeProc.stdout) {
                buffer += chunk.toString();
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    try {
                        const event = JSON.parse(line);
                        const mapped = this.mapEvent(event, sessionId);
                        if (mapped)
                            yield mapped;
                    }
                    catch {
                        // Non-JSON output — treat as text
                        yield { type: "text", content: line };
                    }
                }
            }
            // Process remaining buffer
            if (buffer.trim()) {
                yield { type: "text", content: buffer.trim() };
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
        if (!session.providerSessionId) {
            yield { type: "error", message: `Session ${sessionId} has no provider session ID — first run may not have completed` };
            return;
        }
        // Kill the old process if still running
        if (session.process && session.process.exitCode === null) {
            session.process.kill("SIGTERM");
        }
        // Spawn a fresh claude --print --resume <providerSessionId> process
        const args = [
            "--print",
            "--output-format", "stream-json",
            "--permission-mode", "bypassPermissions",
            "--resume", session.providerSessionId,
        ];
        const proc = spawn("claude", args, {
            cwd: session.directory,
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env },
        });
        // Update session with new process
        session.process = proc;
        // Pipe the message via stdin then close
        if (proc.stdin) {
            proc.stdin.write(message);
            proc.stdin.end();
        }
        // Stream stdout (JSON lines)
        if (proc.stdout) {
            let buffer = "";
            for await (const chunk of proc.stdout) {
                buffer += chunk.toString();
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    try {
                        const event = JSON.parse(line);
                        const mapped = this.mapEvent(event, sessionId);
                        if (mapped)
                            yield mapped;
                    }
                    catch {
                        yield { type: "text", content: line };
                    }
                }
            }
            if (buffer.trim()) {
                yield { type: "text", content: buffer.trim() };
            }
        }
        yield { type: "done", sessionId };
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
        // Kill tmux session
        spawn("tmux", ["kill-session", "-t", session.tmuxName], { stdio: "ignore" });
        this.sessions.delete(sessionId);
    }
    isAlive(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.process?.exitCode === null ? true : false;
    }
    mapEvent(event, sessionId) {
        // Map Claude Code stream-json events to our ProviderEvent format
        switch (event.type) {
            case "assistant":
                if (event.message?.content) {
                    for (const block of event.message.content) {
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
            case "result": {
                // Capture provider session ID for --resume on subsequent messages
                if (event.session_id) {
                    const session = this.sessions.get(sessionId);
                    if (session) {
                        session.providerSessionId = event.session_id;
                    }
                }
                return {
                    type: "done",
                    sessionId,
                    cost: event.cost_usd,
                };
            }
            default:
                return null;
        }
    }
    mapToolCall(block) {
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
    classifyTool(name) {
        if (name.includes("read") || name === "View")
            return "read";
        if (name.includes("edit") || name === "Edit")
            return "edit";
        if (name.includes("write") || name === "Write" || name === "Create")
            return "write";
        if (name.includes("bash") || name === "Bash" || name === "Terminal")
            return "bash";
        if (name.includes("search") || name === "Search" || name === "Grep")
            return "search";
        return "generic";
    }
    toolTitle(name, input) {
        if (input?.file_path || input?.path) {
            return `${name}: ${input.file_path ?? input.path}`;
        }
        if (input?.command) {
            return `${name}: ${input.command.slice(0, 80)}`;
        }
        return name;
    }
}
//# sourceMappingURL=claude-provider.js.map