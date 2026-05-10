#!/usr/bin/env node
/**
 * EMA functional E2E runner — Sprint 9 lane split.
 *
 * The runner used to serialize every check (CLI typecheck through
 * Playwright UI specs) which made local feedback brutally slow. Sprint 9
 * splits the work into 5 named lanes so agents can target the cheap
 * core checks during iteration and only run expensive UI lanes when a
 * web server is available.
 *
 * Lanes:
 *   core        — cli typecheck, build:cli, web tsc, gleam check, runtime report
 *   projection  — cockpit workpack/projection performance smoke
 *   ui          — priority vApps + critical cockpit Playwright specs
 *   static      — build-web-static-out + static parity
 *   release     — reinstall dry/preflight only (NEVER actually reinstalls)
 *
 * Flags:
 *   --lane <name>            run a single lane
 *   --lanes <a,b,c>          run multiple lanes
 *   --all                    run every lane (default if no lane flag passed)
 *   --json                   emit only the JSON summary on stdout
 *   --base-url <url>         override EMA_E2E_BASE_URL for UI/static lanes
 *
 * Exit code is non-zero if any lane reports failures. A failure in one
 * lane does NOT short-circuit the rest of the run — that is the whole
 * point of the split.
 */

import { spawn } from "node:child_process";

const KNOWN_LANES = /** @type {const} */ (["core", "projection", "ui", "static", "release"]);

function parseArgs(argv) {
	const args = { lanes: /** @type {string[]} */ ([]), json: false, baseUrl: null };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--lane") {
			args.lanes.push(argv[++i]);
		} else if (arg === "--lanes") {
			args.lanes.push(
				...String(argv[++i] ?? "")
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			);
		} else if (arg === "--all") {
			args.lanes.push(...KNOWN_LANES);
		} else if (arg === "--json") {
			args.json = true;
		} else if (arg === "--base-url") {
			args.baseUrl = argv[++i];
		} else if (arg === "--help" || arg === "-h") {
			args.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	if (args.lanes.length === 0 && !args.help) {
		args.lanes.push(...KNOWN_LANES);
	}
	for (const lane of args.lanes) {
		if (!KNOWN_LANES.includes(/** @type {(typeof KNOWN_LANES)[number]} */ (lane))) {
			throw new Error(`Unknown lane: ${lane}. Known lanes: ${KNOWN_LANES.join(", ")}`);
		}
	}
	return args;
}

function printHelp() {
	const lines = [
		"ema-functional-e2e.mjs — lane-split functional runner",
		"",
		"Usage:",
		"  node tooling/ema-functional-e2e.mjs [--lane <name> | --lanes a,b,c | --all] [--json]",
		"",
		`Lanes: ${KNOWN_LANES.join(", ")}`,
		"",
		"Default (no lane flag): runs every lane.",
		"Exit code is non-zero if any lane reports failures; lanes do not short-circuit each other.",
	];
	process.stdout.write(`${lines.join("\n")}\n`);
}

/**
 * Run a single command and capture timing/output.
 * Never throws — any failure becomes part of the lane's check record.
 */
function runStep(label, command, args, options = {}) {
	const startedAt = Date.now();
	return new Promise((resolve) => {
		const child = spawn(command, args, {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, ...(options.env ?? {}) },
			cwd: options.cwd,
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});
		child.on("close", (code, signal) => {
			resolve({
				label,
				command: [command, ...args].join(" "),
				exit_code: code,
				signal,
				passed: code === 0,
				duration_ms: Date.now() - startedAt,
				stdout_tail: stdout.slice(-2_000),
				stderr_tail: stderr.slice(-2_000),
			});
		});
		child.on("error", (error) => {
			resolve({
				label,
				command: [command, ...args].join(" "),
				exit_code: null,
				signal: null,
				passed: false,
				duration_ms: Date.now() - startedAt,
				stdout_tail: "",
				stderr_tail: error.stack || error.message,
			});
		});
	});
}

function laneSteps(lane, baseUrl) {
	const e2eEnv = {
		EMA_E2E_BASE_URL: baseUrl ?? process.env.EMA_E2E_BASE_URL ?? "http://127.0.0.1:5173",
	};
	switch (lane) {
		case "core":
			return [
				{ label: "cli:typecheck", cmd: "pnpm", args: ["--filter", "@ema/cli", "typecheck"] },
				{ label: "cli:build", cmd: "pnpm", args: ["build:cli"] },
				{
					label: "web:tsc",
					cmd: "pnpm",
					args: ["--dir", "apps/web", "exec", "tsc", "--noEmit"],
				},
				{ label: "daemon:gleam-check", cmd: "bash", args: ["-lc", "cd apps/daemon && gleam check"] },
				{ label: "runtime:report", cmd: "pnpm", args: ["runtime:report"] },
			];
		case "projection":
			return [
				{ label: "cockpit:perf-smoke", cmd: "node", args: ["tooling/cockpit-performance-smoke.mjs"] },
				{
					label: "cockpit:workpack-json",
					cmd: "node",
					args: [
						"apps/cli/dist/bin.js",
						"cockpit",
						"workpack",
						"--project",
						"proslync-app-ios-final",
						"--json",
					],
				},
				{
					label: "cockpit:projection-json",
					cmd: "node",
					args: [
						"apps/cli/dist/bin.js",
						"cockpit",
						"projection",
						"--project",
						"proslync-app-ios-final",
						"--json",
					],
				},
			];
		case "ui":
			return [
				{
					label: "e2e:cockpit-proslync",
					cmd: "pnpm",
					args: ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/cockpit-proslync.spec.ts"],
					env: e2eEnv,
				},
				{
					label: "e2e:launchpad-cockpit",
					cmd: "pnpm",
					args: [
						"--dir",
						"apps/web",
						"exec",
						"playwright",
						"test",
						"tests/e2e/launchpad-cockpit.spec.ts",
					],
					env: e2eEnv,
				},
				{
					label: "e2e:proslync-first-vapps",
					cmd: "pnpm",
					args: [
						"--dir",
						"apps/web",
						"exec",
						"playwright",
						"test",
						"tests/e2e/proslync-first-vapps.spec.ts",
					],
					env: e2eEnv,
				},
				{
					label: "e2e:settings-runtime",
					cmd: "pnpm",
					args: [
						"--dir",
						"apps/web",
						"exec",
						"playwright",
						"test",
						"tests/e2e/settings-runtime.spec.ts",
					],
					env: e2eEnv,
				},
				{
					label: "e2e:all-usable-vapps",
					cmd: "pnpm",
					args: [
						"--dir",
						"apps/web",
						"exec",
						"playwright",
						"test",
						"tests/e2e/all-usable-vapps.spec.ts",
					],
					env: e2eEnv,
				},
			];
		case "static":
			return [
				{ label: "build:web-static", cmd: "bash", args: ["scripts/build-web-static-out.sh"] },
				{
					label: "e2e:static-install-parity",
					cmd: "pnpm",
					args: [
						"--dir",
						"apps/web",
						"exec",
						"playwright",
						"test",
						"tests/e2e/static-install-parity.spec.ts",
					],
				},
			];
		case "release":
			return [
				{
					label: "release:reinstall-dry",
					cmd: "node",
					args: ["tooling/reinstall-ema-0.0.6.mjs", "--dry-run"],
				},
				{
					label: "release:reinstall-preflight",
					cmd: "node",
					args: ["tooling/reinstall-ema-0.0.6.mjs", "--preflight-only"],
				},
			];
		default:
			return [];
	}
}

async function runLane(lane, options) {
	const { jsonOnly, baseUrl } = options;
	const steps = laneSteps(lane, baseUrl);
	const startedAt = Date.now();
	const startedIso = new Date(startedAt).toISOString();
	if (!jsonOnly) {
		process.stderr.write(`\n[lane:${lane}] start ${startedIso} (${steps.length} steps)\n`);
	}
	const checks = [];
	for (const step of steps) {
		if (!jsonOnly) {
			process.stderr.write(`[lane:${lane}] -> ${step.label}\n`);
		}
		const result = await runStep(step.label, step.cmd, step.args, {
			env: step.env,
			cwd: step.cwd,
		});
		if (!jsonOnly) {
			const status = result.passed ? "ok" : "FAIL";
			process.stderr.write(
				`[lane:${lane}]    ${status} ${step.label} (${result.duration_ms}ms)\n`,
			);
			if (!result.passed && result.stderr_tail) {
				process.stderr.write(`[lane:${lane}]    stderr: ${result.stderr_tail.trim().slice(-500)}\n`);
			}
		}
		checks.push(result);
	}
	const endedAt = Date.now();
	const endedIso = new Date(endedAt).toISOString();
	const passed = checks.every((c) => c.passed);
	if (!jsonOnly) {
		process.stderr.write(
			`[lane:${lane}] end ${endedIso} (${endedAt - startedAt}ms, ${
				passed ? "passed" : "FAILED"
			})\n`,
		);
	}
	return {
		name: lane,
		started_at: startedIso,
		ended_at: endedIso,
		duration_ms: endedAt - startedAt,
		passed,
		checks,
	};
}

async function main() {
	let args;
	try {
		args = parseArgs(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		printHelp();
		process.exit(2);
	}
	if (args.help) {
		printHelp();
		return;
	}

	const requested = Array.from(new Set(args.lanes));
	const laneResults = [];
	for (const lane of requested) {
		const result = await runLane(lane, { jsonOnly: args.json, baseUrl: args.baseUrl });
		laneResults.push(result);
	}

	const summary = {
		ok: laneResults.every((l) => l.passed),
		generated_at: new Date().toISOString(),
		lanes: laneResults.map((l) => ({
			name: l.name,
			passed: l.passed,
			duration_ms: l.duration_ms,
			started_at: l.started_at,
			ended_at: l.ended_at,
			checks: l.checks.map((c) => ({
				label: c.label,
				command: c.command,
				passed: c.passed,
				duration_ms: c.duration_ms,
				exit_code: c.exit_code,
			})),
		})),
	};

	process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	process.exit(summary.ok ? 0 : 1);
}

main().catch((error) => {
	process.stderr.write(`${error.stack || error.message}\n`);
	process.exit(1);
});
