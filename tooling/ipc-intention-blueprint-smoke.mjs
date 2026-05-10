#!/usr/bin/env node
// Smoke the Sprint 5 daemon IPC commands that intentionally move review and
// mining state out of file fallback paths.

import WebSocket from "ws";

const URL = process.env.EMA_IPC_URL ?? "ws://127.0.0.1:49555/";
const TIMEOUT_MS = 8000;
const ORG_ID = "org:01J00000000000000000000001";
const ACTOR_ID = "actor:ipc-smoke";
const RUN = Date.now().toString(36);

const ws = new WebSocket(URL);
const pending = new Map();
const projections = [];
let connected = false;

const timer = setTimeout(() => fail("timeout"), TIMEOUT_MS);

function fail(reason) {
	console.error(`ipc-intention-blueprint-smoke: FAIL (${reason})`);
	clearTimeout(timer);
	try {
		ws.close();
	} catch {
		// ignore
	}
	process.exit(1);
}

function send(message) {
	ws.send(JSON.stringify(message));
}

function command(op, args = {}) {
	return new Promise((resolve, reject) => {
		const id = `msg-${RUN}-${pending.size + 1}`;
		pending.set(id, { op, resolve, reject });
		send({ v: 0, id, type: "command", op, args });
	});
}

function subscribe(channel) {
	send({ v: 0, id: `sub-${channel}-${RUN}`, type: "subscribe", channel });
}

function assertOk(name, result) {
	if (!result.ok) {
		fail(`${name} rejected: ${JSON.stringify(result.error)}`);
	}
	if (!Array.isArray(result.events) || result.events.length === 0) {
		fail(`${name} did not return event ids`);
	}
}

ws.on("open", () => {
	send({ v: 0, id: `hello-${RUN}`, type: "hello", surface: "desktop", device_id: null });
});

ws.on("message", async (raw) => {
	let message;
	try {
		message = JSON.parse(raw.toString());
	} catch {
		fail("non-json frame");
	}

	if (message.type === "hello" && !connected) {
		connected = true;
		subscribe("intention.review");

		const intentId = `intent:ipc-smoke-${RUN}`;
		assertOk(
			"intention.review.upsert",
			await command("intention.review.upsert", {
				org_id: ORG_ID,
				actor_id: ACTOR_ID,
				intent_id: intentId,
				state: "accepted",
				reviewer_actor_id: ACTOR_ID,
				reason: "ipc smoke",
				evidence_ref: "tooling/ipc-intention-blueprint-smoke.mjs",
				reviewed_at: new Date().toISOString(),
			}),
		);
		assertOk(
			"intention.backfeed.start",
			await command("intention.backfeed.start", {
				org_id: ORG_ID,
				actor_id: ACTOR_ID,
				intent_id: intentId,
				destination: "queue",
				target_project: "proslync-app-ios-final",
				approve_token: "reviewed",
				requester_actor_id: ACTOR_ID,
				requested_at: new Date().toISOString(),
			}),
		);
		assertOk(
			"intention.backfeed.finish",
			await command("intention.backfeed.finish", {
				org_id: ORG_ID,
				actor_id: ACTOR_ID,
				intent_id: intentId,
				destination: "queue",
				target_project: "proslync-app-ios-final",
				outcome: "completed",
				resource_id: `queue_item:ipc-smoke-${RUN}`,
				completed_at: new Date().toISOString(),
			}),
		);
		assertOk(
			"blueprint.mine.requested",
			await command("blueprint.mine.requested", {
				org_id: ORG_ID,
				actor_id: ACTOR_ID,
				transcript_path: "tooling/ipc-intention-blueprint-smoke.mjs",
				transcript_node_id: `blueprint_mine:${RUN}`,
				section_count: 1,
			}),
		);

		setTimeout(() => {
			const sawIntentionProjection = projections.some((projection) => {
				if (projection.name !== "intention.review") return false;
				return Array.isArray(projection.data?.reviews)
					&& projection.data.reviews.some((item) => item.intent_id === intentId);
			});
			if (!sawIntentionProjection) fail("intention.review projection did not include smoke review");
			console.log("ipc-intention-blueprint-smoke: OK");
			clearTimeout(timer);
			ws.close();
			process.exit(0);
		}, 250);
		return;
	}

	if (message.type === "projection") {
		projections.push(message);
		return;
	}

	if (message.type === "command_result") {
		const pendingCommand = pending.get(message.in_reply_to);
		if (!pendingCommand) return;
		pending.delete(message.in_reply_to);
		pendingCommand.resolve(message);
	}
});

ws.on("error", (error) => fail(`ws error: ${error.message}`));
ws.on("close", () => {
	if (pending.size > 0) fail("socket closed with pending commands");
});
