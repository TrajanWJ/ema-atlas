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
const JSON_MODE = process.argv.includes("--json");
const BACKUP_APP = `${TARGET_APP}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const steps = [];

function log(line) {
  if (JSON_MODE) {
    steps.push(line);
  } else {
    console.log(line);
  }
}

async function run(command, args, options = {}) {
  log(`$ ${[command, ...args].join(" ")}`);
  if (DRY_RUN) return { stdout: "", stderr: "" };
  return execFileP(command, args, {
    cwd: ROOT,
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
}

function emitFinal(payload) {
  if (JSON_MODE) {
    console.log(JSON.stringify({ ...payload, steps }, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

async function main() {
  log(
    `mode: dry_run=${DRY_RUN} preflight_only=${PREFLIGHT_ONLY} delete_target=${DELETE_TARGET} json=${JSON_MODE}`,
  );
  log(`target_app=${TARGET_APP}`);
  log(`root=${ROOT}`);

  if (PREFLIGHT_ONLY) {
    // Preflight describes what the full reinstall WOULD do, plus a runtime
    // report so the operator can confirm the active workspace is sane before
    // mutating the installed app on disk.
    log("preflight: would run pnpm --filter @ema/cli typecheck");
    log("preflight: would run pnpm build:cli");
    log("preflight: would run pnpm --dir apps/web build");
    log("preflight: would run bash scripts/build-web-static-out.sh");
    log("preflight: would run pnpm --filter @ema/desktop tauri build");
    log("preflight: would run bash scripts/stop-ema-dev.sh --force-port-kill");
    log("preflight: would run bash scripts/install-macos-tauri-app.sh");
    log("preflight: would open target app");
    if (!JSON_MODE) {
      try {
        await run("pnpm", ["runtime:report"]);
      } catch (err) {
        log(`runtime:report failed: ${err.message ?? String(err)}`);
      }
    }
    emitFinal({
      ok: true,
      target_app: TARGET_APP,
      target_app_exists: existsSync(TARGET_APP),
      mode: "preflight_only",
      dry_run: DRY_RUN,
    });
    return;
  }

  await run("pnpm", ["--filter", "@ema/cli", "typecheck"]);
  await run("pnpm", ["build:cli"]);
  await run("pnpm", ["--dir", "apps/web", "build"]);
  await run("bash", ["scripts/build-web-static-out.sh"]);
  await run("pnpm", ["--filter", "@ema/desktop", "tauri", "build"]);

  await run("bash", ["scripts/stop-ema-dev.sh", "--force-port-kill"]);

  if (existsSync(TARGET_APP)) {
    if (DRY_RUN) {
      log(`target exists and would move to backup before real reinstall: ${TARGET_APP} -> ${BACKUP_APP}`);
    } else if (!DELETE_TARGET) {
      throw new Error(`target exists; rerun with --delete-target after dry-run passes: ${TARGET_APP}`);
    } else {
      log(`mv ${TARGET_APP} ${BACKUP_APP}`);
      renameSync(TARGET_APP, BACKUP_APP);
    }
  }

  await run("bash", ["scripts/install-macos-tauri-app.sh"]);
  if (!DRY_RUN) {
    await run("open", [TARGET_APP]);
  }
  emitFinal({
    ok: true,
    target_app: TARGET_APP,
    backup_app: existsSync(BACKUP_APP) ? BACKUP_APP : null,
    dry_run: DRY_RUN,
    preflight_only: PREFLIGHT_ONLY,
  });
}

main().catch((error) => {
  const message = error.stack || error.message || String(error);
  if (JSON_MODE) {
    console.log(JSON.stringify({ ok: false, error: message, steps }, null, 2));
  } else {
    console.error(message);
  }
  process.exit(1);
});
