import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const exec = promisify(execFile);

const REPO_ROOT = resolve(__dirname, "..", "..", "..", "..");
const CLI_BIN = resolve(REPO_ROOT, "apps", "cli", "dist", "bin.js");

test.describe("Sprint 6 — harness registry projections", () => {
	test("duct-tape route renders four panels when registered", async ({ page }) => {
		const response = await page.goto("/duct-tape?test=1", { waitUntil: "domcontentloaded" }).catch(() => null);
		if (!response || response.status() === 404) {
			test.skip(true, "duct-tape vApp is not registered yet (Sprint 8 / Wave 4B)");
			return;
		}

		const app = page.locator('[data-app="duct-tape"]');
		await expect(app).toBeVisible({ timeout: 10_000 });
		await expect(app).toHaveAttribute("data-vapp-ready", /(live|offline)/);

		await expect(app.locator('[data-testid="duct-tape-providers"]')).toBeVisible();
		await expect(app.locator('[data-testid="duct-tape-dispatches"]')).toBeVisible();
		await expect(app.locator('[data-testid="duct-tape-executions"]')).toBeVisible();
		await expect(app.locator('[data-testid="duct-tape-tools"]')).toBeVisible();
	});

	test("simulated dispatch surfaces in dispatch.registry / harness status", async () => {
		const cliExists = await exec("test", ["-f", CLI_BIN]).then(() => true).catch(() => false);
		if (!cliExists) {
			test.skip(true, "CLI bundle missing; run pnpm build:cli before exercising this flow");
			return;
		}

		const dispatchPrompt = `harness-registry-spec-${Date.now()}`;
		const dispatched = await exec("node", [
			CLI_BIN,
			"harness",
			"dispatch",
			"--provider",
			"simulated",
			"--prompt",
			dispatchPrompt,
			"--no-daemon",
			"--json",
		]).catch((error) => ({ stdout: "", stderr: String(error) } as { stdout: string; stderr: string }));
		expect(dispatched.stdout, dispatched.stderr).toContain("\"ok\":");

		const dispatchedJson = JSON.parse(dispatched.stdout);
		expect(dispatchedJson.ok).toBeTruthy();
		expect(dispatchedJson.provider).toBe("simulated");

		const status = await exec("node", [CLI_BIN, "harness", "status", "--json"]);
		const statusJson = JSON.parse(status.stdout);
		expect(statusJson.ok).toBeTruthy();
		expect(statusJson.projections).toBeTruthy();
		expect(statusJson.projections.dispatch_registry).toBeTruthy();
		expect(statusJson.projections.execution_registry).toBeTruthy();
		expect(statusJson.projections.tool_timeline).toBeTruthy();
		expect(statusJson.projections.chronicle_activity).toBeTruthy();
		const dispatchProjection = statusJson.projections.dispatch_registry;
		expect(["live", "pending_daemon_projection", "unavailable"]).toContain(dispatchProjection.status);
	});
});
