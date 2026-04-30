import { expect, test } from "@playwright/test";

test("Chronicle panel route renders daemon projection over IPC", async ({ page }) => {
	await page.goto("/chronicle?test=1", { waitUntil: "domcontentloaded" });

	const app = page.locator('[data-app="chronicle"]');
	await expect(app).toBeVisible({ timeout: 10_000 });
	await expect(app.getByText("daemon activity")).toBeVisible();
	await expect(app.getByRole("button", { name: /^events$/ })).toBeVisible();
	await expect(app.getByRole("button", { name: /^sessions$/ })).toBeVisible();

	const status = app.locator("aside").first().locator("p").nth(1);
	if (process.env.EMA_E2E_EXPECT_DAEMON === "1") {
		await expect(status).toHaveText(/\d+ daemon events/, { timeout: 10_000 });
		await expect(app.getByRole("button", { name: /all\s+\d+/ })).toBeVisible();
	} else {
		await expect(status).toHaveText(
			/(\d+ daemon events|waiting for daemon projection)/,
			{ timeout: 10_000 },
		);
	}

	await page.screenshot({
		path: "tests/screenshots/current/vapp-chronicle.png",
		fullPage: false,
	});
});
