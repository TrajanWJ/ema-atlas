# LCM Summary sum_987df11fa3b9d7e2

Created: 2026-03-18 02:59:08
Kind: leaf
Depth: 0
Conversation: 257
Tokens: 1215
Descendants: 0
Earliest: 2026-03-18T02:40:28.000Z
Latest: 2026-03-18T02:46:41.000Z

## Content

[2026-03-18 02:40 UTC]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

// Channel to watch
const DESK_CHANNEL_ID = "1482258431997116531";

// Dispatch log location
const DISPATCH_LOG_PATH = join(
  homedir(),
  ".openclaw/agents/main/workspace/dispatch-log.json"
);

// Task detection patterns
const TASK_PATTERNS = [
  /\b(queue up|get .+ on this|deep dive into|integrate|build|fix|implement|create)\b/i,
  /\b(look into|research|check out|set up|deploy|configure|write|make)\b/i,
  /\b(find out|compare|evaluate|audit|secure|scan|scrape|monitor)\b/i,
  /\b(organize|clean up|optimize|improve|update|add|remove|install)\b/i,
  /\b(hook up|wire up|connect|test|debug|refactor|migrate|analyze)\b/i,
  /\b(get .+ integrated|get .+ working|get .+ set up|get .+ running)\b/i,
  /\b(can you|please|need to|should|let's|gonna|want to|gotta)\b/i,
];

// Agent inference rules: [pattern, agentId]
const AGENT_RULES: [RegExp, string][] = [
  [/\b(research|look into|find out|compare|evaluat|what is|investigate|discover)\b/i, "researcher"],
  [/\b(build|fix|implement|create|code|integrat|refactor|debug|develop|feature|app|script|program)\b/i, "coder"],
  [/\b(deploy|health|restart|monitor|cron|server|infra|performance|system|uptime)\b/i, "ops"],
  [/\b(audit|secur|vulnerab|scan|harden|exploit|attack|auth|permission)\b/i, "security"],
  [/\b(organize|clean up|knowledge|vault|memory|note|document|archive)\b/i, "vault-keeper"],
  [/\b(scrape|website|feed|url|browse|crawl|web page)\b/i, "scout"],
  [/\b(prompt|soul|persona|metaprompt|optimize prompt)\b/i, "prompt-engineer"],
];

// Things that are clearly NOT tasks
const NOT_TASK_PATTERNS = [
  /^(lol|haha|nice|cool|ok|yeah|yep|nope|thanks|ty|thx|gn|gm|brb)$/i,
  /^.{0,5}$/, // Very short messages
  /^https?:\/\/\S+$/, // Just a URL with no context
];

interface DispatchEntry {
  id: string;
  description: string;
  sourceMessageId: string;
  agent: string;
  priority: "urgent" | "normal";
  status: "pending" | "dispatched" | "completed";
  timestamp: string;
  channel: string;
  detectedAt: string;
}

interface DispatchLog {
  entries: DispatchEntry[];
  lastChecked: string;
}

function loadDispatchLog(): DispatchLog {
  try {
    if (existsSync(DISPATCH_LOG_PATH)) {
      const data = readFileSync(DISPATCH_LOG_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[desk-watcher] Failed to load dispatch log:", e);
  }
  return { entries: [], lastChecked: new Date().toISOString() };
}

function saveDispatchLog(log: DispatchLog): void {
  try {
    const dir = dirname(DISPATCH_LOG_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(DISPATCH_LOG_PATH, JSON.stringify(log, null, 2));
  } catch (e) {
    console.error("[desk-watcher] Failed to save dispatch log:", e);
  }
}

function isTaskLike(content: string): boolean {
  // Filter out non-tasks
  for (const pattern of NOT_TASK_PATTERNS) {
    if (pattern.test(content.trim())) {
      return false;
    }
  }

  // Check for task patterns
  let matchCount = 0;
  for (const pattern of TASK_PATTERNS) {
    if (pattern.test(content)) {
      matchCount++;
    }
  }

  // Need at least 1 task pattern match and content length > 10
  return matchCount >= 1 && content.trim().length > 10;
}

function inferAgent(content: string): string {
  for (const [pattern, agent] of AGENT_RULES) {
    if (pattern.test(content)) {
      return agent;
    }
  }
  // Default: researcher for investigative, coder for everything else
  if (/\?/.test(content)) return "researcher";
  return "coder";
}

function inferPriority(content: string, metadata?: any): "urgent" | "normal" {
  // Urgent if contains @mentions, "urgent", "asap", "now", "immediately"
  if (/\b(urgent|asap|now|immediately|right away|priority|critical)\b/i.test(content)) {
    return "urgent";
  }
  // Check if there's an @mention in the raw content
  if (/<@\d+>/.test(content)) {
    return "urgent";
  }
  return "normal";
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}

const handler = async (event: any) => {
  // Only handle message:received events
  if (event.type !== "message" || event.action !== "received") {
    return;
  }

  const ctx = event.context || {};
  const channelId = ctx.channelId;
  const conversationId = ctx.conversationId;
  const messageId = ctx.messageId;
  const content = ctx.content || "";
  const senderId = ctx.from || ctx.metadata?.senderId || "";
  const senderName = ctx.metadata?.senderName ||
[LCM fallback summary; truncated for context management]
