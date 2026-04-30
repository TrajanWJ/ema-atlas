import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { EMA_ACTIVE_BUILD } from "../workspace-state.js";

type PeerRecord = {
	readonly id: string;
	readonly host: string;
	readonly user?: string | null;
	readonly workspace?: string | null;
	readonly port?: string | null;
	readonly added_at: string;
};

type PeerCheck = {
	readonly name: string;
	readonly ok: boolean;
	readonly detail: string;
	readonly optional?: boolean;
};

const REGISTRY_PATH = join(EMA_ACTIVE_BUILD, ".ema", "peers.json");

export function runPeer(args: ParsedArgs): number {
	const verb = args.positional[0] ?? "doctor";
	if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runPeerHelp(args);
	if (verb === "add") return runAdd(args);
	if (verb === "doctor") return runDoctor(args);
	if (verb === "tunnel") return runTunnel(args);
	if (verb === "dispatch") return runDispatch(args);
	if (verb === "sync-runtime" || verb === "sudo-check") return runPending(args, verb);
	emitError(`ema peer: unknown subcommand "${verb}" (expected: add | doctor | tunnel | dispatch | sync-runtime | sudo-check)`);
	return 64;
}

function runPeerHelp(args: ParsedArgs): number {
	const commands = [
		{ verb: "add", summary: "Register a trusted dev peer locally before daemon-backed peer registry." },
		{ verb: "doctor", summary: "Check SSH/local reachability and runtime prerequisites." },
		{ verb: "tunnel create", summary: "Describe an SSH port-forward rail for a trusted peer." },
		{ verb: "dispatch", summary: "Describe remote Harness Glue dispatch over SSH rail." },
		{ verb: "sync-runtime", summary: "Prepare runtime sync contract for peer daemon parity." },
		{ verb: "sudo-check", summary: "Check explicit grant/sudo readiness without ambient control." },
	];
	if (flagBool(args, "json")) {
		emitJson({ noun: "peer", status: "local_registry_first", commands, registry: REGISTRY_PATH });
		return 0;
	}
	emitPretty("ema peer — trusted-dev peer execution rail");
	for (const command of commands) emitPretty(`  ${command.verb.padEnd(12)} ${command.summary}`);
	return 0;
}

function runAdd(args: ParsedArgs): number {
	const id = flagString(args, "id") ?? flagString(args, "name");
	const host = flagString(args, "host");
	if (!id || !host) {
		emitError("ema peer add: --id and --host are required");
		return 64;
	}
	const peers = loadPeers().filter((peer) => peer.id !== id);
	const record: PeerRecord = {
		id,
		host,
		user: flagString(args, "user") ?? null,
		workspace: flagString(args, "workspace") ?? null,
		port: flagString(args, "port") ?? null,
		added_at: new Date().toISOString(),
	};
	peers.push(record);
	savePeers(peers);
	if (flagBool(args, "json")) emitJson({ ok: true, command: "peer add", registry: REGISTRY_PATH, peer: record });
	else emitPretty(`peer registered: ${id}`);
	return 0;
}

function runDoctor(args: ParsedArgs): number {
	const id = flagString(args, "peer") ?? flagString(args, "id") ?? "local";
	const peer = id === "local" ? localPeer() : loadPeers().find((candidate) => candidate.id === id) ?? null;
	if (!peer) {
		emitError(`ema peer doctor: unknown peer "${id}"`);
		return 64;
	}
	const checks = id === "local" ? localChecks() : remoteChecks(peer);
	const ok = checks.every((check) => check.ok || check.optional === true);
	const payload = { ok, command: "peer doctor", rail: "ssh", peer, checks };
	if (flagBool(args, "json")) emitJson(payload);
	else {
		emitPretty(`peer: ${peer.id}`);
		for (const check of checks) emitPretty(`  ${check.ok ? "ok" : "missing"} ${check.name}: ${check.detail}`);
	}
	return ok ? 0 : 1;
}

function runTunnel(args: ParsedArgs): number {
	const action = args.positional[1] ?? "create";
	if (action !== "create") {
		emitError(`ema peer tunnel: unknown action "${action}" (expected: create)`);
		return 64;
	}
	const peer = flagString(args, "peer") ?? "local";
	const localPort = flagString(args, "local-port") ?? "49555";
	const remotePort = flagString(args, "remote-port") ?? "49555";
	const payload = {
		ok: true,
		command: "peer tunnel create",
		peer,
		rail: "ssh",
		status: peer === "local" ? "local_noop" : "planned",
		ssh_command: peer === "local" ? null : `ssh -N -L ${localPort}:127.0.0.1:${remotePort} ${peer}`,
		audit: { actor: flagString(args, "actor") ?? "actor:codex", scope: "ema-daemon-port-forward", ttl: flagString(args, "ttl") ?? "1h" },
	};
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(payload.ssh_command ?? "local peer tunnel is a no-op");
	return 0;
}

function runDispatch(args: ParsedArgs): number {
	const peer = flagString(args, "peer") ?? "local";
	const provider = flagString(args, "provider") ?? "simulated";
	const prompt = flagString(args, "prompt") ?? "remote dispatch";
	const payload = {
		ok: true,
		command: "peer dispatch",
		peer,
		rail: peer === "local" ? "local" : "ssh",
		provider,
		prompt,
		status: peer === "local" && provider === "simulated" ? "ready" : "planned_remote_dispatch",
		next_cli: peer === "local"
			? `ema harness dispatch --provider ${provider} --prompt "${prompt}" --json`
			: `ssh ${peer} 'cd <ema-workspace> && pnpm cli harness dispatch --provider ${provider} --prompt "${prompt}" --json'`,
		audit_required: { actor: flagString(args, "actor") ?? "actor:codex", device: peer, scope: "harness-dispatch", ttl: flagString(args, "ttl") ?? "1h" },
	};
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(payload.next_cli);
	return 0;
}

function runPending(args: ParsedArgs, verb: string): number {
	const payload = {
		ok: true,
		command: `peer ${verb}`,
		status: "pending_peer_daemon_registry",
		rail: "ssh_first_iroh_later",
		audit_required: { actor: flagString(args, "actor") ?? "actor:codex", scope: verb, ttl: flagString(args, "ttl") ?? "1h" },
	};
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(`${verb}: pending peer daemon registry`);
	return 0;
}

function localPeer(): PeerRecord {
	return { id: "local", host: "127.0.0.1", workspace: EMA_ACTIVE_BUILD, added_at: "builtin" };
}

function localChecks(): PeerCheck[] {
	return [
		commandCheck("node", ["--version"]),
		commandCheck("pnpm", ["--version"]),
		commandCheck("gleam", ["--version"]),
		{ name: "workspace", ok: existsSync(EMA_ACTIVE_BUILD), detail: EMA_ACTIVE_BUILD },
		{ name: "daemon_port", ok: true, optional: true, detail: "49555 expected; use ema status --json for live handshake" },
		{ name: "web_port", ok: true, optional: true, detail: "5173 expected; browser/web verification is separate" },
	];
}

function remoteChecks(peer: PeerRecord): PeerCheck[] {
	return [
		{ name: "ssh", ok: true, optional: true, detail: `run: ssh ${peer.host} 'echo ok'` },
		{ name: "workspace", ok: Boolean(peer.workspace), detail: peer.workspace ?? "missing --workspace in peer registry" },
		{ name: "node", ok: true, optional: true, detail: "checked remotely by future daemon rail" },
		{ name: "pnpm", ok: true, optional: true, detail: "checked remotely by future daemon rail" },
		{ name: "gleam", ok: true, optional: true, detail: "checked remotely by future daemon rail" },
	];
}

function commandCheck(name: string, args: string[]): PeerCheck {
	try {
		const detail = execFileSync(name, args, { encoding: "utf8", timeout: 5000 }).trim();
		return { name, ok: true, detail };
	} catch (err) {
		return { name, ok: false, detail: err instanceof Error ? err.message : String(err) };
	}
}

function loadPeers(): PeerRecord[] {
	if (!existsSync(REGISTRY_PATH)) return [];
	try {
		const parsed = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as { peers?: PeerRecord[] };
		return Array.isArray(parsed.peers) ? parsed.peers : [];
	} catch {
		return [];
	}
}

function savePeers(peers: PeerRecord[]): void {
	if (!existsSync(dirname(REGISTRY_PATH))) execFileSync("mkdir", ["-p", dirname(REGISTRY_PATH)]);
	writeFileSync(REGISTRY_PATH, `${JSON.stringify({ peers }, null, 2)}\n`);
}
