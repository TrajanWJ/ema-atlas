import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

const AGENTS_DIR = "/home/trajan/.openclaw/agents";

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "active" | "idle";
  lastActivity?: string;
  sessionCount: number;
}

const KNOWN_AGENTS: Record<string, { emoji: string; color: string; name: string }> = {
  main: { emoji: "🤝", color: "#E8A838", name: "Right Hand" },
  researcher: { emoji: "🔬", color: "#2BA89E", name: "Researcher" },
  coder: { emoji: "💻", color: "#57A773", name: "Coder" },
  ops: { emoji: "⚙️", color: "#6C7A89", name: "Ops" },
  security: { emoji: "🛡️", color: "#E74C3C", name: "Security" },
  "vault-keeper": { emoji: "📚", color: "#9B59B6", name: "Vault Keeper" },
  "browser-automation": { emoji: "🔭", color: "#E67E22", name: "Scout" },
  "prompt-engineer": { emoji: "🎯", color: "#3498DB", name: "Prompt Engineer" },
  concierge: { emoji: "🛎️", color: "#1ABC9C", name: "Concierge" },
  "devils-advocate": { emoji: "😈", color: "#E91E63", name: "Devil's Advocate" },
  strategist: { emoji: "🧠", color: "#6366F1", name: "Strategist" },
  "universal-orchestrator": { emoji: "🎼", color: "#F59E0B", name: "Orchestrator" },
};

// Try to get live session data
function getActiveSessions(): Set<string> {
  const active = new Set<string>();
  try {
    const output = execSync("openclaw agent list 2>/dev/null || true", {
      timeout: 3000,
      encoding: "utf-8",
    });
    // Parse output for active agents
    for (const line of output.split("\n")) {
      const lower = line.toLowerCase();
      for (const id of Object.keys(KNOWN_AGENTS)) {
        if (lower.includes(id) && (lower.includes("active") || lower.includes("running") || lower.includes("online"))) {
          active.add(id);
        }
      }
    }
  } catch {
    // If openclaw CLI not available, check for main agent (always active)
    active.add("main");
  }
  return active;
}

export async function GET() {
  const agents: AgentInfo[] = [];
  const activeSessions = getActiveSessions();

  try {
    const entries = await readdir(AGENTS_DIR, { withFileTypes: true });
    const agentDirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_") && e.name !== "default")
      .map((e) => e.name);

    for (const id of agentDirs) {
      const known = KNOWN_AGENTS[id];
      const isActive = activeSessions.has(id) || id === "main";

      // Check last modification time of workspace for activity detection
      let lastActivity: string | undefined;
      let sessionCount = 1;
      try {
        const wsPath = join(AGENTS_DIR, id, "workspace");
        const wsStat = await stat(wsPath);
        const ageMs = Date.now() - wsStat.mtimeMs;
        if (ageMs < 300000) { // Modified in last 5 min
          lastActivity = "Recently active";
        } else if (ageMs < 3600000) {
          lastActivity = `Active ${Math.floor(ageMs / 60000)}m ago`;
        }
        // Rough session estimate
        try {
          const sessDir = join(AGENTS_DIR, id, "sessions");
          const sessions = await readdir(sessDir);
          sessionCount = sessions.length || 1;
        } catch {
          sessionCount = isActive ? 1 : 0;
        }
      } catch {
        // silent
      }

      if (known) {
        agents.push({
          id,
          name: known.name,
          emoji: known.emoji,
          color: known.color,
          status: isActive || (lastActivity?.includes("Recently")) ? "active" : "idle",
          lastActivity,
          sessionCount,
        });
      } else {
        const name = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        agents.push({
          id,
          name,
          emoji: "🤖",
          color: "#888888",
          status: isActive ? "active" : "idle",
          lastActivity,
          sessionCount,
        });
      }
    }
  } catch {
    // Fallback to known agents
    for (const [id, info] of Object.entries(KNOWN_AGENTS)) {
      agents.push({
        id,
        name: info.name,
        emoji: info.emoji,
        color: info.color,
        status: id === "main" ? "active" : "idle",
        sessionCount: id === "main" ? 8 : 0,
      });
    }
  }

  // Sort: active first, then alphabetically
  agents.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    agents,
    count: agents.length,
    sessions: agents.reduce((sum, a) => sum + a.sessionCount, 0),
  });
}
