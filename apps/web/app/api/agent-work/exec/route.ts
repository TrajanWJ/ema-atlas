// Agent Work command exec — Sprint 4.
// Daemon-backed primary actions for: lane list, lane claim, queue list,
// queue add, queue close, checkup runtime, agent orient. Strictly whitelisted
// — anything outside this set returns HTTP 400.
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
const DEFAULT_PROJECT = "proslync-app-ios-final";

type ExecBody = {
	readonly action?: unknown;
	readonly project?: unknown;
	readonly args?: unknown;
};

type ExecFailure = Error & {
	readonly stdout?: unknown;
	readonly stderr?: unknown;
};

const SLUG_RE = /^[a-z0-9][a-z0-9._:-]{0,160}$/i;
const FREE_TEXT_MAX = 400;

type ActionId =
	| "lane.list"
	| "lane.claim"
	| "queue.list"
	| "queue.add"
	| "queue.close"
	| "checkup.runtime"
	| "agent.orient";

type ActionSpec = {
	readonly id: ActionId;
	readonly label: string;
	readonly fields: readonly { readonly name: string; readonly required: boolean; readonly kind: "slug" | "text" }[];
	readonly build: (args: Record<string, string>, project: string) => readonly string[];
};

function req(args: Record<string, string>, name: string): string {
	const value = args[name];
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`missing required field '${name}'`);
	}
	return value;
}

function opt(args: Record<string, string>, name: string): string {
	return typeof args[name] === "string" ? (args[name] as string) : "";
}

const ACTIONS: readonly ActionSpec[] = [
	{
		id: "lane.list",
		label: "lane list",
		fields: [{ name: "status", required: false, kind: "slug" }],
		build: (args, project) => {
			const status = opt(args, "status");
			return [
				"lane",
				"list",
				"--project",
				project,
				...(status ? ["--status", status] : []),
			];
		},
	},
	{
		id: "lane.claim",
		label: "lane claim",
		fields: [
			{ name: "lane", required: true, kind: "slug" },
			{ name: "actor", required: true, kind: "slug" },
			{ name: "scope", required: true, kind: "text" },
			{ name: "goal", required: true, kind: "text" },
			{ name: "next", required: true, kind: "text" },
		],
		build: (args, project) => [
			"lane",
			"claim",
			"--project",
			project,
			"--lane",
			req(args, "lane"),
			"--actor",
			req(args, "actor"),
			"--scope",
			req(args, "scope"),
			"--goal",
			req(args, "goal"),
			"--next",
			req(args, "next"),
		],
	},
	{
		id: "queue.list",
		label: "queue list",
		fields: [{ name: "status", required: false, kind: "slug" }],
		build: (args, project) => {
			const status = opt(args, "status");
			return [
				"queue",
				"list",
				"--project",
				project,
				...(status ? ["--status", status] : []),
			];
		},
	},
	{
		id: "queue.add",
		label: "queue add",
		fields: [
			{ name: "title", required: true, kind: "text" },
			{ name: "why", required: true, kind: "text" },
			{ name: "done_when", required: false, kind: "text" },
			{ name: "source", required: false, kind: "text" },
			{ name: "lane", required: false, kind: "slug" },
		],
		build: (args, project) => {
			const lane = opt(args, "lane");
			return [
				"queue",
				"add",
				"--project",
				project,
				"--title",
				req(args, "title"),
				"--why",
				req(args, "why"),
				"--done-when",
				opt(args, "done_when") ||
					"Reviewed in Agent Work and either promoted, merged, or closed with a reason.",
				"--source",
				opt(args, "source") || "agent-work-exec",
				...(lane ? ["--lane", lane] : []),
			];
		},
	},
	{
		id: "queue.close",
		label: "queue close",
		fields: [
			{ name: "queue_item", required: true, kind: "slug" },
			{ name: "result", required: true, kind: "text" },
			{ name: "verify", required: false, kind: "text" },
		],
		build: (args, project) => {
			const verify = opt(args, "verify");
			return [
				"queue",
				"close",
				"--project",
				project,
				"--queue-item",
				req(args, "queue_item"),
				"--result",
				req(args, "result"),
				...(verify ? ["--verify", verify] : []),
			];
		},
	},
	{
		id: "checkup.runtime",
		label: "checkup runtime",
		fields: [],
		build: (_args, project) => ["checkup", "runtime", "--project", project],
	},
	{
		id: "agent.orient",
		label: "agent orient",
		fields: [],
		build: (_args, project) => ["agent", "orient", "--project", project],
	},
];

function findAction(id: unknown): ActionSpec | null {
	if (typeof id !== "string") return null;
	return ACTIONS.find((spec) => spec.id === id) ?? null;
}

function validateArgs(spec: ActionSpec, raw: unknown): Record<string, string> | string {
	const record =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {};
	const out: Record<string, string> = {};
	for (const field of spec.fields) {
		const value = record[field.name];
		const text = typeof value === "string" ? value.trim() : "";
		if (!text) {
			if (field.required) return `missing required field '${field.name}'`;
			continue;
		}
		if (field.kind === "slug") {
			if (!SLUG_RE.test(text)) return `invalid value for '${field.name}'`;
		} else {
			if (text.length > FREE_TEXT_MAX) return `'${field.name}' exceeds ${FREE_TEXT_MAX} chars`;
		}
		out[field.name] = text;
	}
	return out;
}

async function runEma(args: readonly string[], cwd: string): Promise<string> {
	const cliArgs = [...args, "--json"];
	const { stdout } = existsSync(EMA_CLI)
		? await execFileAsync(process.execPath, [EMA_CLI, ...cliArgs], {
				cwd,
				encoding: "utf8",
				timeout: 12_000,
				maxBuffer: 16 * 1024 * 1024,
			})
		: await execFileAsync("ema", cliArgs, {
				cwd,
				encoding: "utf8",
				timeout: 12_000,
				maxBuffer: 16 * 1024 * 1024,
			});
	return stdout.trim();
}

export async function POST(request: Request) {
	let commandForResponse: readonly string[] = [];
	try {
		const body = (await request.json()) as ExecBody;
		const spec = findAction(body.action);
		if (!spec) {
			return Response.json(
				{
					ok: false,
					status: "action_unsupported",
					error: "unsupported action",
					supported: ACTIONS.map((entry) => entry.id),
				},
				{ status: 400 },
			);
		}
		const projectRaw = typeof body.project === "string" ? body.project.trim() : "";
		const project = projectRaw && SLUG_RE.test(projectRaw) ? projectRaw : DEFAULT_PROJECT;

		const validated = validateArgs(spec, body.args);
		if (typeof validated === "string") {
			return Response.json(
				{ ok: false, status: "args_invalid", error: validated, action: spec.id },
				{ status: 400 },
			);
		}

		const cliArgs = spec.build(validated, project);
		commandForResponse = ["ema", ...cliArgs, "--json"];
		const cwd = project === DEFAULT_PROJECT && existsSync(PROSLYNC_APP) ? PROSLYNC_APP : EMA_ROOT;
		const stdout = await runEma(cliArgs, cwd);
		const result = JSON.parse(stdout) as unknown;
		return Response.json(
			{ ok: true, action: spec.id, command: commandForResponse, result },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		return Response.json(
			{
				ok: false,
				status: "exec_failed",
				error: error instanceof Error ? error.message : String(error),
				command: commandForResponse,
				stdout:
					typeof (error as ExecFailure).stdout === "string"
						? ((error as ExecFailure).stdout as string)
						: "",
				stderr:
					typeof (error as ExecFailure).stderr === "string"
						? ((error as ExecFailure).stderr as string)
						: "",
			},
			{ status: 500, headers: { "Cache-Control": "no-store" } },
		);
	}
}

export async function GET() {
	return Response.json({
		ok: true,
		actions: ACTIONS.map((spec) => ({
			id: spec.id,
			label: spec.label,
			fields: spec.fields,
		})),
	});
}
