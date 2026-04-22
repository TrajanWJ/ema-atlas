import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";

const execAsync = promisify(exec);

export async function GET() {
  const result: Record<string, unknown> = {};

  // CPU usage
  try {
    const { stdout } = await execAsync(
      "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'",
      { timeout: 5000 }
    );
    result.cpuPercent = parseFloat(stdout.trim()) || 0;
  } catch { result.cpuPercent = 0; }

  // Memory
  try {
    const { stdout } = await execAsync(
      "free -m | awk 'NR==2{printf \"%d %d %d\", $2, $3, $7}'",
      { timeout: 3000 }
    );
    const [total, used, available] = stdout.trim().split(" ").map(Number);
    result.memory = { totalMB: total, usedMB: used, availableMB: available, percent: Math.round((used / total) * 100) };
  } catch { result.memory = null; }

  // Disk
  try {
    const { stdout } = await execAsync(
      "df -h / | awk 'NR==2{printf \"%s %s %s %s\", $2, $3, $4, $5}'",
      { timeout: 3000 }
    );
    const [total, used, avail, pct] = stdout.trim().split(" ");
    result.disk = { total, used, available: avail, percent: pct };
  } catch { result.disk = null; }

  // Gateway uptime
  try {
    const { stdout } = await execAsync(
      "ps -o etimes= -p $(pgrep -f 'openclaw.*gateway' | head -1) 2>/dev/null",
      { timeout: 3000 }
    );
    const seconds = parseInt(stdout.trim(), 10);
    if (!isNaN(seconds)) {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      result.uptime = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
      result.uptimeSeconds = seconds;
    }
  } catch { result.uptime = "unknown"; }

  // Active sessions count
  try {
    const { stdout } = await execAsync(
      "openclaw agent list 2>/dev/null | wc -l",
      { timeout: 5000 }
    );
    result.sessionCount = parseInt(stdout.trim(), 10) || 0;
  } catch { result.sessionCount = 0; }

  // Usage from claude-pace
  try {
    const raw = await readFile("/home/trajan/.claude-pace.json", "utf-8");
    const pace = JSON.parse(raw);
    result.usagePct = Math.round(pace.used_pct ?? 0);
  } catch { result.usagePct = 0; }

  // Load average
  try {
    const { stdout } = await execAsync("cat /proc/loadavg", { timeout: 2000 });
    const parts = stdout.trim().split(" ");
    result.loadAvg = { "1m": parseFloat(parts[0]), "5m": parseFloat(parts[1]), "15m": parseFloat(parts[2]) };
  } catch { result.loadAvg = null; }

  return NextResponse.json(result);
}
