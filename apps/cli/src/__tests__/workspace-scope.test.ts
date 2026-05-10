import assert from "node:assert/strict";
import test from "node:test";

import { parseProjectMetadata } from "../workspace-scope.js";

test("parseProjectMetadata accepts wiki comments before YAML frontmatter", () => {
	const meta = parseProjectMetadata(`<!-- wiki-id: ema:project -->
---
type: project
name: EMA
org_id: org:01J00000000000000000000012
space_id: space:01J00000000000000000000013
project_id: project:01KQD8D0G9000XHA2KS36VYXX3
active_build: ../../Active\\ builds/EMA-0.0.6/
---

# EMA
`);

	assert.equal(meta.name, "EMA");
	assert.equal(meta.project_id, "project:01KQD8D0G9000XHA2KS36VYXX3");
	assert.equal(meta.active_build, "../../Active\\ builds/EMA-0.0.6/");
});
