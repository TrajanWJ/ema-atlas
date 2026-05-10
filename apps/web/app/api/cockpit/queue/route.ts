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
const PROSLYNC_PROJECT = "proslync-app-ios-final";

type QueueAddBody = {
	readonly title?: unknown;
	readonly why?: unknown;
	readonly done_when?: unknown;
	readonly source?: unknown;
	readonly tags?: unknown;
	readonly lane_id?: unknown;
};

type ExecFailure = Error & {
	readonly stdout?: unknown;
	readonly stderr?: unknown;
};

async function run(command: string, args: readonly string[], cwd: string): Promise<string> {
	const { stdout } = await execFileAsync(command, [...args], {
		cwd,
		encoding: "utf8",
		timeout: 12_000,
		maxBuffer: 16 * 1024 * 1024,
	});
	return stdout.trim();
}

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function queueIdFrom(result: unknown): string | null {
	if (!result || typeof result !== "object") return null;
	const record = result as Record<string, unknown>;
	if (typeof record.resource === "string" && record.resource.length > 0) return record.resource;
	if (typeof record.queue_id === "string" && record.queue_id.length > 0) return record.queue_id;
	if (typeof record.id === "string" && record.id.length > 0) return record.id;
	return null;
}

export async function POST(request: Request) {
	let commandForResponse: readonly string[] = [];
	try {
		const body = (await request.json()) as QueueAddBody;
		const title = text(body.title);
		const why = text(body.why);
		const doneWhen = text(body.done_when);
		const source = text(body.source);
		const tags = text(body.tags);
		const laneId = text(body.lane_id);

		if (!title || !why || !doneWhen || !source) {
			return Response.json(
				{
					ok: false,
					status: "queue_capture_invalid",
					error: "title, why, done_when, and source are required",
				},
				{ status: 400 },
			);
		}

		const sourceWithTags = tags ? `${source}; tags=${tags}` : source;
		const cliArgs = [
			"queue",
			"add",
			"--project",
			PROSLYNC_PROJECT,
			"--title",
			title,
			"--why",
			why,
			"--done-when",
			doneWhen,
			"--source",
			sourceWithTags,
			"--json",
		];
		if (laneId) cliArgs.splice(cliArgs.length - 1, 0, "--lane", laneId);
		commandForResponse = ["ema", ...cliArgs];

		const stdout = existsSync(EMA_CLI)
			? await run(process.execPath, [EMA_CLI, ...cliArgs], PROSLYNC_APP)
			: await run("ema", cliArgs, PROSLYNC_APP);
		const result = JSON.parse(stdout) as unknown;
		const queueId = queueIdFrom(result);
		if (!queueId) {
			return Response.json(
				{
					ok: false,
					status: "queue_capture_missing_resource",
					error: "ema queue add returned JSON without a queue resource id",
					command: commandForResponse,
					result,
				},
				{ status: 502 },
			);
		}

		return Response.json(
			{
				ok: true,
				command: commandForResponse,
				queue_id: queueId,
				target_project: PROSLYNC_PROJECT,
				source,
				result,
			},
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		return Response.json(
			{
				ok: false,
				status: "queue_capture_failed",
				error: error instanceof Error ? error.message : String(error),
				command: commandForResponse,
				stdout: text((error as ExecFailure).stdout),
				stderr: text((error as ExecFailure).stderr),
			},
			{
				status: 500,
				headers: { "Cache-Control": "no-store" },
			},
		);
	}
}
