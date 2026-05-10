#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(ROOT, "apps", "cli", "dist", "bin.js");
const PROOF = join(ROOT, ".ema-dev", "codex-roundtrip", "last-proof.json");
const PROMPT = "Return exactly: codex roundtrip smoke ok. Do not inspect or modify files.";
const STARTED_AT = Date.now();

main().catch((err) => fail("unhandled codex roundtrip smoke error", { error: String(err?.stack ?? err) }));

async function main() {
  if (!existsSync(CLI)) fail("CLI dist entrypoint is missing; run pnpm build:cli first", { cli: CLI });

  const ping = cliJson(["ping", "--json"], { allowFailure: true, timeout: 5_000 });
  if (ping.code !== 0 || ping.json?.ok !== true) fail("daemon ping failed; start the EMA daemon before running this smoke", ping);

  const version = run("codex", ["--version"], { timeout: 5_000 });
  if (version.code !== 0 || !version.stdout.trim()) fail("codex --version failed", version);

  const dispatch = cliJson([
    "harness",
    "dispatch",
    "--provider",
    "codex",
    "--prompt",
    PROMPT,
    "--mode",
    "capability-check",
    "--timeout-ms",
    "60000",
    "--json",
  ], { allowFailure: true, timeout: 70_000 });
  if (dispatch.code !== 0 || dispatch.json?.ok !== true) fail("codex harness dispatch did not complete successfully", dispatch);

  const executionId = dispatch.json?.execution?.id;
  if (!executionId) fail("codex harness dispatch returned no execution id", dispatch.json);

  const terminal = await waitFor(`execution ${executionId} terminal status`, () => {
    const show = cliJson(["execution", "show", "--execution", executionId, "--json"], { allowFailure: true });
    const status = show.json?.execution?.status;
    return ["completed", "failed", "timeout"].includes(status) ? show : null;
  });
  if (terminal.json?.execution?.status !== "completed") {
    fail("codex execution reached non-completed terminal status", terminal);
  }

  const timeline = cliJson(["execution", "timeline", "--execution", executionId, "--json"]);
  const eventTypes = (timeline.json?.timeline ?? []).map((event) => event.kind);
  for (const required of ["dispatch.started", "execution.started", "tool.invoked", "execution.completed"]) {
    if (!eventTypes.includes(required)) {
      fail("execution timeline is missing required canonical event", {
        execution_id: executionId,
        required,
        event_types: eventTypes,
      });
    }
  }

  if (!existsSync(PROOF)) fail("codex proof file was not written", { proof: PROOF });
  const proof = JSON.parse(readFileSync(PROOF, "utf8"));
  const passedAt = typeof proof.passed_at === "string" ? Date.parse(proof.passed_at) : Number.NaN;
  if (!Number.isFinite(passedAt) || passedAt < STARTED_AT) {
    fail("codex proof file does not belong to this smoke run", { proof_path: PROOF, proof });
  }
  if (proof.execution_id !== executionId) {
    fail("codex proof execution id does not match dispatch", { execution_id: executionId, proof });
  }

  const readiness = cliJson(["readiness", "--json"], { allowFailure: true, timeout: 20_000 });
  const blockers = Array.isArray(readiness.json?.blockers) ? readiness.json.blockers.map((blocker) => blocker.id) : [];
  if (blockers.includes("codex_roundtrip")) {
    fail("readiness still reports codex_roundtrip after fresh proof", { blockers, readiness: readiness.json });
  }

  console.log(JSON.stringify({
    ok: true,
    command: "codex-roundtrip-smoke",
    codex_version: version.stdout.trim(),
    execution_id: executionId,
    event_types: eventTypes,
    proof_path: relative(ROOT, PROOF),
    readiness_blockers: blockers,
  }, null, 2));
}

async function waitFor(label, check, options = {}) {
  const retries = options.retries ?? 80;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const result = await check();
    if (result) return result;
    await delay(250);
  }
  fail(`timed out waiting for ${label}`, { retries });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cliJson(args, options = {}) {
  const result = run(process.execPath, [CLI, ...args], options);
  let json = null;
  try {
    json = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  } catch (err) {
    if (!options.allowFailure) {
      fail("failed to parse CLI JSON output", { args, stdout: result.stdout, stderr: result.stderr, error: String(err) });
    }
  }
  if (!options.allowFailure && result.code !== 0) {
    fail("CLI command failed", { args, code: result.code, stdout: result.stdout, stderr: result.stderr, json });
  }
  return { ...result, json };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeout ?? 10_000,
  });
  return {
    command,
    args,
    code: result.status ?? 1,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error) : null,
  };
}

function fail(message, details = {}) {
  console.log(JSON.stringify({
    ok: false,
    command: "codex-roundtrip-smoke",
    error: { message, details },
  }, null, 2));
  process.exit(1);
}
