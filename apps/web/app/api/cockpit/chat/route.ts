// Cockpit agent-chat command surface — Sprint 4.
// A constrained command interpreter, not a free-form shell. Only a small
// whitelist of read-only / capture commands is allowed. Anything else
// returns HTTP 400 so the chat is verifiably non-arbitrary.
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

type ChatBody = {
	readonly command?: unknown;
	readonly project?: unknown;
};

type ExecFailure = Error & {
	readonly stdout?: unknown;
	readonly stderr?: unknown;
};

type SupportedSpec = {
	readonly id: string;
	readonly help: string;
	readonly parse: (rest: string) => readonly string[] | null;
};

const SUPPORTED: readonly SupportedSpec[] = [
	{
		id: "lane.list",
		help: "/lane list [--status <s>]",
		parse: (rest) => parseListWithStatus(["lane", "list"], rest),
	},
	{
		id: "queue.list",
		help: "/queue list [--status <s>]",
		parse: (rest) => parseListWithStatus(["queue", "list"], rest),
	},
	{
		id: "cockpit.projection",
		help: "/cockpit projection",
		parse: (rest) => (rest.trim() === "" ? ["cockpit", "projection"] : null),
	},
	{
		id: "cockpit.workpack",
		help: "/cockpit workpack",
		parse: (rest) => (rest.trim() === "" ? ["cockpit", "workpack"] : null),
	},
];

const SLUG_RE = /^[a-z0-9][a-z0-9._:-]{0,80}$/i;

function parseListWithStatus(prefix: readonly string[], rest: string): readonly string[] | null {
	const trimmed = rest.trim();
	if (trimmed === "") return [...prefix];
	const match = trimmed.match(/^--status\s+([a-z0-9._:-]{1,40})$/i);
	if (!match || !match[1]) return null;
	return [...prefix, "--status", match[1]];
}

function helpReply(): string {
	const lines = ["Supported commands:"];
	for (const spec of SUPPORTED) lines.push(`  ${spec.help}`);
	lines.push("  /help");
	return lines.join("\n");
}

async function run(args: readonly string[], cwd: string): Promise<string> {
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
	try {
		const body = (await request.json()) as ChatBody;
		const command = typeof body.command === "string" ? body.command.trim() : "";
		const projectRaw = typeof body.project === "string" ? body.project.trim() : "";
		const project = projectRaw && SLUG_RE.test(projectRaw) ? projectRaw : DEFAULT_PROJECT;

		if (!command || !command.startsWith("/")) {
			return Response.json(
				{
					ok: false,
					status: "command_unsupported",
					error: "command must start with '/' — try /help",
				},
				{ status: 400 },
			);
		}

		if (command === "/help" || command === "/help ") {
			return Response.json({
				ok: true,
				command_id: "help",
				reply: helpReply(),
				supported: SUPPORTED.map((spec) => spec.help),
			});
		}

		// Match `/word [rest]` against supported specs.
		const slash = command.slice(1);
		const head = slash.match(/^(\w+)(\s+(\w+))?\s*(.*)$/);
		if (!head) {
			return Response.json(
				{
					ok: false,
					status: "command_unsupported",
					error: `command not supported: ${command}`,
					hint: helpReply(),
				},
				{ status: 400 },
			);
		}
		const verb1 = head[1] ?? "";
		const verb2 = head[3] ?? "";
		const rest = head[4] ?? "";
		if (!verb1) {
			return Response.json(
				{
					ok: false,
					status: "command_unsupported",
					error: `command not supported: ${command}`,
					hint: helpReply(),
				},
				{ status: 400 },
			);
		}
		const id = verb2 ? `${verb1}.${verb2}` : verb1;
		const spec = SUPPORTED.find((entry) => entry.id === id);
		if (!spec) {
			return Response.json(
				{
					ok: false,
					status: "command_unsupported",
					error: `command not supported: ${command}`,
					hint: helpReply(),
				},
				{ status: 400 },
			);
		}
		const cliArgs = spec.parse(rest);
		if (!cliArgs) {
			return Response.json(
				{
					ok: false,
					status: "command_unsupported",
					error: `bad arguments for ${spec.help}`,
					hint: helpReply(),
				},
				{ status: 400 },
			);
		}

		const argsWithProject = cliArgs.includes("--project")
			? cliArgs
			: [...cliArgs, "--project", project];
		const cwd = project === DEFAULT_PROJECT && existsSync(PROSLYNC_APP) ? PROSLYNC_APP : EMA_ROOT;
		const stdout = await run(argsWithProject, cwd);
		const result = JSON.parse(stdout) as unknown;
		return Response.json(
			{
				ok: true,
				command_id: spec.id,
				command: ["ema", ...argsWithProject, "--json"],
				result,
			},
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		return Response.json(
			{
				ok: false,
				status: "chat_command_failed",
				error: error instanceof Error ? error.message : String(error),
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
		supported: SUPPORTED.map((spec) => spec.help),
	});
}
