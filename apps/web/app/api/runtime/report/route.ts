import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const WEB_ROOT = process.cwd();
const EMA_ROOT = resolve(WEB_ROOT, "../..");
const PID_DIR = join(EMA_ROOT, ".ema-dev", "pids");
const TARGET_APP =
	process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;
const STATIC_OUT = join(WEB_ROOT, "out");

async function sh(command: string, args: readonly string[]): Promise<string> {
	try {
		const { stdout } = await execFileAsync(command, [...args], {
			cwd: EMA_ROOT,
			encoding: "utf8",
			timeout: 4_000,
			maxBuffer: 4 * 1024 * 1024,
		});
		return stdout.trim();
	} catch {
		return "";
	}
}

function readPid(name: string): number | null {
	const path = join(PID_DIR, `${name}.pid`);
	if (!existsSync(path)) return null;
	const value = readFileSync(path, "utf8").trim();
	const pid = Number(value);
	return Number.isFinite(pid) ? pid : null;
}

async function listener(port: number) {
	const out = await sh("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
	return out
		.split("\n")
		.filter(Boolean)
		.slice(1)
		.map((line) => {
			const parts = line.trim().split(/\s+/);
			return { command: parts[0] ?? "", pid: Number(parts[1] ?? 0), raw: line };
		});
}

export async function GET() {
	const [daemon, web, companion] = await Promise.all([
		listener(49555),
		listener(5173),
		listener(27182),
	]);
	const daemonPid = readPid("daemon");
	const webPid = readPid("web");
	const report = {
		ok: true,
		root: EMA_ROOT,
		app: {
			path: TARGET_APP,
			exists: existsSync(TARGET_APP),
		},
		static_bundle: {
			path: STATIC_OUT,
			exists: existsSync(STATIC_OUT),
			popout_parity:
				existsSync(join(STATIC_OUT, "popout", "cockpit", "index.html")) &&
				existsSync(join(STATIC_OUT, "popout", "agent-work", "index.html")),
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
		health: {
			daemon: daemon.length > 0 ? "up" : "down",
			web: web.length > 0 ? "up" : "down",
			companion: companion.length > 0 ? "up" : "down",
			installed_app: existsSync(TARGET_APP) ? "present" : "missing",
		},
	};
	return Response.json(report, {
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
