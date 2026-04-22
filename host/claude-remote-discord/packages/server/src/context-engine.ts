import { execFile } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { homedir } from "node:os";
import type { Persistence } from "./persistence.js";
import type { SessionRecord } from "@claudeforge/shared";

const MAX_CONTEXT_SIZE = 8000;
const MAX_DOC_SIZE = 5000;
const MAX_HISTORY_RESPONSE = 500;
const MAX_FILE_CONTENT = 3000;
const MAX_REFERENCED_FILES = 5;
const HISTORY_LIMIT = 10;
const GIT_TIMEOUT_MS = 3000;

/** Project doc files in priority order */
const PROJECT_DOC_FILES = ["CLAUDE.md", "AGENTS.md", ".cursorrules", "README.md"];

/** Path patterns that indicate a file reference in messages */
const FILE_PATH_PATTERN = /(?:^|\s)((?:src|packages|lib|app|components|hooks|stores|utils|server|bot|web|shared|public|pages|api|routes|middleware|models|services|config|db|test|tests|__tests__|spec)\/[\w/.-]+\.\w+)/g;

/** Known manifest files → tech stack labels */
const STACK_DETECTORS: Array<{ file: string; detect: (content: string) => string[] }> = [
  {
    file: "package.json",
    detect: (content) => {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const stack: string[] = ["Node.js"];
        if (deps["react"] || deps["next"]) stack.push("React");
        if (deps["next"]) stack.push("Next.js");
        if (deps["vue"]) stack.push("Vue");
        if (deps["svelte"] || deps["@sveltejs/kit"]) stack.push("Svelte");
        if (deps["express"]) stack.push("Express");
        if (deps["typescript"] || deps["tsx"]) stack.push("TypeScript");
        if (deps["tailwindcss"]) stack.push("Tailwind");
        if (deps["prisma"] || deps["@prisma/client"]) stack.push("Prisma");
        if (deps["drizzle-orm"]) stack.push("Drizzle");
        if (deps["better-sqlite3"]) stack.push("SQLite");
        return stack;
      } catch {
        return ["Node.js"];
      }
    },
  },
  { file: "requirements.txt", detect: () => ["Python"] },
  { file: "pyproject.toml", detect: () => ["Python"] },
  { file: "go.mod", detect: () => ["Go"] },
  { file: "Cargo.toml", detect: () => ["Rust"] },
  { file: "Gemfile", detect: () => ["Ruby"] },
  { file: "pom.xml", detect: () => ["Java"] },
  { file: "build.gradle", detect: () => ["Java/Kotlin"] },
];

export class ContextEngine {
  private preferencesCache: string | null = null;
  private preferencesCacheLoaded = false;

  constructor(private db: Persistence) {}

  /** Build full context string to prepend to Claude's input */
  async buildSessionContext(session: SessionRecord, userMessage: string): Promise<string> {
    const dir = session.directory;
    const projectName = session.projectName || basename(dir);

    const parts: string[] = [];

    // 1. Project docs (CLAUDE.md, AGENTS.md, .cursorrules, README.md)
    const docs = this.readProjectDocs(dir);
    if (docs) parts.push(`[PROJECT DOCS]\n${docs}\n[/PROJECT DOCS]`);

    // 2. Tech stack
    const stack = this.detectStack(dir);

    // 3. Git state
    const git = await this.readGitState(dir);

    // 4. Build project info header
    let info = `Project: ${projectName} at ${dir}`;
    if (stack.length > 0) info += `\nStack: ${stack.join(", ")}`;
    if (git) {
      info += `\nGit: branch=${git.branch} | ${git.uncommitted} uncommitted`;
      if (git.dirtyFiles.length > 0) {
        info += `\nDirty: ${git.dirtyFiles.slice(0, 10).join(", ")}`;
      }
      if (git.commits.length > 0) {
        info += `\nRecent commits:\n${git.commits.map((c) => `  ${c}`).join("\n")}`;
      }
    }
    parts.unshift(`[PROJECT]\n${info}\n[/PROJECT]`);

    // 5. System prompt (if session has one)
    const sysPrompt = session.systemPrompt ?? session.agentPersona;
    if (sysPrompt) {
      parts.push(`[SYSTEM PROMPT]\n${sysPrompt}\n[/SYSTEM PROMPT]`);
    }

    // 6. Conversation history
    const history = this.readHistory(session.id);
    if (history.length > 0) {
      const historyLines = history.map((msg) => {
        const label = msg.role === "user" ? "User" : "Assistant";
        const content =
          msg.content.length > MAX_HISTORY_RESPONSE
            ? msg.content.slice(0, MAX_HISTORY_RESPONSE) + "..."
            : msg.content;
        return `${label}: ${content}`;
      });
      parts.push(`[CONVERSATION HISTORY]\n${historyLines.join("\n\n")}\n[/CONVERSATION HISTORY]`);
    }

    // 7. Referenced files from recent messages
    const allMessages = [...history.map((h) => h.content), userMessage];
    const referencedFiles = this.extractReferencedFiles(allMessages, dir);
    if (referencedFiles.length > 0) {
      const fileBlocks = referencedFiles.map(
        (f) => `--- ${f.path} ---\n${f.content}`
      );
      parts.push(`[REFERENCED FILES]\n${fileBlocks.join("\n\n")}\n[/REFERENCED FILES]`);
    }

    // 8. User preferences
    const prefs = this.readPreferences();
    if (prefs) {
      parts.push(`[USER PREFERENCES]\n${prefs}\n[/USER PREFERENCES]`);
    }

    // Combine and enforce total size limit
    let full = parts.join("\n\n") + "\n\n" + userMessage;

    if (full.length > MAX_CONTEXT_SIZE) {
      // Drop sections from the end (referenced files, then history, then docs)
      while (parts.length > 1 && full.length > MAX_CONTEXT_SIZE) {
        parts.pop();
        full = parts.join("\n\n") + "\n\n" + userMessage;
      }
      if (full.length > MAX_CONTEXT_SIZE) {
        // Truncate the remaining part
        const remaining = MAX_CONTEXT_SIZE - userMessage.length - 20;
        full = parts[0].slice(0, remaining) + "\n[/PROJECT]\n\n" + userMessage;
      }
    }

    return full;
  }

  /** Get a summary of what context would be sent (for /context command) */
  async getContextSummary(session: SessionRecord): Promise<string> {
    const dir = session.directory;
    const lines: string[] = [`Context for session "${session.name}" in ${dir}:\n`];

    // Docs found
    const docsFound: string[] = [];
    for (const file of PROJECT_DOC_FILES) {
      const filePath = join(dir, file);
      if (existsSync(filePath)) {
        try {
          const stat = statSync(filePath);
          docsFound.push(`  ${file} (${stat.size} bytes)`);
        } catch { /* skip */ }
      }
    }
    lines.push(`Project docs: ${docsFound.length > 0 ? "\n" + docsFound.join("\n") : "none found"}`);

    // Stack
    const stack = this.detectStack(dir);
    if (stack.length > 0) lines.push(`Stack: ${stack.join(", ")}`);

    // Git
    const git = await this.readGitState(dir);
    if (git) {
      lines.push(`Git: ${git.branch} (${git.uncommitted} dirty files, ${git.commits.length} recent commits)`);
    } else {
      lines.push("Git: not a git repository");
    }

    // History
    const history = this.readHistory(session.id);
    lines.push(`Conversation history: ${history.length} messages`);

    // Preferences
    const prefs = this.readPreferences();
    lines.push(`User preferences: ${prefs ? "loaded" : "none"}`);

    // System prompt
    lines.push(`System prompt: ${session.agentPersona ? "set" : "none"}`);

    return lines.join("\n");
  }

  /** Store a message in the DB */
  storeMessage(sessionId: string, role: "user" | "assistant", content: string): void {
    const { nanoid } = this.getNanoid();
    this.db.insertMessage({
      id: nanoid(12),
      sessionId,
      role,
      content,
      createdAt: Date.now(),
    });
  }

  /** Detect file mentions in a message by matching tokens against project files */
  detectFileMentions(message: string, directory: string): string[] {
    const mentions: string[] = [];
    const tokens = message.split(/[\s,;()"'`]+/).filter((t) => t.length > 2);

    // Gather files from root and src/
    const files = this.listShallowFiles(directory);
    const srcDir = join(directory, "src");
    if (existsSync(srcDir)) {
      files.push(...this.listShallowFiles(srcDir).map((f) => `src/${f}`));
    }

    for (const token of tokens) {
      for (const file of files) {
        const name = basename(file);
        if (token === name || token === name.replace(/\.[^.]+$/, "")) {
          if (!mentions.includes(file)) {
            mentions.push(file);
          }
        }
      }
    }

    return mentions;
  }

  // ─── Private helpers ───────────────────────────────────────

  private readProjectDocs(dir: string): string | null {
    const docs: string[] = [];
    let totalSize = 0;

    for (const file of PROJECT_DOC_FILES) {
      if (totalSize >= MAX_DOC_SIZE) break;

      const filePath = join(dir, file);
      if (!existsSync(filePath)) continue;

      try {
        const content = readFileSync(filePath, "utf-8");
        const remaining = MAX_DOC_SIZE - totalSize;
        if (content.length <= remaining) {
          docs.push(`## ${file}\n${content}`);
          totalSize += content.length;
        } else {
          docs.push(`## ${file} (truncated)\n${content.slice(0, remaining)}\n... (${content.length} chars total)`);
          totalSize = MAX_DOC_SIZE;
        }
      } catch {
        // skip unreadable files
      }
    }

    return docs.length > 0 ? docs.join("\n\n") : null;
  }

  /** Extract file paths mentioned in messages and read their contents */
  private extractReferencedFiles(messages: string[], dir: string): Array<{ path: string; content: string }> {
    const paths = new Set<string>();

    for (const msg of messages.slice(-5)) {
      let match: RegExpExecArray | null;
      // Reset regex state
      FILE_PATH_PATTERN.lastIndex = 0;
      while ((match = FILE_PATH_PATTERN.exec(msg)) !== null) {
        paths.add(match[1]);
      }
    }

    const results: Array<{ path: string; content: string }> = [];
    for (const p of paths) {
      if (results.length >= MAX_REFERENCED_FILES) break;
      const full = join(dir, p);
      if (!existsSync(full)) continue;

      try {
        const stat = statSync(full);
        // Skip large files and non-files
        if (!stat.isFile() || stat.size > 50000) continue;

        const content = readFileSync(full, "utf-8");
        results.push({
          path: p,
          content: content.length > MAX_FILE_CONTENT
            ? content.slice(0, MAX_FILE_CONTENT) + `\n... (${content.length} chars total)`
            : content,
        });
      } catch { /* skip */ }
    }

    return results;
  }

  private detectStack(dir: string): string[] {
    for (const detector of STACK_DETECTORS) {
      const filePath = join(dir, detector.file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf-8");
          return detector.detect(content);
        } catch {
          continue;
        }
      }
    }
    return [];
  }

  private async readGitState(dir: string): Promise<{
    branch: string;
    uncommitted: number;
    commits: string[];
    dirtyFiles: string[];
  } | null> {
    try {
      const branch = (await this.execGit(dir, ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
      const statusOutput = await this.execGit(dir, ["status", "--porcelain"]);
      const dirtyLines = statusOutput.split("\n").filter((l) => l.trim());
      const dirtyFiles = dirtyLines.map((l) => l.slice(3).trim());
      const logOutput = await this.execGit(dir, ["log", "--oneline", "-5"]);
      const commits = logOutput.split("\n").filter((l) => l.trim());
      return { branch, uncommitted: dirtyLines.length, commits, dirtyFiles };
    } catch {
      return null;
    }
  }

  private execGit(dir: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        proc.kill("SIGTERM");
        reject(new Error(`git command timed out after ${GIT_TIMEOUT_MS}ms`));
      }, GIT_TIMEOUT_MS);

      const proc = execFile("git", args, { cwd: dir, encoding: "utf-8" }, (error, stdout) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  private readHistory(sessionId: string): Array<{ role: string; content: string }> {
    try {
      const messages = this.db.getMessages(sessionId, HISTORY_LIMIT);
      return messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => !m.toolCall)
        .map((m) => ({ role: m.role, content: m.content }));
    } catch {
      return [];
    }
  }

  private readPreferences(): string | null {
    if (this.preferencesCacheLoaded) return this.preferencesCache;
    this.preferencesCacheLoaded = true;

    const prefsPath = join(homedir(), ".claudeforge", "preferences.md");
    if (existsSync(prefsPath)) {
      try {
        this.preferencesCache = readFileSync(prefsPath, "utf-8").slice(0, 500);
      } catch {
        this.preferencesCache = null;
      }
    }
    return this.preferencesCache;
  }

  private listShallowFiles(dir: string): string[] {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  /** Lazy-load nanoid to avoid top-level async import issues */
  private _nanoid: ((size?: number) => string) | null = null;
  private getNanoid(): { nanoid: (size?: number) => string } {
    if (!this._nanoid) {
      this._nanoid = (size = 21) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
        let result = "";
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        for (let i = 0; i < size; i++) {
          result += chars[bytes[i] % chars.length];
        }
        return result;
      };
    }
    return { nanoid: this._nanoid };
  }
}
