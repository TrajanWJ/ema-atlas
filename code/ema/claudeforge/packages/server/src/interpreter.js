/**
 * Message Interpreter — sits between Discord input and execution.
 *
 * Responsibilities:
 * 1. Classify intent (chat | shell | tool | meta | confirm)
 * 2. Safety gate (block/confirm dangerous patterns)
 * 3. Minimal prompt enhancement (project context, not bloat)
 * 4. Route to the right executor
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// ── Patterns ───────────────────────────────────────────────────────
/** Shell-like prefixes that signal "run this command" */
const SHELL_PREFIXES = [/^\$\s+/, /^>\s+/, /^!\s+/, /^run\s+/i, /^exec\s+/i, /^shell\s+/i];
/** Meta-commands for session management */
const META_PATTERNS = [
    [/^\/stop$/i, "stop"],
    [/^\/abort$/i, "abort"],
    [/^\/status$/i, "status"],
    [/^\/mode\s+(\w+)$/i, "mode"],
    [/^\/model\s+(.+)$/i, "model"],
    [/^\/verbose$/i, "verbose"],
    [/^\/compact$/i, "compact"],
    [/^\/clear$/i, "clear"],
    [/^\/resume$/i, "resume"],
    [/^\/attach$/i, "attach"],
    [/^\/cost$/i, "cost"],
    [/^\/context$/i, "context"],
];
/** Dangerous shell patterns that need confirmation or blocking */
const DANGER_PATTERNS = [
    // Blocks — never allow
    { pattern: /rm\s+-rf\s+\/(?!\w)/, level: "block", reason: "rm -rf / — absolute path root deletion" },
    { pattern: /mkfs\b/, level: "block", reason: "filesystem format command" },
    { pattern: /dd\s+.*of=\/dev\//, level: "block", reason: "dd to device — data destruction" },
    { pattern: /:(){ :\|:& };:/, level: "block", reason: "fork bomb" },
    { pattern: /curl.*\|\s*(ba)?sh/, level: "block", reason: "pipe-to-shell — download and execute" },
    { pattern: /wget.*\|\s*(ba)?sh/, level: "block", reason: "pipe-to-shell — download and execute" },
    { pattern: /eval\s+.*base64/, level: "block", reason: "obfuscated execution" },
    { pattern: /chmod\s+777\s+\//, level: "block", reason: "world-writable root path" },
    // Warns — need confirmation
    { pattern: /rm\s+-rf\b/, level: "warn", reason: "recursive force delete" },
    { pattern: /sudo\s+/, level: "warn", reason: "elevated privileges" },
    { pattern: /systemctl\s+(stop|restart|disable)\b/, level: "warn", reason: "service lifecycle change" },
    { pattern: /git\s+(push|force-push|reset\s+--hard)\b/, level: "warn", reason: "destructive git operation" },
    { pattern: /DROP\s+(TABLE|DATABASE)\b/i, level: "warn", reason: "database destruction" },
    { pattern: /npm\s+publish\b/, level: "warn", reason: "package publication" },
    { pattern: /docker\s+(rm|rmi|system\s+prune)\b/, level: "warn", reason: "container/image removal" },
    { pattern: /kill\s+-9\b/, level: "warn", reason: "force kill process" },
];
/** Tool invocation patterns */
const TOOL_PATTERNS = [
    [/^\/search\s+(.+)$/i, "search"],
    [/^\/grep\s+(.+)$/i, "grep"],
    [/^\/find\s+(.+)$/i, "find"],
    [/^\/cat\s+(.+)$/i, "cat"],
    [/^\/tree(?:\s+(.*))?$/i, "tree"],
    [/^\/diff(?:\s+(.*))?$/i, "diff"],
    [/^\/git\s+(.+)$/i, "git"],
    [/^\/ls(?:\s+(.*))?$/i, "ls"],
];
// ── Classifier ─────────────────────────────────────────────────────
export function classify(message, directory, projectName) {
    const trimmed = message.trim();
    // 1. Check meta commands first
    for (const [pattern, action] of META_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            return {
                kind: "meta",
                raw: trimmed,
                payload: action,
                target: match[1] ?? action,
                safety: { level: "safe" },
            };
        }
    }
    // 2. Check tool invocations
    for (const [pattern, tool] of TOOL_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            const cmd = buildToolCommand(tool, match[1] ?? "", directory);
            return {
                kind: "tool",
                raw: trimmed,
                payload: cmd,
                target: tool,
                safety: checkSafety(cmd),
            };
        }
    }
    // 3. Check shell commands
    for (const prefix of SHELL_PREFIXES) {
        const match = trimmed.match(prefix);
        if (match) {
            const cmd = trimmed.slice(match[0].length).trim();
            return {
                kind: "shell",
                raw: trimmed,
                payload: cmd,
                target: cmd.split(/\s+/)[0],
                safety: checkSafety(cmd),
            };
        }
    }
    // 4. Default: chat — enhance prompt and send to Claude
    const context = buildContext(directory, projectName);
    const enhanced = enhancePrompt(trimmed, context);
    return {
        kind: "chat",
        raw: trimmed,
        payload: enhanced,
        safety: { level: "safe" },
        context,
    };
}
// ── Safety Gate ────────────────────────────────────────────────────
export function checkSafety(command) {
    for (const { pattern, level, reason } of DANGER_PATTERNS) {
        if (pattern.test(command)) {
            if (level === "block") {
                return { level: "block", reason: `🛑 Blocked: ${reason}` };
            }
            return {
                level: "warn",
                reason,
                confirmPrompt: `⚠️ **${reason}**\n\`\`\`\n${command}\n\`\`\`\nReact ✅ to confirm or ❌ to cancel.`,
            };
        }
    }
    return { level: "safe" };
}
// ── Context Builder ────────────────────────────────────────────────
export function buildContext(directory, projectName) {
    const ctx = { projectName, directory };
    try {
        // Git branch
        ctx.gitBranch = execSync("git rev-parse --abbrev-ref HEAD 2>/dev/null", {
            cwd: directory,
            encoding: "utf-8",
            timeout: 3000,
        }).trim() || undefined;
    }
    catch { /* not a git repo */ }
    try {
        // Recent files (last 5 modified, excluding node_modules/.git)
        const recent = execSync(`find . -maxdepth 3 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' -printf '%T@ %p\\n' 2>/dev/null | sort -rn | head -5 | awk '{print $2}'`, { cwd: directory, encoding: "utf-8", timeout: 5000 }).trim();
        if (recent) {
            ctx.recentFiles = recent.split("\n").map((f) => f.replace("./", ""));
        }
    }
    catch { /* ignore */ }
    try {
        // Tech stack detection
        const stack = [];
        const has = (f) => existsSync(join(directory, f));
        if (has("package.json")) {
            stack.push("Node.js");
            const pkg = JSON.parse(readFileSync(join(directory, "package.json"), "utf-8"));
            if (pkg.dependencies?.react || pkg.dependencies?.["react-dom"])
                stack.push("React");
            if (pkg.dependencies?.next)
                stack.push("Next.js");
            if (pkg.dependencies?.express)
                stack.push("Express");
            if (pkg.dependencies?.vue)
                stack.push("Vue");
            if (pkg.dependencies?.svelte || pkg.dependencies?.["@sveltejs/kit"])
                stack.push("SvelteKit");
            if (pkg.devDependencies?.typescript || has("tsconfig.json"))
                stack.push("TypeScript");
            if (pkg.devDependencies?.tailwindcss || has("tailwind.config.js") || has("tailwind.config.ts"))
                stack.push("Tailwind");
        }
        if (has("requirements.txt") || has("pyproject.toml") || has("setup.py"))
            stack.push("Python");
        if (has("Cargo.toml"))
            stack.push("Rust");
        if (has("go.mod"))
            stack.push("Go");
        if (has("Dockerfile") || has("docker-compose.yml"))
            stack.push("Docker");
        if (has(".env") || has(".env.local"))
            stack.push("env-config");
        if (stack.length)
            ctx.techStack = stack;
    }
    catch { /* ignore */ }
    try {
        // CLAUDE.md first 500 chars
        const claudeMdPath = join(directory, "CLAUDE.md");
        if (existsSync(claudeMdPath)) {
            ctx.claudeMd = readFileSync(claudeMdPath, "utf-8").slice(0, 500);
        }
    }
    catch { /* ignore */ }
    return ctx;
}
// ── Prompt Enhancement ─────────────────────────────────────────────
/**
 * Minimally enhance the user's message with project context.
 * Rules:
 * - Don't bloat. Keep additions under ~200 tokens.
 * - Only add what Claude Code wouldn't know from the filesystem.
 * - Never rewrite the user's intent.
 * - First message in a session gets more context; subsequent messages get less.
 */
export function enhancePrompt(message, context) {
    // If the message is already specific and detailed, don't touch it
    if (message.length > 200)
        return message;
    // Build a compact context header
    const parts = [];
    if (context.gitBranch && context.gitBranch !== "main" && context.gitBranch !== "master") {
        parts.push(`branch: ${context.gitBranch}`);
    }
    if (context.techStack?.length) {
        parts.push(`stack: ${context.techStack.join(", ")}`);
    }
    if (context.recentFiles?.length) {
        parts.push(`recent: ${context.recentFiles.slice(0, 3).join(", ")}`);
    }
    // Only prepend context if we have something useful and the message is short/vague
    if (parts.length === 0)
        return message;
    // For very short messages ("fix it", "what's wrong", "help"), add more context
    if (message.length < 50) {
        return `[${parts.join(" | ")}]\n\n${message}`;
    }
    return message;
}
// ── Tool Executor ──────────────────────────────────────────────────
function buildToolCommand(tool, args, directory) {
    switch (tool) {
        case "search":
            return `grep -rn --include='*.{ts,tsx,js,jsx,py,rs,go,md}' ${shellEscape(args)} .`;
        case "grep":
            return `grep -rn ${shellEscape(args)} .`;
        case "find":
            return `find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -name ${shellEscape(args)}`;
        case "cat":
            return `cat ${shellEscape(args)}`;
        case "tree":
            return `tree -L 3 -I 'node_modules|.git|dist|.next|__pycache__' ${args || "."}`;
        case "diff":
            return args ? `git diff ${shellEscape(args)}` : "git diff --stat";
        case "git":
            // Only allow read-only git commands directly
            const readOnly = ["status", "log", "diff", "branch", "show", "blame", "stash list"];
            const gitCmd = args.split(/\s+/)[0];
            if (readOnly.some((r) => r.startsWith(gitCmd))) {
                return `git ${args}`;
            }
            // Write git ops go through Claude
            return `echo "Use Claude for git write operations: git ${args}"`;
        case "ls":
            return `ls -la ${args || "."}`;
        default:
            return `echo "Unknown tool: ${tool}"`;
    }
}
function shellEscape(s) {
    // Basic shell escape — wrap in single quotes, escape existing quotes
    return `'${s.replace(/'/g, "'\\''")}'`;
}
export function executeShell(command, directory, timeoutMs = 30_000) {
    const MAX_OUTPUT = 4000; // Discord-friendly limit
    try {
        const stdout = execSync(command, {
            cwd: directory,
            encoding: "utf-8",
            timeout: timeoutMs,
            maxBuffer: 1024 * 1024,
            env: { ...process.env, TERM: "dumb", NO_COLOR: "1" },
        });
        const truncated = stdout.length > MAX_OUTPUT;
        return {
            stdout: truncated ? stdout.slice(0, MAX_OUTPUT) + "\n... (truncated)" : stdout,
            stderr: "",
            exitCode: 0,
            truncated,
        };
    }
    catch (err) {
        const stdout = (err.stdout ?? "").slice(0, MAX_OUTPUT);
        const stderr = (err.stderr ?? err.message ?? "").slice(0, MAX_OUTPUT);
        return {
            stdout,
            stderr,
            exitCode: err.status ?? 1,
            truncated: false,
        };
    }
}
//# sourceMappingURL=interpreter.js.map