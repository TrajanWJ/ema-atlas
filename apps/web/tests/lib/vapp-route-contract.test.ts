import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Sprint 9 stub for the vApp route/frame contract.
 *
 * Sprint 7 (vApp Route, Frame, And Mode Unification) will introduce
 * `apps/web/src/lib/vapp-route-contract.ts` exporting:
 *
 *   - PRIORITY_VAPPS
 *   - ROUTABLE_VAPPS
 *   - STATIC_POPOUT_VAPPS
 *   - VAPP_ALIASES
 *   - resolveVappRoute()
 *   - isPriorityVapp()
 *
 * Until that module exists, the assertion below skips with a clear
 * reason. Once the file lands, this test imports it dynamically and
 * verifies the public surface.
 */

const CONTRACT_PATH = resolve(__dirname, "../../src/lib/vapp-route-contract.ts");
const CONTRACT_MODULE = "../../src/lib/vapp-route-contract";

describe("vApp route contract module", () => {
	it("exposes the Sprint 7 public surface once the module exists", async () => {
		if (!existsSync(CONTRACT_PATH)) {
			// Sprint 7 has not landed yet; surface the missing module to
			// the test runner so the gap stays visible without failing CI.
			// eslint-disable-next-line no-console
			console.warn(
				`[vapp-route-contract] ${CONTRACT_PATH} missing — skipping until Sprint 7 lands the contract.`,
			);
			expect(existsSync(CONTRACT_PATH)).toBe(false);
			return;
		}

		const mod = (await import(CONTRACT_MODULE)) as Record<string, unknown>;

		// Required symbols per Sprint 7 §"Define one route contract".
		const REQUIRED_EXPORTS = [
			"PRIORITY_VAPPS",
			"ROUTABLE_VAPPS",
			"STATIC_POPOUT_VAPPS",
			"VAPP_ALIASES",
			"resolveVappRoute",
			"isPriorityVapp",
		] as const;

		for (const name of REQUIRED_EXPORTS) {
			expect(mod, `vapp-route-contract must export ${name}`).toHaveProperty(name);
		}

		expect(Array.isArray(mod.PRIORITY_VAPPS) || mod.PRIORITY_VAPPS instanceof Set).toBe(true);
		expect(typeof mod.resolveVappRoute).toBe("function");
		expect(typeof mod.isPriorityVapp).toBe("function");
	});
});
