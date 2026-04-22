// ═══════════════════════════════════════════════════════════
// Agent OS v8 — Utilities
// ═══════════════════════════════════════════════════════════

export function timeAgo(ts: string | number): string {
  const now = Date.now();
  const then = typeof ts === "number" ? ts : new Date(ts).getTime();
  const diff = now - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function shortTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function agentEmoji(id: string): string {
  const map: Record<string, string> = {
    righthand: "🤝", main: "🤝",
    researcher: "🔬", coder: "💻",
    ops: "⚙️", security: "🛡️",
    "vault-keeper": "📚", vault: "📚",
    "browser-automation": "🔭", scout: "🔭",
    "prompt-engineer": "🎯",
    concierge: "🛎️",
    "devils-advocate": "😈", devil: "😈",
    strategist: "🧠",
    user: "👤", system: "⚡", unknown: "❓",
  };
  return map[id] || "🤖";
}

export function agentName(id: string): string {
  const map: Record<string, string> = {
    righthand: "Right Hand", main: "Right Hand",
    researcher: "Researcher", coder: "Coder",
    ops: "Ops", security: "Security",
    "vault-keeper": "Vault Keeper", vault: "Vault Keeper",
    "browser-automation": "Scout", scout: "Scout",
    "prompt-engineer": "Prompt Engineer",
    concierge: "Concierge",
    "devils-advocate": "Devil's Advocate", devil: "Devil's Advocate",
    strategist: "Strategist",
    user: "You", system: "System",
  };
  return map[id] || id;
}

export function priorityColor(p: string): string {
  const normalized = (p || "P3").toUpperCase();
  switch (normalized) {
    case "P0": return "var(--red)";
    case "P1": return "var(--peach)";
    case "P2": return "var(--yellow)";
    case "P3": return "var(--green)";
    case "P4": return "var(--subtext0)";
    default: return "var(--subtext0)";
  }
}

export function statusColor(s: string): string {
  switch (s) {
    case "active": case "running": return "var(--green)";
    case "queued": case "pending": case "planned": return "var(--yellow)";
    case "done": case "completed": case "shipped": return "var(--blue)";
    case "failed": case "error": return "var(--red)";
    case "idle": return "var(--subtext0)";
    default: return "var(--subtext0)";
  }
}

/** Generate a simple UUID v4 */
export function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
