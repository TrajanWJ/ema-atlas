import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, readdir } from "fs/promises";

const execAsync = promisify(exec);

const OPENCLAW_CONFIG = "/home/trajan/.openclaw/openclaw.json";
const AGENTS_DIR = "/home/trajan/.openclaw/agents";
const GATEWAY_HEALTH = "http://localhost:18789/health";

export async function GET() {
  let status: "ok" | "degraded" | "down" = "down";
  let gatewayVersion = "";
  let activeAgents = 0;
  let uptime = "";

  // 1. Gateway health check (instant — HTTP to local port)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(GATEWAY_HEALTH, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      status = data.ok ? "ok" : "degraded";
    }
  } catch {
    status = "down";
  }

  // 2. Agent count from filesystem (instant)
  try {
    const entries = await readdir(AGENTS_DIR, { withFileTypes: true });
    activeAgents = entries.filter(
      (e) => e.isDirectory() && !e.name.startsWith("_") && e.name !== "default"
    ).length;
  } catch {
    // silent
  }

  // 3. Version from config file (instant)
  try {
    const configRaw = await readFile(OPENCLAW_CONFIG, "utf-8");
    const config = JSON.parse(configRaw);
    gatewayVersion = config?.meta?.lastTouchedVersion || "";
  } catch {
    // silent
  }

  // 4. Uptime from process (fast)
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
      uptime = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  } catch {
    // silent — just means no gateway process found via pgrep
  }

  // 5. Usage from claude-pace.json (instant file read)
  let usagePct = 0;
  try {
    const paceRaw = await readFile("/home/trajan/.claude-pace.json", "utf-8");
    const pace = JSON.parse(paceRaw);
    if (typeof pace.used_pct === "number") {
      usagePct = Math.round(pace.used_pct);
    }
  } catch {
    // silent — file may not exist
  }

  return NextResponse.json({ status, uptime, gatewayVersion, activeAgents, usagePct });
}
