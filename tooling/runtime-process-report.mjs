#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PID_DIR = join(ROOT, ".ema-dev", "pids");
const TARGET_APP = process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;

async function sh(command, args) {
  try {
    const { stdout } = await execFileP(command, args, { maxBuffer: 8 * 1024 * 1024 });
    return stdout.trim();
  } catch {
    return "";
  }
}

function readPid(name) {
  const path = join(PID_DIR, `${name}.pid`);
  if (!existsSync(path)) return null;
  const value = readFileSync(path, "utf8").trim();
  return value.length ? Number(value) : null;
}

async function listener(port) {
  const out = await sh("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
  const lines = out.split("\n").filter(Boolean);
  return lines.slice(1).map((line) => {
    const parts = line.trim().split(/\s+/);
    return { command: parts[0] ?? "", pid: Number(parts[1] ?? 0), raw: line };
  });
}

async function main() {
  const [daemon, web, companion] = await Promise.all([
    listener(49555),
    listener(5173),
    listener(27182),
  ]);
  const daemonPid = readPid("daemon");
  const webPid = readPid("web");
  const report = {
    ok: true,
    root: ROOT,
    app: {
      path: TARGET_APP,
      exists: existsSync(TARGET_APP),
    },
    pidfiles: {
      daemon: daemonPid,
      web: webPid,
    },
    listeners: {
      daemon,
      web,
      companion,
    },
    stale_pidfiles: {
      daemon: daemonPid != null && !daemon.some((item) => item.pid === daemonPid),
      web: webPid != null && !web.some((item) => item.pid === webPid),
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
