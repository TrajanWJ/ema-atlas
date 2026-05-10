#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

async function run(command, args, options = {}) {
  const started = Date.now();
  const { stdout, stderr } = await execFileP(command, args, {
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  return {
    command: [command, ...args].join(" "),
    ms: Date.now() - started,
    stdout,
    stderr,
  };
}

async function main() {
  const checks = [];
  checks.push(await run("pnpm", ["runtime:report"]));
  checks.push(await run("pnpm", ["--filter", "@ema/cli", "typecheck"]));
  checks.push(await run("pnpm", ["build:cli"]));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "tsc", "--noEmit"]));
  checks.push(await run("bash", ["-lc", "cd apps/daemon && gleam check"]));
  checks.push(await run("node", ["apps/cli/dist/bin.js", "cockpit", "projection", "--project", "proslync-app-ios-final", "--json"]));
  checks.push(await run("node", ["apps/cli/dist/bin.js", "cockpit", "workpack", "--project", "proslync-app-ios-final", "--json"]));
  checks.push(await run("node", ["apps/cli/dist/bin.js", "cockpit", "intentions", "--project", "proslync-app-ios-final", "--json"]));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/cockpit-proslync.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/launchpad-cockpit.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/all-usable-vapps.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/settings-runtime.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/proslync-first-vapps.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/tauri-frame-drag.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/popout-titlebar.spec.ts"], {
    env: { ...process.env, EMA_E2E_BASE_URL: process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173" },
  }));
  checks.push(await run("bash", ["scripts/build-web-static-out.sh"]));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/static-install-parity.spec.ts"]));
  console.log(JSON.stringify({
    ok: true,
    checks: checks.map((check) => ({
      command: check.command,
      ms: check.ms,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
