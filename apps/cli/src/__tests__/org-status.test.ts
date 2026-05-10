import assert from "node:assert/strict";
import test from "node:test";

import { orgStatusFromTopbar } from "../commands/org.js";

test("orgStatusFromTopbar returns host doctrine and conflict strategies for a known org", () => {
	const status = orgStatusFromTopbar(
		{
			orgs: [
				{ id: "org:one", name: "One" },
				{ id: "org:two", name: "Two" },
			],
			current_org: { id: "org:one", name: "One" },
		},
		"org:two",
	);

	assert.equal(status.ok, true);
	assert.equal(status.org?.id, "org:two");
	assert.equal(status.host_set.required_min, 1);
	assert.equal(status.entity_classes.some((row) => row.conflict_strategy === "CRDT prose"), true);
	assert.equal(status.entity_classes.some((row) => row.entity_class === "Lane claims"), true);
});

test("orgStatusFromTopbar reports unknown orgs without inventing state", () => {
	const status = orgStatusFromTopbar(
		{ orgs: [{ id: "org:one", name: "One" }] },
		"org:missing",
	);

	assert.equal(status.ok, false);
	assert.equal(status.org, null);
	assert.equal(status.error, "unknown_org");
});
