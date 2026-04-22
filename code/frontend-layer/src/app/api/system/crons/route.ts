import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface CronEntry {
  schedule: string;
  command: string;
  name: string;
  nextRun?: string;
}

function parseCronSchedule(schedule: string): string | undefined {
  // Estimate next run from cron schedule (simplified)
  const parts = schedule.split(/\s+/);
  if (parts.length < 5) return undefined;

  const [min, hour, dom, mon, dow] = parts;
  const now = new Date();

  try {
    // Simple cases
    if (min === "*" && hour === "*") return "Every minute";
    if (hour === "*" && min !== "*") {
      const nextMin = parseInt(min);
      const next = new Date(now);
      next.setMinutes(nextMin, 0, 0);
      if (next <= now) next.setHours(next.getHours() + 1);
      return next.toISOString();
    }
    // Every N minutes
    const everyMatch = min.match(/^\*\/(\d+)$/);
    if (everyMatch) {
      const interval = parseInt(everyMatch[1]);
      return `Every ${interval}min`;
    }
    // Specific hour
    if (hour !== "*" && min !== "*") {
      const next = new Date(now);
      next.setHours(parseInt(hour), parseInt(min), 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }
  } catch { /* fallback */ }

  return undefined;
}

export async function GET() {
  const entries: CronEntry[] = [];

  try {
    const { stdout } = await execAsync("crontab -l 2>/dev/null || echo ''", { timeout: 5000 });
    const lines = stdout.trim().split("\n");
    let lastComment = "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Track comments as job names
      if (trimmed.startsWith("#")) {
        lastComment = trimmed.replace(/^#+\s*/, "").trim();
        continue;
      }

      // Skip empty lines and env vars
      if (!trimmed || trimmed.includes("=")) {
        if (!trimmed) lastComment = "";
        continue;
      }

      // Parse cron line: min hour dom mon dow command
      const match = trimmed.match(/^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/);
      if (match) {
        const schedule = match[1];
        const command = match[2];

        // Generate a name from comment (only if directly preceding) or command
        const name = lastComment ||
          command
            .replace(/^\/home\/trajan\//, "~/")
            .replace(/\s+>>?\s.*$/, "")
            .split("/").pop()?.split(" ")[0] || "cron job";

        entries.push({
          schedule,
          command,
          name,
          nextRun: parseCronSchedule(schedule),
        });
      }
      lastComment = "";
    }
  } catch {
    // crontab not available
  }

  return NextResponse.json({ crons: entries, count: entries.length });
}
