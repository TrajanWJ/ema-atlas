import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../args.js";
import { problemShowId, problemShowJsonPayload } from "../commands/problem.js";
import { queueShowItemId } from "../commands/queue.js";

test("queue show accepts a positional queue item id", () => {
	const args = parseArgs(["queue", "show", "queue_item:abc", "--json"]);
	assert.equal(queueShowItemId(args), "queue_item:abc");
});

test("problem show accepts a positional problem id", () => {
	const args = parseArgs(["problem", "show", "problem:abc", "--json"]);
	assert.equal(problemShowId(args), "problem:abc");
});

test("explicit show id flags still win over positional ids", () => {
	assert.equal(
		queueShowItemId(parseArgs(["queue", "show", "queue_item:positional", "--queue-item", "queue_item:flag"])),
		"queue_item:flag",
	);
	assert.equal(
		problemShowId(parseArgs(["problem", "show", "problem:positional", "--problem", "problem:flag"])),
		"problem:flag",
	);
});

test("problem show JSON reports not_found consistently", () => {
	const payload = problemShowJsonPayload("problem:missing", {
		problems: [],
		solutions: [],
		links: [],
	});
	assert.equal(payload.ok, false);
	assert.equal(payload.problem, null);
	assert.equal(payload.error?.class, "not_found");
});
