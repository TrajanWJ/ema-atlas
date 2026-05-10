// `ema observer` — print the daemon's rolling-window telemetry snapshot.
//
// Issues `telemetry.snapshot` over the IPC shell protocol and prints the
// top-N hottest BEAM processes by mailbox depth (with reductions/sec as a
// CPU-time proxy). Supports `--json` for machine-readable output.
//
// See: docs/architecture/02-daemon-supervision.md (Option 1 telemetry).

import { connect, DaemonUnreachableError } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { runStubContract } from "./stub-contract.js";

interface TelemetryRow {
	readonly pid: string;
	readonly name: string;
	readonly mailbox_max: number;
	readonly mailbox_avg: number;
	readonly reductions_per_sec: number;
	readonly sample_count: number;
}

interface TelemetrySnapshot {
	readonly window_seconds: number;
	readonly sample_interval_ms: number;
	readonly tracked_pids: number;
	readonly top: readonly TelemetryRow[];
}

export async function runObserver(args: ParsedArgs): Promise<number> {
	if (
		flagBool(args, "help") ||
		args.flags.h === true ||
		args.positional[0] === "help"
	) {
		return runStubContract(args, {
			noun: "observer",
			status: "available",
			usage: "Usage: ema observer [--json]",
			docRef: "packages/contracts/ipc/shell-protocol.md",
			commands: [
				{
					verb: "snapshot",
					flags: ["json"],
					summary:
						"Print the top-10 hottest BEAM processes from the daemon's rolling 60s telemetry window.",
				},
			],
		});
	}

	const json = flagBool(args, "json");

	try {
		const client = await connect({ surface: "desktop" });
		const result = await client.command("telemetry.snapshot", {});
		client.close();

		if (!result.ok) {
			if (json) {
				emitJson({ ok: false, error: result.error });
			} else {
				emitError(`ema observer: ${result.error.message}`);
			}
			return 1;
		}

		const snapshot = extractSnapshot(result);
		if (!snapshot) {
			if (json) {
				emitJson({
					ok: false,
					error: {
						class: "internal",
						message: "telemetry snapshot payload missing or malformed",
					},
				});
			} else {
				emitError("ema observer: telemetry snapshot payload missing or malformed");
			}
			return 1;
		}

		if (json) {
			emitJson({ ok: true, snapshot });
			return 0;
		}

		printPretty(snapshot);
		return 0;
	} catch (err) {
		const isUnreachable = err instanceof DaemonUnreachableError;
		const msg = err instanceof Error ? err.message : String(err);
		if (json) {
			emitJson({
				ok: false,
				error: {
					class: isUnreachable ? "unavailable" : "internal",
					message: msg,
				},
			});
		} else {
			emitError(`ema observer: ${msg}`);
			if (isUnreachable) {
				emitError("      Start the daemon with: bash scripts/dev-daemon.sh");
			}
		}
		return isUnreachable ? 2 : 1;
	}
}

function extractSnapshot(result: Record<string, unknown>): TelemetrySnapshot | null {
	const data = (result as { data?: unknown }).data;
	if (!data || typeof data !== "object") return null;
	const value = (data as { value?: unknown }).value;
	if (!value || typeof value !== "object") return null;
	const v = value as Record<string, unknown>;
	if (
		typeof v.window_seconds !== "number" ||
		typeof v.sample_interval_ms !== "number" ||
		typeof v.tracked_pids !== "number" ||
		!Array.isArray(v.top)
	) {
		return null;
	}
	const rows: TelemetryRow[] = [];
	for (const row of v.top) {
		if (!row || typeof row !== "object") continue;
		const r = row as Record<string, unknown>;
		if (
			typeof r.pid !== "string" ||
			typeof r.name !== "string" ||
			typeof r.mailbox_max !== "number" ||
			typeof r.mailbox_avg !== "number" ||
			typeof r.reductions_per_sec !== "number" ||
			typeof r.sample_count !== "number"
		) {
			continue;
		}
		rows.push({
			pid: r.pid,
			name: r.name,
			mailbox_max: r.mailbox_max,
			mailbox_avg: r.mailbox_avg,
			reductions_per_sec: r.reductions_per_sec,
			sample_count: r.sample_count,
		});
	}
	return {
		window_seconds: v.window_seconds,
		sample_interval_ms: v.sample_interval_ms,
		tracked_pids: v.tracked_pids,
		top: rows,
	};
}

function printPretty(s: TelemetrySnapshot): void {
	const header = `ema observer — top ${s.top.length} of ${s.tracked_pids} pids, ` +
		`window ${s.window_seconds}s @ ${s.sample_interval_ms}ms`;
	emitPretty(header);
	if (s.top.length === 0) {
		emitPretty("  (no samples yet)");
		return;
	}
	emitPretty(
		`  ${pad("name", 32)} ${pad("pid", 14)} ${pad("mbox max", 10)} ${pad("mbox avg", 10)} ${pad("reds/s", 12)} samples`
	);
	for (const row of s.top) {
		emitPretty(
			`  ${pad(row.name, 32)} ${pad(row.pid, 14)} ${pad(row.mailbox_max.toString(), 10)} ${pad(row.mailbox_avg.toFixed(2), 10)} ${pad(row.reductions_per_sec.toString(), 12)} ${row.sample_count}`
		);
	}
}

function pad(s: string, width: number): string {
	if (s.length >= width) return s.slice(0, width);
	return s + " ".repeat(width - s.length);
}
