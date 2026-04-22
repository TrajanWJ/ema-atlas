import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

const DISPATCH_QUEUE = "/home/trajan/dispatch/queue";
const DISPATCH_ACTIVE = "/home/trajan/dispatch/active";
const VAULT_PATH = "/home/trajan/vault";
const ACTIVE_PROJECTS = "/home/trajan/vault/Trajan/Active Projects Summary.md";

interface DispatchTask {
  id: string;
  priority: string;
  agent: string;
  description: string;
  status: string;
  created?: string;
}

interface VaultChange {
  path: string;
  name: string;
  modified: string;
  relativePath: string;
}

interface ActiveProject {
  name: string;
  status: string;
  stack?: string;
  description?: string;
}

async function readDispatchDir(dir: string, status: string): Promise<DispatchTask[]> {
  const tasks: DispatchTask[] = [];
  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(dir, file), "utf-8");
        const data = JSON.parse(raw);
        tasks.push({
          id: data.id || file.replace(".json", ""),
          priority: data.priority || "P3",
          agent: data.agent || "unassigned",
          description: data.description || data.task || file,
          status,
          created: data.created || data.timestamp,
        });
      } catch {
        // Skip malformed files
      }
    }
  } catch {
    // Directory doesn't exist or is empty
  }
  return tasks;
}

async function getVaultChanges(): Promise<VaultChange[]> {
  const changes: VaultChange[] = [];
  try {
    const { stdout } = await execAsync(
      `find ${VAULT_PATH} -name "*.md" -mmin -1440 -type f -printf "%T@ %p\\n" 2>/dev/null | sort -rn | head -20`,
      { timeout: 5000 }
    );
    for (const line of stdout.trim().split("\n")) {
      if (!line.trim()) continue;
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx === -1) continue;
      const timestamp = parseFloat(line.substring(0, spaceIdx));
      const filePath = line.substring(spaceIdx + 1);
      const name = filePath.split("/").pop() || filePath;
      const relativePath = filePath.replace(VAULT_PATH + "/", "");
      changes.push({
        path: filePath,
        name: name.replace(".md", ""),
        modified: new Date(timestamp * 1000).toISOString(),
        relativePath,
      });
    }
  } catch {
    // Fallback: try without -printf
    try {
      const { stdout } = await execAsync(
        `find ${VAULT_PATH} -name "*.md" -mmin -1440 -type f 2>/dev/null | head -20`,
        { timeout: 5000 }
      );
      for (const line of stdout.trim().split("\n")) {
        if (!line.trim()) continue;
        const name = line.split("/").pop() || line;
        const relativePath = line.replace(VAULT_PATH + "/", "");
        let modified = new Date().toISOString();
        try {
          const s = await stat(line);
          modified = s.mtime.toISOString();
        } catch { /* skip */ }
        changes.push({ path: line, name: name.replace(".md", ""), modified, relativePath });
      }
    } catch { /* silent */ }
  }
  return changes;
}

async function getActiveProjects(): Promise<ActiveProject[]> {
  const projects: ActiveProject[] = [];
  try {
    const content = await readFile(ACTIVE_PROJECTS, "utf-8");
    // Parse markdown sections for projects
    const lines = content.split("\n");
    let currentProject: Partial<ActiveProject> | null = null;

    for (const line of lines) {
      // Match ### N. ProjectName
      const headerMatch = line.match(/^###\s+\d+\.\s+(.+)/);
      if (headerMatch) {
        if (currentProject?.name) projects.push(currentProject as ActiveProject);
        currentProject = { name: headerMatch[1].trim(), status: "Unknown" };
        continue;
      }
      // Match **ProjectName** — description
      const boldMatch = line.match(/^-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
      if (boldMatch) {
        if (currentProject?.name) projects.push(currentProject as ActiveProject);
        currentProject = {
          name: boldMatch[1].trim(),
          description: boldMatch[2].trim(),
          status: "Active",
        };
        // Check for status/phase in description
        const statusMatch = boldMatch[2].match(/Phase\s+\d+|Production|Active|Complete|Planned/i);
        if (statusMatch) currentProject.status = statusMatch[0];
        continue;
      }
      if (currentProject) {
        const statusLine = line.match(/\*\*Status:\*\*\s*(.+)/);
        if (statusLine) currentProject.status = statusLine[1].trim();
        const stackLine = line.match(/\*\*Stack:\*\*\s*(.+)/);
        if (stackLine) currentProject.stack = stackLine[1].trim();
        const whatLine = line.match(/\*\*What:\*\*\s*(.+)/);
        if (whatLine) currentProject.description = whatLine[1].trim();
      }
    }
    if (currentProject?.name) projects.push(currentProject as ActiveProject);
  } catch {
    // File doesn't exist
  }
  return projects;
}

async function getSystemHealth() {
  const health: Record<string, unknown> = {};

  // CPU
  try {
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'", { timeout: 3000 });
    health.cpu = parseFloat(stdout.trim()) || 0;
  } catch { health.cpu = 0; }

  // Memory
  try {
    const { stdout } = await execAsync("free -m | awk 'NR==2{printf \"%d %d\", $2, $3}'", { timeout: 3000 });
    const [total, used] = stdout.trim().split(" ").map(Number);
    health.memory = { totalMB: total, usedMB: used, percent: Math.round((used / total) * 100) };
  } catch { health.memory = { totalMB: 0, usedMB: 0, percent: 0 }; }

  // Disk
  try {
    const { stdout } = await execAsync("df -h / | awk 'NR==2{printf \"%s %s %s\", $2, $3, $5}'", { timeout: 3000 });
    const [total, used, pct] = stdout.trim().split(" ");
    health.disk = { total, used, percent: parseInt(pct) || 0 };
  } catch { health.disk = { total: "?", used: "?", percent: 0 }; }

  // Gateway
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("http://localhost:18789/health", { signal: controller.signal });
    clearTimeout(timeout);
    health.gateway = res.ok ? "healthy" : "degraded";
  } catch { health.gateway = "down"; }

  return health;
}

async function getAgentSessions() {
  try {
    const { stdout } = await execAsync("openclaw status 2>/dev/null || echo 'unavailable'", { timeout: 5000 });
    const lines = stdout.trim().split("\n");
    const sessionLines = lines.filter(l => l.includes("session") || l.includes("agent") || l.includes("active"));
    const countMatch = stdout.match(/(\d+)\s+(?:active|running|session)/i);
    return {
      count: countMatch ? parseInt(countMatch[1]) : sessionLines.length,
      raw: stdout.substring(0, 500),
    };
  } catch {
    return { count: 0, raw: "Status unavailable" };
  }
}

function getGreeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${days[now.getUTCDay()]}, ${months[now.getUTCMonth()]} ${now.getUTCDate()}`;
}

export async function GET() {
  try {
    // Run all data gathering in parallel
    const [
      queueTasks,
      activeTasks,
      vaultChanges,
      activeProjects,
      systemHealth,
      agentSessions,
    ] = await Promise.all([
      readDispatchDir(DISPATCH_QUEUE, "queued"),
      readDispatchDir(DISPATCH_ACTIVE, "active"),
      getVaultChanges(),
      getActiveProjects(),
      getSystemHealth(),
      getAgentSessions(),
    ]);

    // Build priority tasks from dispatch queue (P0 + P1 first)
    const allTasks = [...activeTasks, ...queueTasks];
    const priorityTasks = allTasks
      .sort((a, b) => {
        const pa = parseInt(String(a.priority || "P9").replace(/[^0-9]/g, "")) || 9;
        const pb = parseInt(String(b.priority || "P9").replace(/[^0-9]/g, "")) || 9;
        return pa - pb;
      })
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        priority: t.priority,
        description: t.description,
        agent: t.agent,
        status: t.status,
      }));

    return NextResponse.json({
      greeting: getGreeting(),
      date: getFormattedDate(),
      priority_tasks: priorityTasks,
      pending_dispatch: queueTasks,
      active_dispatch: activeTasks,
      vault_changes_24h: vaultChanges,
      active_projects: activeProjects,
      system_health: systemHealth,
      agent_sessions: agentSessions,
      unread_discord: [], // placeholder
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to gather executive data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
