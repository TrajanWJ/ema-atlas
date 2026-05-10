#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const TARGET_APP = process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;
const DRY_RUN = process.argv.includes("--dry-run");
const DELETE_TARGET = process.argv.includes("--delete-target");
const PREFLIGHT_ONLY = process.argv.includes("--preflight-only");
const BACKUP_APP = `${TARGET_APP}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;

async function run(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  if (DRY_RUN && !PREFLIGHT_ONLY) return { stdout: "", stderr: "" };
  return execFileP(command, args, {
    cwd: ROOT,
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
}

async function main() {
  await run("pnpm", ["--filter", "@ema/cli", "typecheck"]);
  await run("pnpm", ["build:cli"]);
  await run("pnpm", ["--dir", "apps/web", "build"]);
  await run("bash", ["scripts/build-web-static-out.sh"]);
  await run("pnpm", ["--filter", "@ema/desktop", "tauri", "build"]);

  if (PREFLIGHT_ONLY) {
    await run("pnpm", ["runtime:report"]);
    console.log(JSON.stringify({ ok: true, target_app: TARGET_APP, mode: "preflight_only" }, null, 2));
    return;
  }

  await run("bash", ["scripts/stop-ema-dev.sh", "--force-port-kill"]);

  if (existsSync(TARGET_APP)) {
    if (DRY_RUN) {
      console.log(`target exists and would move to backup before real reinstall: ${TARGET_APP} -> ${BACKUP_APP}`);
    } else if (!DELETE_TARGET) {
      throw new Error(`target exists; rerun with --delete-target after dry-run passes: ${TARGET_APP}`);
    } else {
      console.log(`mv ${TARGET_APP} ${BACKUP_APP}`);
      renameSync(TARGET_APP, BACKUP_APP);
    }
  }

  await run("bash", ["scripts/install-macos-tauri-app.sh"]);
  await run("open", [TARGET_APP]);
  console.log(JSON.stringify({ ok: true, target_app: TARGET_APP, backup_app: existsSync(BACKUP_APP) ? BACKUP_APP : null, dry_run: DRY_RUN, preflight_only: PREFLIGHT_ONLY }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
