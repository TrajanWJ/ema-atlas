// Auto-grow Blueprint agent. Subscribes to event_trail and collab.document
// projection streams; when prose contains a known pattern, emits the matching
// blueprint.* canonical event via the daemon WS.

import { createHash } from "node:crypto";
import WebSocket from "ws";
import { detectAll, type Detection } from "./detectors.js";
import { GrowerClient } from "./emit.js";

const DAEMON_URL = process.env.EMA_IPC_URL ?? "ws://127.0.0.1:49555";
const DEFAULT_ORG = process.env.EMA_ORG_ID ?? "org:01J00000000000000000000001";
const BLUEPRINT_DOC_ID = process.env.EMA_BLUEPRINT_DOC_ID;
const FINGERPRINT_TTL_MS = 60_000;
const RECONNECT_INITIAL_MS = 500;
const RECONNECT_MAX_MS = 10_000;

const fingerprints = new Map<string, number>();

function fingerprint(line: string): string {
	return createHash("sha256").update(line).digest("hex").slice(0, 16);
}

function shouldEmit(line: string): boolean {
	const fp = fingerprint(line);
	const now = Date.now();
	pruneFingerprints(now);
	if (fingerprints.has(fp)) return false;
	fingerprints.set(fp, now);
	return true;
}

function pruneFingerprints(now: number): void {
	for (const [key, ts] of fingerprints) {
		if (now - ts > FINGERPRINT_TTL_MS) fingerprints.delete(key);
	}
}

async function dispatch(client: GrowerClient, detection: Detection): Promise<void> {
	if (!shouldEmit(detection.line)) return;
	console.log(`[grower] detected ${detection.pattern}: ${detection.line.slice(0, 80)}`);
	try {
		switch (detection.pattern) {
			case "aspiration": {
				const r = await client.emitAspiration(detection.line);
				if (r.ok && r.resource) console.log(`[grower] + aspiration ${r.resource}`);
				break;
			}
			case "decision": {
				const r = await client.emitDecision(detection.match, detection.line);
				if (r.ok && r.resource) console.log(`[grower] + decision ${r.resource}`);
				break;
			}
			case "gac": {
				const r = await client.emitGac(detection.match);
				if (r && r.ok && r.resource) console.log(`[grower] + gac ${r.resource}`);
				break;
			}
			case "blocker": {
				const r = await client.emitBlocker(detection.match);
				if (r.ok && r.resource) console.log(`[grower] + blocker ${r.resource}`);
				break;
			}
		}
	} catch (err) {
		console.error("[grower] emit error:", err instanceof Error ? err.message : err);
	}
}

interface ProjectionEnvelope {
	v: 0;
	type: string;
	name?: string;
	data?: unknown;
}

interface EventRow {
	id?: string;
	kind?: string;
	label?: string;
	ts?: string;
	payload_json?: string;
}

function extractTextFromEvent(row: EventRow): string {
	const parts: string[] = [];
	if (row.label) parts.push(row.label);
	if (row.payload_json) {
		try {
			const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
			for (const key of ["body", "title", "scope", "goal", "next", "description", "why"]) {
				const value = payload[key];
				if (typeof value === "string" && value.length > 0) parts.push(value);
			}
		} catch {
			// ignore
		}
	}
	return parts.join("\n");
}

function extractTextFromCollab(data: unknown): string {
	const obj = data as { text?: unknown; title?: unknown };
	const parts: string[] = [];
	if (typeof obj?.text === "string") parts.push(obj.text);
	if (typeof obj?.title === "string") parts.push(obj.title);
	return parts.join("\n");
}

async function subscribeProjections(
	client: GrowerClient,
	socket: WebSocket,
): Promise<void> {
	const subscribe = (channel: string): void => {
		socket.send(
			JSON.stringify({
				v: 0,
				id: `sub-${channel}-${Date.now()}`,
				type: "subscribe",
				channel,
			}),
		);
	};
	subscribe("event_trail");
	subscribe("collab.document");

	socket.on("message", async (raw) => {
		try {
			const msg = JSON.parse(raw.toString()) as ProjectionEnvelope;
			if (msg.type !== "projection") return;
			if (msg.name === "event_trail") {
				const data = msg.data as { events?: EventRow[] } | undefined;
				const events = data?.events ?? [];
				const recent = events.slice(-3);
				for (const event of recent) {
					const text = extractTextFromEvent(event);
					if (text.length === 0) continue;
					for (const detection of detectAll(text)) {
						await dispatch(client, detection);
					}
				}
			} else if (msg.name === "collab.document") {
				const text = extractTextFromCollab(msg.data);
				if (text.length === 0) return;
				for (const detection of detectAll(text)) {
					await dispatch(client, detection);
				}
			}
		} catch (err) {
			console.error("[grower] subscribe handler error:", err);
		}
	});
}

async function runOnce(): Promise<void> {
	const client = new GrowerClient({
		orgId: DEFAULT_ORG,
		daemonUrl: DAEMON_URL,
		blueprintDocId: BLUEPRINT_DOC_ID,
	});
	await client.connect();
	console.log(`[grower] connected ${DAEMON_URL} (org=${DEFAULT_ORG})`);
	if (!BLUEPRINT_DOC_ID) {
		console.warn(
			"[grower] EMA_BLUEPRINT_DOC_ID not set — GAC detections will be skipped",
		);
	}

	const observer = new WebSocket(DAEMON_URL);
	await new Promise<void>((resolve, reject) => {
		observer.once("open", () => resolve());
		observer.once("error", reject);
	});
	observer.send(
		JSON.stringify({
			v: 0,
			id: `hello-${Date.now()}`,
			type: "hello",
			surface: "agent-observer",
		}),
	);
	await subscribeProjections(client, observer);

	await new Promise<void>((resolve) => {
		observer.on("close", () => {
			console.log("[grower] observer socket closed");
			resolve();
		});
	});

	client.close();
}

async function main(): Promise<void> {
	let backoff = RECONNECT_INITIAL_MS;
	while (true) {
		try {
			await runOnce();
		} catch (err) {
			console.error("[grower] crashed:", err instanceof Error ? err.message : err);
		}
		console.log(`[grower] reconnecting in ${backoff}ms`);
		await new Promise((resolve) => setTimeout(resolve, backoff));
		backoff = Math.min(backoff * 2, RECONNECT_MAX_MS);
	}
}

main().catch((err) => {
	console.error("[grower] fatal:", err);
	process.exit(1);
});
