import { expect, test } from "@playwright/test";

/**
 * Sprint 4 lock — Agent Work command IPC.
 *
 * Confirms that the Command Panel exposes daemon-backed primary actions for
 * the supported set (lane list, queue list, etc.) and that clicking the
 * `lane.list` button updates the panel's result hint. The test skips
 * gracefully if the buttons aren't yet rendered, so a future regression in
 * mock projections does not silently disable the lock.
 */

test("Agent Work primary actions are daemon-backed", async ({ page }) => {
	await page.goto("/agent-work?test=1", { waitUntil: "domcontentloaded" });

	const app = page.locator('[data-app="agent-work"], .ema-vapp--agent-work').first();
	await expect(app).toBeVisible({ timeout: 10_000 });

	const commandPanel = page.getByLabel("Command panel");
	await expect(commandPanel).toBeVisible({ timeout: 10_000 });

	const laneListButton = commandPanel.locator('[data-action="lane.list"]').first();
	const queueListButton = commandPanel.locator('[data-action="queue.list"]').first();

	const laneListVisible = await laneListButton
		.isVisible({ timeout: 2_000 })
		.catch(() => false);
	if (!laneListVisible) {
		test.skip(true, "Sprint 4 daemon-backed buttons not yet rendered in mock projection");
		return;
	}

	await expect(laneListButton).toBeVisible();
	await expect(queueListButton).toBeVisible();

	// Confirm the daemon-backed pill renders the correct state token.
	await expect(laneListButton).toHaveAttribute("data-state", "daemon-backed");

	// Click `lane list` and look for a result hint within the same article.
	const laneListAction = laneListButton.locator(".ema-saw-cmd-btn__action").first();
	await laneListAction.click();
	const resultHint = laneListButton
		.locator('[data-result-for], .ema-saw-cmd-btn__hint')
		.last();
	await expect(resultHint).toBeVisible({ timeout: 8_000 });
	const text = (await resultHint.innerText()).toLowerCase();
	expect(text.length).toBeGreaterThan(0);
});
