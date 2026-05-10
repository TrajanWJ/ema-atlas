import { describe, expect, it } from "vitest";
import { APP_LABELS } from "../../src/lib/constants";
import { parseUrlState } from "../../src/lib/url-nav";

describe("Active builds vApp identity", () => {
	it("keeps git-ema as the compatibility id while exposing the Active builds name", () => {
		expect(APP_LABELS["git-ema"]).toBe("Active builds");
	});

	it("accepts active-builds as a URL alias for the legacy git-ema app id", () => {
		const state = parseUrlState("vapp=active-builds&test=1");

		expect(state.vapp).toBe("git-ema");
		expect(state.test).toBe(true);
	});
});
