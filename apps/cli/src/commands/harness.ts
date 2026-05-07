import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { connect, DaemonUnreachableError, type CommandResult } from "../ws-client.js";

const DEFAULT_ORG = "org:01J00000000000000000000001";
const DEFAULT_ACTOR = "actor:harness-cli";

const PROVIDERS = [
	{
		id: "simulated",
		kind: "local",
		status: "ready",
		source: "ema-cli",
		capabilities: ["dispatch", "stream", "stop", "events"],
		normalized_events: ["dispatch.started", "execution.started", "tool.returned", "execution.ended", "dispatch.ended"],
	},
	{
		id: "codex",
		kind: "pty",
		status: "ready",
		source: "duct-tape-onion-harness",
		capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
		normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.ended", "dispatch.ended"],
	},
	{
		id: "claude-code",
		kind: "pty",
		status: "ready",
		source: "duct-tape-onion-harness",
		capabilities: ["dispatch", "start", "list", "log", "context", "events", "grep", "stream", "stop"],
		normalized_events: ["dispatch.started", "execution.started", "tool.invoked", "tool.returned", "execution.ended", "dispatch.ended"],
	},
	{
		id: "hermes",
		kind: "cli",
		status: "future_consumer",
		source: "future-hermes",
		capabilities: ["dispatch", "stream", "handoff"],
		normalized_events: ["dispatch.started", "execution.started", "tool.returned", "execution.ended", "dispatch.ended"],
	},
];

const DONORS = [
	{
		id: "duct-tape-onion-harness",
		active_build: "Active builds/duct-tape-onion-harness",
		role: "provider/session lifecycle, WebSocket transport, adapters, PTY and SDK scaffolding",
		status: "donor_ready",
	},
	{
		id: "chronicle",
		active_build: "Active builds/chronicle",
		role: "activity parsing, ingestion, indexing, search, timeline projections",
		status: "donor_ready",
	},
];

export function runHarness(args: ParsedArgs): number | Promise<number> {
	const verb = args.positional[0] ?? "providers";
	if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHarnessHelp(args);
	if (verb === "providers" || verb === "sessions") return runProviders(args, verb);
	if (verb === "status") return runStatus(args);
	if (verb === "start") return runStart(args);
	if (verb === "list") return runList(args);
	if (verb === "assign" || verb === "bind") return runAssign(args);
	if (verb === "context" || verb === "ctx") return runContext(args);
	if (verb === "events") return runEvents(args);
	if (verb === "grep") return runGrep(args);
	if (verb === "log") return runLog(args);
	if (verb === "dispatch") return runDispatch(args);
	if (verb === "stream") return runStream(args);
	if (verb === "stop") return runStop(args);
	if (verb === "search") return runSearch(args);
	if (verb === "donors") return runDonors(args);
	emitError(`ema harness: unknown subcommand "${verb}" (expected: providers | sessions | donors | status | start | list | assign | context | events | grep | log | dispatch | stream | stop | search)`);
	return 64;
}

function runHarnessHelp(args: ParsedArgs): number {
	const commands = [
		{ verb: "providers", summary: "List Harness Glue providers and normalized event rails." },
		{ verb: "sessions", summary: "List provider session capabilities (first slice mirrors providers)." },
		{ verb: "status", summary: "Summarize Harness Glue readiness, pending daemon projections, and next adapter work." },
		{ verb: "donors", summary: "Show Chronicle and Duct Tape donor roles for future Hermes preparation." },
		{ verb: "start", summary: "Start a long-running Codex or Claude worker in a tmux-backed Harness session." },
		{ verb: "list", summary: "List file-backed Harness Glue execution records, filterable by --lane." },
		{ verb: "assign", summary: "Assign an existing Harness execution/session to a lane." },
		{ verb: "context", summary: "Return latest status, registry record, events, and recent session output for an execution or lane." },
		{ verb: "events", summary: "Read Harness Glue event log entries for an execution or lane." },
		{ verb: "grep", summary: "Ripgrep over registry, event log, and captured session output." },
		{ verb: "log", summary: "Capture recent tmux output for a Harness execution." },
		{ verb: "dispatch", summary: "Dispatch work to a provider; simulated provider is ready now." },
		{ verb: "stream", summary: "Stream normalized execution/tool events for an execution." },
		{ verb: "stop", summary: "Request execution stop and emit an audit-friendly event." },
		{ verb: "search", summary: "Search Chronicle/Harness activity once chronicle.activity is daemon-backed." },
	];
	if (flagBool(args, "json")) {
		emitJson({ noun: "harness", status: "preparing_for_hermes", commands, projections: projections(), donors: DONORS });
		return 0;
	}
	emitPretty("ema harness — Harness Glue preparation rail");
	for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
	return 0;
}

function runProviders(args: ParsedArgs, verb: string): number {
	const payload = {
		ok: true,
		command: `harness ${verb}`,
		status: "preparing_for_hermes",
		projections: projections(),
		providers: PROVIDERS,
		donors: DONORS,
		note: "Harness Glue prepares the Chronicle + Duct Tape runtime substrate that a future Hermes orchestrator can consume.",
	};
	if (flagBool(args, "json")) emitJson(payload);
	else {
		emitPretty("harness providers");
		for (const provider of PROVIDERS) emitPretty(`  - ${provider.id}: ${provider.status}`);
	}
	return 0;
}

function runDonors(args: ParsedArgs): number {
	const payload = {
		ok: true,
		command: "harness donors",
		status: "preparing_for_hermes",
		donors: DONORS,
		boundary: "This CLI is not Hermes. It exposes provider/session and activity rails for a future Hermes orchestrator.",
	};
	if (flagBool(args, "json")) emitJson(payload);
	else {
		emitPretty("harness donors");
		for (const donor of DONORS) emitPretty(`  - ${donor.id}: ${donor.role}`);
	}
	return 0;
}

function runStatus(args: ParsedArgs): number {
	const readyProviders = PROVIDERS.filter((provider) => provider.status === "ready");
	const pendingProviders = PROVIDERS.filter((provider) => provider.status !== "ready");
	const payload = {
		ok: true,
		command: "harness status",
		status: "preparing_for_hermes",
		boundary: "Harness Glue is usable preparation rail, not Hermes authority.",
		readiness: {
			usable_now: ["harness.providers", "harness.donors", "simulated dispatch", "tmux-backed long-running Codex/Claude workers", "lane-assigned sessions", "session context snapshots", "event log replay", "tool timeline replay", "session grep", "stop audit event"],
			pending_daemon_projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
			pending_provider_adapters: pendingProviders.map((provider) => provider.id),
		},
		providers: {
			ready: readyProviders.map((provider) => provider.id),
			pending: pendingProviders.map((provider) => ({ id: provider.id, status: provider.status, source: provider.source })),
		},
		donors: DONORS,
		next_actions: [
			"Use ema harness context --lane lane:<id> --json to recover assigned sessions, latest logs, and event context.",
			"Use ema harness grep --lane lane:<id> --query <text> --json to search session logs and Harness records.",
			"Back dispatch.registry/execution.registry/tool.timeline/chronicle.activity with daemon canonical events before real PTY adapters.",
			"Expose one unified Harness Glue vApp once daemon projections are readable from web.",
		],
	};
	if (flagBool(args, "json")) emitJson(payload);
	else {
		emitPretty("harness status");
		emitPretty(`  status: ${payload.status}`);
		emitPretty(`  ready providers: ${payload.providers.ready.join(", ") || "none"}`);
		emitPretty(`  pending daemon projections: ${payload.readiness.pending_daemon_projections.join(", ")}`);
	}
	return 0;
}


function runStart(args: ParsedArgs): number {
	const provider = flagString(args, "provider") ?? "simulated";
	if (provider !== "codex" && provider !== "claude-code") {
		emitError("ema harness start: --provider must be codex or claude-code for long-running workers");
		return 64;
	}
	const cwd = flagString(args, "cwd") ?? process.cwd();
	const prompt = flagString(args, "prompt") ?? "Continue EMA Harness Glue work. Orient, claim scope, verify, report, and keep running until blocked.";
	const name = flagString(args, "name") ?? `${provider}-worker`;
	const lane = flagString(args, "lane") ?? null;
	const actor = flagString(args, "actor") ?? (provider === "codex" ? "actor:codex" : "actor:claude-code");
	const executionId = `execution:harness:${stableId(`${provider}:${name}:${cwd}:${Date.now()}`)}`;
	const dispatchId = `dispatch:harness:${stableId(`${provider}:${prompt}:${Date.now()}`)}`;
	const session = sanitizeSession(`ema-${provider}-${name}-${stableId(executionId)}`);
	const command = providerCommand(provider, cwd, prompt);
	const record = {
		ok: true,
		command: "harness start",
		status: flagBool(args, "dry-run") ? "dry_run" : "running",
		daemon_authority: "pending_daemon_writer",
		backend: "file_backed_tmux_registry",
		provider,
		actor,
		lane,
		cwd,
		prompt_summary: summarize(prompt),
		dispatch: { id: dispatchId, status: flagBool(args, "dry-run") ? "planned" : "started" },
		execution: { id: executionId, status: flagBool(args, "dry-run") ? "planned" : "running", tmux_session: session },
		events: [
			{ type: "dispatch.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: lane, provider, actor_id: actor },
			{ type: "execution.started", dispatch_id: dispatchId, execution_id: executionId, lane_id: lane, provider, actor_id: actor },
		],
		paths: { registry: registryPath(executionId), event_log: eventLogPath(), lane_assignment: lane ? laneAssignmentPath(lane) : null },
		commands: {
			tmux_session: session,
			launch: command,
			context: `ema harness context --execution ${executionId} --json`,
			events: `ema harness events --execution ${executionId} --json`,
			grep: `ema harness grep --execution ${executionId} --query <text> --json`,
			log: `ema harness log --execution ${executionId} --json`,
			stop: `ema harness stop --execution ${executionId} --json`,
		},
		lane_assignment: lane ? { lane_id: lane, execution_id: executionId, session_id: session, actor_id: actor, provider } : null,
	};
	if (!flagBool(args, "dry-run")) {
		const created = spawnSync("tmux", ["new-session", "-d", "-s", session, "-x", "140", "-y", "40"], { encoding: "utf8" });
		if (created.status !== 0) {
			emitError(`ema harness start: tmux new-session failed: ${created.stderr || created.stdout}`);
			return 1;
		}
		const sent = spawnSync("tmux", ["send-keys", "-t", session, command, "Enter"], { encoding: "utf8" });
		if (sent.status !== 0) {
			emitError(`ema harness start: tmux send-keys failed: ${sent.stderr || sent.stdout}`);
			return 1;
		}
		if (provider === "claude-code") {
			spawnSync("tmux", ["send-keys", "-t", session, prompt, "Enter"], { encoding: "utf8" });
		}
		writeRecord(record);
		appendEvents(record.events);
		if (lane) upsertLaneAssignment(lane, record);
	}
	if (flagBool(args, "json")) emitJson(record);
	else emitPretty(`${provider} running in tmux session ${session}`);
	return 0;
}

function runList(args: ParsedArgs): number {
	const lane = flagString(args, "lane");
	let records = readRecords();
	if (lane) records = records.filter((record) => record.lane === lane || record.lane_assignment?.lane_id === lane);
	const payload = {
		ok: true,
		command: "harness list",
		backend: "file_backed_tmux_registry",
		daemon_authority: "pending_daemon_writer",
		lane: lane ?? null,
		lane_assignments: lane ? readLaneAssignment(lane) : readLaneAssignments(),
		executions: records.map((record) => enrichRecordStatus(record)),
	};
	if (flagBool(args, "json")) emitJson(payload);
	else for (const record of payload.executions) emitPretty(`${record.execution?.id ?? "execution:unknown"} ${record.provider ?? "unknown"} ${record.execution?.tmux_session ?? "no-session"} ${record.runtime?.tmux ?? "unknown"} ${record.status ?? "unknown"}`);
	return 0;
}

function runAssign(args: ParsedArgs): number {
	const lane = flagString(args, "lane");
	const execution = flagString(args, "execution");
	if (!lane || !execution) {
		emitError("ema harness assign: --lane and --execution are required");
		return 64;
	}
	const record = readRecord(execution);
	if (!record) {
		emitError(`ema harness assign: execution record not found: ${execution}`);
		return 1;
	}
	const updated = { ...record, lane, lane_assignment: { lane_id: lane, execution_id: execution, session_id: record.execution?.tmux_session ?? null, actor_id: record.actor ?? null, provider: record.provider ?? null } };
	const event = { type: "harness.session.assigned", execution_id: execution, lane_id: lane, provider: record.provider ?? null, actor_id: record.actor ?? null, tmux_session: record.execution?.tmux_session ?? null, recorded_at: new Date().toISOString() };
	if (!flagBool(args, "dry-run")) {
		writeRecord(updated);
		upsertLaneAssignment(lane, updated);
		appendEvents([event]);
	}
	const payload = { ok: true, command: "harness assign", status: flagBool(args, "dry-run") ? "dry_run" : "assigned", daemon_authority: "pending_daemon_writer", lane_id: lane, execution_id: execution, assignment: updated.lane_assignment, event };
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(`${execution} assigned to ${lane}`);
	return 0;
}

function runContext(args: ParsedArgs): number {
	const execution = flagString(args, "execution");
	const lane = flagString(args, "lane");
	const lines = Number(flagString(args, "lines") ?? "120");
	const records = recordsForSelector(execution, lane).map((record) => {
		const enriched = enrichRecordStatus(record);
		const session = enriched.execution?.tmux_session;
		return {
			...enriched,
			recent_output: session ? captureTmux(session, lines) : null,
			events: readEvents({ execution: enriched.execution?.id, lane: enriched.lane ?? enriched.lane_assignment?.lane_id ?? null }),
		};
	});
	const payload = {
		ok: true,
		command: "harness context",
		backend: "file_backed_tmux_registry",
		daemon_authority: "pending_daemon_writer",
		selector: { execution: execution ?? null, lane: lane ?? null },
		lane_assignment: lane ? readLaneAssignment(lane) : null,
		executions: records,
	};
	if (flagBool(args, "json")) emitJson(payload);
	else for (const record of records) emitPretty(`${record.execution?.id ?? "execution:unknown"} ${record.runtime?.tmux ?? "unknown"}
${record.recent_output?.output ?? ""}`);
	return 0;
}

function runEvents(args: ParsedArgs): number {
	const execution = flagString(args, "execution");
	const lane = flagString(args, "lane");
	const payload = { ok: true, command: "harness events", backend: "file_backed_event_log", daemon_authority: "pending_daemon_writer", selector: { execution: execution ?? null, lane: lane ?? null }, events: readEvents({ execution, lane }) };
	if (flagBool(args, "json")) emitJson(payload);
	else for (const event of payload.events) emitPretty(`${event.recorded_at ?? ""} ${event.type} ${event.execution_id ?? ""}`);
	return 0;
}

function runGrep(args: ParsedArgs): number {
	const query = flagString(args, "query") ?? flagString(args, "q");
	if (!query) {
		emitError("ema harness grep: --query is required");
		return 64;
	}
	const execution = flagString(args, "execution");
	const lane = flagString(args, "lane");
	const bundle = writeSearchBundle(recordsForSelector(execution, lane));
	const rg = spawnSync("rg", ["--json", query, bundle], { encoding: "utf8" });
	const matches = (rg.stdout || "")
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			try { return JSON.parse(line); } catch { return { type: "parse_error", raw: line }; }
		})
		.filter((entry) => entry.type === "match");
	const payload = { ok: rg.status === 0 || rg.status === 1, command: "harness grep", backend: "ripgrep_search_bundle", daemon_authority: "pending_daemon_writer", selector: { execution: execution ?? null, lane: lane ?? null }, query, bundle, matches };
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(matches.map((match) => match.data?.lines?.text ?? "").join(""));
	return payload.ok ? 0 : 1;
}

function runLog(args: ParsedArgs): number {
	const execution = flagString(args, "execution");
	if (!execution) {
		emitError("ema harness log: --execution is required");
		return 64;
	}
	const record = readRecord(execution);
	const session = flagString(args, "session") ?? record?.execution?.tmux_session;
	if (!session) {
		emitError(`ema harness log: no tmux session found for ${execution}`);
		return 1;
	}
	const captured = spawnSync("tmux", ["capture-pane", "-t", session, "-p", "-S", flagString(args, "lines") ? `-${flagString(args, "lines")}` : "-80"], { encoding: "utf8" });
	const payload = { ok: captured.status === 0, command: "harness log", execution_id: execution, tmux_session: session, output: captured.stdout, error: captured.stderr || null };
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(captured.stdout || captured.stderr || "");
	return captured.status === 0 ? 0 : 1;
}

async function runDispatch(args: ParsedArgs): Promise<number> {
	const provider = flagString(args, "provider") ?? "simulated";
	const found = PROVIDERS.find((candidate) => candidate.id === provider);
	if (!found) {
		emitError(`ema harness dispatch: unknown provider "${provider}"`);
		return 64;
	}
	const lane = flagString(args, "lane") ?? null;
	const cwd = flagString(args, "cwd") ?? process.cwd();
	const prompt = flagString(args, "prompt") ?? "";
	if (provider !== "simulated") {
		const pending = {
			ok: true,
			command: "harness dispatch",
			status: "pending_provider_adapter",
			provider,
			lane,
			cwd,
			prompt,
			required_capability: `${provider} PTY/SDK adapter`,
		};
		if (flagBool(args, "json")) emitJson(pending);
		else emitPretty(`${provider} adapter pending; simulated provider is ready`);
		return 0;
	}

	// L2 (humble-sketch lane:01KR0RQ6JK): when --provider simulated and the
	// daemon is reachable, drive the canonical 6-event chain through the
	// IPC arms. Fall back to the client-side timeline if the daemon is not
	// up — this keeps the offline path that unit tests exercise intact.
	const org = flagString(args, "org") ?? DEFAULT_ORG;
	const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
	const intent = prompt.length > 0 ? summarize(prompt) : "harness dispatch";
	const useDaemon = !flagBool(args, "no-daemon");
	if (useDaemon) {
		const daemonResult = await tryDaemonDispatch({
			org,
			actor,
			provider,
			intent,
			lane,
			cwd,
			prompt,
		});
		if (daemonResult.ok) {
			if (flagBool(args, "json")) emitJson(daemonResult.payload);
			else emitPretty(`execution: ${daemonResult.payload.execution.id}`);
			return 0;
		}
		if (daemonResult.fallback === false) {
			emitError(`ema harness dispatch: ${daemonResult.error}`);
			return 1;
		}
		// fall through to client-side timeline if the daemon was unreachable
	}

	const executionId = `execution:simulated:${stableId(`${lane ?? "no-lane"}:${cwd}:${prompt}`)}`;
	const events = timeline(executionId, lane, cwd, prompt);
	const payload = {
		ok: true,
		command: "harness dispatch",
		provider,
		status: "simulated_execution_completed",
		source: "client_side_fallback",
		projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
		dispatch: { id: `dispatch:simulated:${stableId(prompt || executionId)}`, lane, cwd, prompt },
		execution: { id: executionId, provider, status: "completed", lane, cwd },
		events,
	};
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(`execution: ${executionId}`);
	return 0;
}

interface DaemonDispatchSpec {
	org: string;
	actor: string;
	provider: string;
	intent: string;
	lane: string | null;
	cwd: string;
	prompt: string;
}

interface DaemonDispatchOk {
	ok: true;
	payload: {
		ok: true;
		command: string;
		provider: string;
		status: string;
		source: string;
		projections: string[];
		dispatch: { id: string; lane: string | null; cwd: string; prompt: string; intent: string };
		execution: { id: string; provider: string; status: string; lane: string | null; cwd: string };
		events: { type: string; event_id: string }[];
	};
}

interface DaemonDispatchErr {
	ok: false;
	fallback: boolean;
	error: string;
}

async function tryDaemonDispatch(spec: DaemonDispatchSpec): Promise<DaemonDispatchOk | DaemonDispatchErr> {
	let client: Awaited<ReturnType<typeof connect>> | null = null;
	try {
		client = await connect({ surface: "desktop" });
	} catch (err) {
		if (err instanceof DaemonUnreachableError) {
			return { ok: false, fallback: true, error: err.message };
		}
		return { ok: false, fallback: false, error: err instanceof Error ? err.message : String(err) };
	}

	try {
		const { org, actor, provider, intent, lane } = spec;
		const startResult = await client.command("dispatch.start", {
			org_id: org,
			actor_id: actor,
			intent,
			provider,
			lane_id: lane,
		});
		const startCheck = expectOk(startResult, "dispatch.start");
		if (startCheck) return { ok: false, fallback: false, error: startCheck };
		const dispatchId = (startResult as { resource?: string }).resource;
		const dispatchEventId = (startResult as { events?: string[] }).events?.[0] ?? "";
		if (!dispatchId) return { ok: false, fallback: false, error: "dispatch.start returned no resource id" };

		const execStart = await client.command("execution.start", {
			org_id: org,
			actor_id: actor,
			dispatch_id: dispatchId,
			exec_kind: "tool",
			name: "simulated.provider",
			provider,
		});
		const execStartCheck = expectOk(execStart, "execution.start");
		if (execStartCheck) return { ok: false, fallback: false, error: execStartCheck };
		const executionId = (execStart as { resource?: string }).resource;
		const execStartEventId = (execStart as { events?: string[] }).events?.[0] ?? "";
		if (!executionId)
			return { ok: false, fallback: false, error: "execution.start returned no resource id" };

		const toolInvoke = await client.command("tool.invoke", {
			org_id: org,
			actor_id: actor,
			dispatch_id: dispatchId,
			execution_id: executionId,
			tool_name: "simulated.provider",
			args_json: JSON.stringify({ prompt: spec.prompt, cwd: spec.cwd }),
			provider,
		});
		const toolInvokeCheck = expectOk(toolInvoke, "tool.invoke");
		if (toolInvokeCheck) return { ok: false, fallback: false, error: toolInvokeCheck };
		const toolInvokeEventId = (toolInvoke as { events?: string[] }).events?.[0] ?? "";

		const toolReturn = await client.command("tool.return", {
			org_id: org,
			actor_id: actor,
			dispatch_id: dispatchId,
			execution_id: executionId,
			tool_name: "simulated.provider",
			result_summary: "ok",
		});
		const toolReturnCheck = expectOk(toolReturn, "tool.return");
		if (toolReturnCheck) return { ok: false, fallback: false, error: toolReturnCheck };
		const toolReturnEventId = (toolReturn as { events?: string[] }).events?.[0] ?? "";

		const execEnd = await client.command("execution.end", {
			org_id: org,
			actor_id: actor,
			dispatch_id: dispatchId,
			execution_id: executionId,
			outcome: "ok",
			duration_ms: 1,
		});
		const execEndCheck = expectOk(execEnd, "execution.end");
		if (execEndCheck) return { ok: false, fallback: false, error: execEndCheck };
		const execEndEventId = (execEnd as { events?: string[] }).events?.[0] ?? "";

		const dispatchEnd = await client.command("dispatch.end", {
			org_id: org,
			actor_id: actor,
			dispatch_id: dispatchId,
			outcome: "ok",
			provider,
		});
		const dispatchEndCheck = expectOk(dispatchEnd, "dispatch.end");
		if (dispatchEndCheck) return { ok: false, fallback: false, error: dispatchEndCheck };
		const dispatchEndEventId = (dispatchEnd as { events?: string[] }).events?.[0] ?? "";

		return {
			ok: true,
			payload: {
				ok: true,
				command: "harness dispatch",
				provider,
				status: "simulated_execution_completed",
				source: "daemon_canonical",
				projections: ["dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"],
				dispatch: { id: dispatchId, lane, cwd: spec.cwd, prompt: spec.prompt, intent },
				execution: { id: executionId, provider, status: "completed", lane, cwd: spec.cwd },
				events: [
					{ type: "dispatch.started", event_id: dispatchEventId },
					{ type: "execution.started", event_id: execStartEventId },
					{ type: "tool.invoked", event_id: toolInvokeEventId },
					{ type: "tool.returned", event_id: toolReturnEventId },
					{ type: "execution.ended", event_id: execEndEventId },
					{ type: "dispatch.ended", event_id: dispatchEndEventId },
				],
			},
		};
	} catch (err) {
		return { ok: false, fallback: false, error: err instanceof Error ? err.message : String(err) };
	} finally {
		client?.close();
	}
}

function expectOk(result: CommandResult, op: string): string | null {
	if (result.ok === true) return null;
	const error = result.error;
	return `${op}: ${error.class}: ${error.message}`;
}

function runStream(args: ParsedArgs): number {
	const execution = flagString(args, "execution");
	if (!execution) {
		emitError("ema harness stream: --execution is required");
		return 64;
	}
	const lane = flagString(args, "lane") ?? null;
	const payload = {
		ok: true,
		command: "harness stream",
		execution_id: execution,
		projection: "tool.timeline",
		timeline: timeline(execution, lane, flagString(args, "cwd") ?? process.cwd(), flagString(args, "prompt") ?? "stream replay"),
	};
	if (flagBool(args, "json")) emitJson(payload);
	else for (const event of payload.timeline) emitPretty(`${event.type} ${event.execution_id}`);
	return 0;
}

function runStop(args: ParsedArgs): number {
	const execution = flagString(args, "execution");
	if (!execution) {
		emitError("ema harness stop: --execution is required");
		return 64;
	}
	const record = readRecord(execution);
	const session = flagString(args, "session") ?? record?.execution?.tmux_session;
	let tmux_status: "not_found" | "killed" | "not_requested" | "failed" = "not_found";
	let tmux_error: string | null = null;
	if (session && !flagBool(args, "record-only")) {
		const killed = spawnSync("tmux", ["kill-session", "-t", session], { encoding: "utf8" });
		tmux_status = killed.status === 0 ? "killed" : "failed";
		tmux_error = killed.status === 0 ? null : killed.stderr || killed.stdout || "tmux kill-session failed";
	} else if (session) tmux_status = "not_requested";
	const payload = {
		ok: tmux_status !== "failed",
		command: "harness stop",
		execution_id: execution,
		status: "stop_requested",
		tmux_session: session ?? null,
		tmux_status,
		tmux_error,
		event: { type: "execution.stop_requested", execution_id: execution, actor_id: flagString(args, "actor") ?? "actor:harness-glue" },
	};
	if (record) {
		const updated = { ...record, status: "stop_requested", execution: { ...record.execution, status: "stop_requested" }, stop: payload };
		writeRecord(updated);
	}
	appendEvents([{ ...payload.event, tmux_session: session ?? null, recorded_at: new Date().toISOString() }]);
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(`stop requested: ${execution}`);
	return payload.ok ? 0 : 1;
}

function runSearch(args: ParsedArgs): number {
	return runGrep(args);
}

function projections(): string[] {
	return ["harness.providers", "dispatch.registry", "execution.registry", "tool.timeline", "chronicle.activity"];
}

function timeline(executionId: string, lane: string | null, cwd: string, prompt: string) {
	const base = {
		execution_id: executionId,
		lane_id: lane,
		cwd,
		provider: "simulated",
	};
	return [
		{ ...base, type: "dispatch.started", prompt },
		{ ...base, type: "execution.started" },
		{ ...base, type: "tool.returned", tool: "simulated.provider", result_summary: "ok" },
		{ ...base, type: "execution.ended", status: "completed" },
		{ ...base, type: "dispatch.ended", status: "completed" },
	];
}


// Harness file-backed registry lives at a stable location independent of cwd
// so workers started from one directory remain visible from another. Resolution
// order: EMA_HARNESS_ROOT (explicit override) -> EMA_HOME/.ema-dev/harness-glue
// (set by the ema wrapper) -> cwd/.ema-dev/harness-glue (backwards-compat
// fallback for in-tree runs without the wrapper).
function harnessGlueRoot(): string {
	const override = process.env.EMA_HARNESS_ROOT?.trim();
	if (override) return override;
	const home = process.env.EMA_HOME?.trim();
	if (home) return join(home, ".ema-dev", "harness-glue");
	return join(process.cwd(), ".ema-dev", "harness-glue");
}

function registryDir(): string {
	return join(harnessGlueRoot(), "executions");
}

function registryPath(executionId: string): string {
	return join(registryDir(), `${sanitizeFile(executionId)}.json`);
}

function writeRecord(record: any): void {
	mkdirSync(registryDir(), { recursive: true });
	writeFileSync(registryPath(record.execution.id), JSON.stringify({ ...record, updated_at: new Date().toISOString() }, null, 2) + "\n");
}

function readRecord(executionId: string): any | null {
	const path = registryPath(executionId);
	if (!existsSync(path)) return null;
	return JSON.parse(readFileSync(path, "utf8"));
}

function readRecords(): any[] {
	const dir = registryDir();
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((file) => file.endsWith(".json"))
		.map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
}

function laneAssignmentsDir(): string {
	return join(harnessGlueRoot(), "lane-sessions");
}

function laneAssignmentPath(lane: string): string {
	return join(laneAssignmentsDir(), `${sanitizeFile(lane)}.json`);
}

function eventLogPath(): string {
	return join(harnessGlueRoot(), "events.ndjson");
}

function searchDir(): string {
	return join(harnessGlueRoot(), "search-bundles");
}

function upsertLaneAssignment(lane: string, record: any): void {
	mkdirSync(laneAssignmentsDir(), { recursive: true });
	const existing = readLaneAssignment(lane);
	const sessions = (existing?.sessions ?? []).filter((session: any) => session.execution_id !== record.execution?.id);
	sessions.unshift({
		execution_id: record.execution?.id,
		dispatch_id: record.dispatch?.id,
		tmux_session: record.execution?.tmux_session,
		provider: record.provider,
		actor: record.actor,
		status: record.execution?.status ?? record.status,
		cwd: record.cwd,
		prompt_summary: record.prompt_summary,
		updated_at: new Date().toISOString(),
	});
	writeFileSync(laneAssignmentPath(lane), JSON.stringify({ lane_id: lane, backend: "file_backed_lane_session_registry", daemon_authority: "pending_daemon_writer", sessions }, null, 2) + "\n");
}

function readLaneAssignment(lane: string): any | null {
	const path = laneAssignmentPath(lane);
	if (!existsSync(path)) return null;
	return JSON.parse(readFileSync(path, "utf8"));
}

function readLaneAssignments(): any[] {
	const dir = laneAssignmentsDir();
	if (!existsSync(dir)) return [];
	return readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
}

function appendEvents(events: any[]): void {
	mkdirSync(harnessGlueRoot(), { recursive: true });
	const now = new Date().toISOString();
	const lines = events.map((event) => JSON.stringify({ recorded_at: event.recorded_at ?? now, ...event })).join("\n");
	if (lines) writeFileSync(eventLogPath(), lines + "\n", { flag: "a" });
}

function readEvents(selector: { execution?: string | null; lane?: string | null }): any[] {
	const path = eventLogPath();
	let events: any[] = [];
	if (existsSync(path)) {
		events = readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => {
			try { return JSON.parse(line); } catch { return { type: "unparsed", raw: line }; }
		});
	}
	for (const record of readRecords()) {
		for (const event of record.events ?? []) events.push({ recorded_at: record.updated_at ?? null, ...event });
	}
	if (selector.execution) events = events.filter((event) => event.execution_id === selector.execution);
	if (selector.lane) events = events.filter((event) => event.lane_id === selector.lane);
	return events;
}

function recordsForSelector(execution?: string | null, lane?: string | null): any[] {
	if (execution) {
		const record = readRecord(execution);
		return record ? [record] : [];
	}
	let records = readRecords();
	if (lane) records = records.filter((record) => record.lane === lane || record.lane_assignment?.lane_id === lane);
	return records;
}

function enrichRecordStatus(record: any): any {
	const session = record.execution?.tmux_session;
	const tmux = session ? tmuxHasSession(session) : false;
	return { ...record, runtime: { tmux: tmux ? "running" : "not_found", checked_at: new Date().toISOString() } };
}

function tmuxHasSession(session: string): boolean {
	return spawnSync("tmux", ["has-session", "-t", session], { encoding: "utf8" }).status === 0;
}

function captureTmux(session: string, lines: number): any {
	const captured = spawnSync("tmux", ["capture-pane", "-t", session, "-p", "-S", `-${lines}`], { encoding: "utf8" });
	return { ok: captured.status === 0, tmux_session: session, output: captured.stdout, error: captured.stderr || null };
}

function writeSearchBundle(records: any[]): string {
	mkdirSync(searchDir(), { recursive: true });
	const path = join(searchDir(), `bundle-${Date.now()}.txt`);
	const chunks: string[] = [];
	chunks.push(`# Harness Glue search bundle ${new Date().toISOString()}\n`);
	for (const record of records.length ? records : readRecords()) {
		chunks.push(`\n--- registry ${record.execution?.id ?? "unknown"} ---\n${JSON.stringify(record, null, 2)}\n`);
		for (const event of readEvents({ execution: record.execution?.id, lane: record.lane })) chunks.push(`event ${JSON.stringify(event)}\n`);
		const session = record.execution?.tmux_session;
		if (session) chunks.push(`\n--- tmux ${session} ---\n${captureTmux(session, 500).output}\n`);
	}
	writeFileSync(path, chunks.join(""));
	return path;
}

function providerCommand(provider: string, cwd: string, prompt: string): string {
	const quotedCwd = shellQuote(cwd);
	const quotedPrompt = shellQuote(prompt);
	if (provider === "codex") return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && codex exec --full-auto ${quotedPrompt}`;
	return `cd ${quotedCwd} && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH" && claude`;
}

function sanitizeSession(input: string): string {
	return input.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 80);
}

function sanitizeFile(input: string): string {
	return input.replace(/[^a-zA-Z0-9_.-]+/g, "_");
}

function summarize(input: string): string {
	return input.length > 180 ? `${input.slice(0, 177)}...` : input;
}

function shellQuote(input: string): string {
	return `'${input.replace(/'/g, `'"'"'`)}'`;
}

function stableId(input: string): string {
	let hash = 2166136261;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36).padStart(7, "0");
}
