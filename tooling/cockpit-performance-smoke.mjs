#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const PROJECT = process.env.EMA_COCKPIT_PROJECT ?? "proslync-app-ios-final";
const CLI = process.env.EMA_CLI_BIN ?? "apps/cli/dist/bin.js";

const checks = [
  {
    name: "workpack",
    args: [CLI, "cockpit", "workpack", "--project", PROJECT, "--json"],
    coldBudgetMs: Number(process.env.EMA_COCKPIT_WORKPACK_COLD_MS ?? 2500),
    warmBudgetMs: Number(process.env.EMA_COCKPIT_WORKPACK_WARM_MS ?? 750),
  },
  {
    name: "projection",
    args: [CLI, "cockpit", "projection", "--project", PROJECT, "--json"],
    coldBudgetMs: Number(process.env.EMA_COCKPIT_PROJECTION_COLD_MS ?? 2500),
    warmBudgetMs: Number(process.env.EMA_COCKPIT_PROJECTION_WARM_MS ?? 750),
  },
];

async function timedRun(args) {
  const started = process.hrtime.bigint();
  const { stdout } = await execFileP(process.execPath, args, {
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  const json = JSON.parse(stdout);
  return { ms: Math.round(ms), json };
}

function summarize(name, json) {
  if (name === "workpack") {
    return {
      ready: Boolean(json.health?.proslync_ready),
      builds: json.agent_work?.builds?.length ?? 0,
      surfaces: json.agent_work?.surfaces?.length ?? 0,
      queue: json.agent_work?.ready_queue?.length ?? 0,
    };
  }
  return {
    ready: Boolean(json.health?.proslync_ready),
    builds: json.active_builds?.length ?? 0,
    surfaces: json.surfaces?.length ?? 0,
    lanes: json.lanes?.length ?? 0,
    queue: json.queue?.length ?? 0,
  };
}

async function main() {
  const results = [];
  let ok = true;
  for (const check of checks) {
    const cold = await timedRun(check.args);
    const warm = await timedRun(check.args);
    const passed = cold.ms <= check.coldBudgetMs && warm.ms <= check.warmBudgetMs;
    ok &&= passed;
    results.push({
      name: check.name,
      command: ["node", ...check.args].join(" "),
      budgets_ms: { cold: check.coldBudgetMs, warm: check.warmBudgetMs },
      actual_ms: { cold: cold.ms, warm: warm.ms },
      passed,
      summary: summarize(check.name, warm.json),
    });
  }
  console.log(JSON.stringify({ ok, project: PROJECT, results }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
