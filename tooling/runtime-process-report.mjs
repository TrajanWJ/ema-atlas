#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PID_DIR = join(ROOT, ".ema-dev", "pids");
const TARGET_APP = process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;
const STATIC_OUT_DIR = join(ROOT, "apps", "web", "out");
const CLI_BIN = join(ROOT, "apps", "cli", "dist", "bin.js");

async function sh(command, args, options = {}) {
  try {
    const { stdout } = await execFileP(command, args, {
      maxBuffer: 8 * 1024 * 1024,
      ...options,
    });
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

async function walkStaticBundle(dir) {
  let count = 0;
  let bytes = 0;
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        count += 1;
        try {
          const s = await stat(full);
          bytes += s.size;
        } catch {
          // skip unreadable
        }
      }
    }
  }
  await walk(dir);
  return { file_count: count, size_bytes: bytes };
}

async function staticBundleStatus() {
  const path = STATIC_OUT_DIR;
  if (!existsSync(path)) return { path, exists: false };
  let isDir = false;
  try {
    isDir = statSync(path).isDirectory();
  } catch {
    return { path, exists: false };
  }
  if (!isDir) return { path, exists: false };
  const { file_count, size_bytes } = await walkStaticBundle(path);
  return { path, exists: true, file_count, size_bytes };
}

async function activeBuildGitState() {
  const head = await sh("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT });
  const branch = await sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT });
  const statusOut = await sh("git", ["status", "--short"], { cwd: ROOT });
  const statusLines = statusOut.split("\n").filter(Boolean);
  return {
    root: ROOT,
    head,
    branch,
    status_lines_total: statusLines.length,
    status: statusLines.slice(0, 40),
    truncated: statusLines.length > 40,
  };
}

async function proslyncWorkpackHealth() {
  if (!existsSync(CLI_BIN)) {
    return { ok: false, error: `cli not built: ${relative(ROOT, CLI_BIN)}` };
  }
  try {
    const { stdout } = await execFileP(
      "node",
      [CLI_BIN, "cockpit", "workpack", "--project", "proslync-app-ios-final", "--json"],
      { cwd: ROOT, timeout: 5000, maxBuffer: 16 * 1024 * 1024 },
    );
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (err) {
      return { ok: false, error: `unparseable workpack output: ${err.message}` };
    }
    const builds = parsed?.builds ?? parsed?.proslync?.builds ?? parsed?.projection?.builds ?? [];
    const surfaces =
      parsed?.surfaces ?? parsed?.proslync?.surfaces ?? parsed?.projection?.surfaces ?? [];
    const health =
      parsed?.health ??
      (parsed?.proslync_ready === true ? "ready" : parsed?.proslync_ready === false ? "not_ready" : "unknown");
    return {
      ok: true,
      health,
      build_count: Array.isArray(builds) ? builds.length : 0,
      surface_count: Array.isArray(surfaces) ? surfaces.length : 0,
    };
  } catch (error) {
    return { ok: false, error: error.message ?? String(error) };
  }
}

async function main() {
  const [daemon, web, companion] = await Promise.all([
    listener(49555),
    listener(5173),
    listener(27182),
  ]);
  const daemonPid = readPid("daemon");
  const webPid = readPid("web");
  const [staticBundle, gitState, workpack] = await Promise.all([
    staticBundleStatus(),
    activeBuildGitState(),
    proslyncWorkpackHealth(),
  ]);

  const report = {
    ok: true,
    root: ROOT,
    app: {
      path: TARGET_APP,
      exists: existsSync(TARGET_APP),
    },
    daemon_listener: daemon,
    web_listener: web,
    companion_listener: companion,
    installed_app_path: {
      path: TARGET_APP,
      exists: existsSync(TARGET_APP),
    },
    static_bundle_path: staticBundle,
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
    active_build_git_state: gitState,
    proslync_workpack_health: workpack,
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
