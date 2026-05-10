import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const WEB_ROOT = process.cwd();
const EMA_ROOT = resolve(WEB_ROOT, "../..");
const EMA_CLI = join(EMA_ROOT, "apps/cli/dist/bin.js");
const PROSLYNC_APP = "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final";

async function run(
	command: string,
	args: readonly string[],
	cwd: string,
): Promise<string> {
	const { stdout } = await execFileAsync(command, [...args], {
		cwd,
		encoding: "utf8",
		timeout: 12_000,
		maxBuffer: 16 * 1024 * 1024,
	});
	return stdout.trim();
}

export async function GET() {
	try {
		const stdout = existsSync(EMA_CLI)
			? await run(
					process.execPath,
					[
						EMA_CLI,
						"cockpit",
						"intentions",
						"--project",
						"proslync-app-ios-final",
						"--json",
					],
					PROSLYNC_APP,
				)
			: await run(
					"ema",
					[
						"cockpit",
						"intentions",
						"--project",
						"proslync-app-ios-final",
						"--json",
					],
					PROSLYNC_APP,
				);
		return Response.json(JSON.parse(stdout), {
			headers: {
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		return Response.json(
			{
				ok: false,
				status: "intention_projection_unavailable",
				error: error instanceof Error ? error.message : String(error),
				next: "Run `ema intention harvest --project proslync-app-ios-final --max-sources 50 --json`.",
				stats: {
					sources_seen: 0,
					records_parsed: 0,
					candidate_intents: 0,
					proslync_relevant: 0,
					ema_relevant: 0,
					lost_followups: 0,
					duplicates_skipped: 0,
				},
				top_tags: [],
				recommended_queue: [],
			},
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			readonly intent_id?: unknown;
			readonly state?: unknown;
			readonly reason?: unknown;
			readonly reviewer?: unknown;
		};
		const intentId = typeof body.intent_id === "string" ? body.intent_id : "";
		const state = typeof body.state === "string" ? body.state : "";
		const verb =
			state === "accepted"
				? "accept"
				: state === "rejected"
					? "reject"
					: state === "deferred"
						? "defer"
						: null;
		if (!intentId || !verb) {
			return Response.json(
				{ ok: false, error: "intent_id and state accepted|rejected|deferred are required" },
				{ status: 400 },
			);
		}
		const reason = typeof body.reason === "string" && body.reason.length > 0 ? body.reason : "reviewed in cockpit";
		const reviewer = typeof body.reviewer === "string" && body.reviewer.length > 0 ? body.reviewer : "actor:trajan";
		const cliArgs = [
			verb,
			"--project",
			"proslync-app-ios-final",
			"--intent",
			intentId,
			"--reason",
			reason,
			"--reviewer",
			reviewer,
			"--json",
		];
		const stdout = existsSync(EMA_CLI)
			? await run(process.execPath, [EMA_CLI, "intention", ...cliArgs], PROSLYNC_APP)
			: await run("ema", ["intention", ...cliArgs], PROSLYNC_APP);
		return Response.json(JSON.parse(stdout), {
			headers: {
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		return Response.json(
			{
				ok: false,
				status: "intention_review_failed",
				error: error instanceof Error ? error.message : String(error),
			},
			{
				status: 500,
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	}
}
