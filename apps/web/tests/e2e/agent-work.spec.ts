import { expect, test } from "@playwright/test";

/**
 * Agent Work recovery guardrail.
 *
 * The pre-port backup had a stronger See Agent Work surface than the compact
 * modern placeholder. This spec proves the recovered region layout still
 * renders through the modern app registry.
 */

const PANELS = [
	"Top swarm pulse",
	"Mission rail",
	"Lane board",
	"Queue and dependency panel",
	"Problem graph panel",
	"vCalendar strip",
	"Agent roster",
	"Command panel",
	"Agent instruction panel",
	"Chronicle strip",
] as const;

test("Agent Work renders the recovered control-room regions", async ({ page }) => {
	await page.goto("/agent-work?test=1", { waitUntil: "domcontentloaded" });
	await page.waitForLoadState("networkidle");

	const app = page.locator('[data-app="agent-work"], .ema-vapp--agent-work').first();
	await expect(app).toBeVisible({ timeout: 10_000 });

	await expect(app.getByRole("heading", { name: /workspace, calendar, and queue/i })).toBeVisible();
	await expect(app.getByText(/Daemon owns workspace information/i)).toBeVisible();

	for (const label of PANELS) {
		await expect(app.getByLabel(label)).toBeVisible({ timeout: 5_000 });
	}

	await expect(app.getByText(/ema lane show --lane/i).first()).toBeVisible();
	await expect(app.getByText(/ema queue show --queue-item/i).first()).toBeVisible();
	await expect(app.getByText(/Prompt block for external Codex \/ Claude CLI/i)).toBeVisible();

	await page.screenshot({
		path: "tests/screenshots/current/vapp-agent-work-recovered.png",
		fullPage: false,
	});
});
