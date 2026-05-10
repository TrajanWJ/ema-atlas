import { expect, test } from "@playwright/test";
import { waitForVappReady } from "../lib/vapp-readiness";

const USABLE_VAPPS = [
	"brain-dump",
	"journal",
	"focus",
	"tasks",
	"calendar",
	"habits",
	"notes",
	"terminal",
	"settings",
	"clock",
	"music",
	"calculator",
	"about-place",
	"about-trajan",
	"system-monitor",
	"finder",
	"photos",
	"pipes",
	"documents",
	"canvas",
	"rss",
	"projects",
	"responsibilities",
	"ideas",
	"loops",
	"stuck",
	"avoiding",
	"decisions",
	"learning",
	"questions",
	"contacts",
	"plate",
	"rewind",
	"atlas",
	"blueprint",
	"hq",
	"cockpit",
	"cwt",
	"clients",
	"git-ema",
	"agent-work",
	"chronicle",
	"launchpad",
	"wiki",
	"threads",
	"place-tools",
] as const;

test.describe("all usable vApps mount in holodeck mode", () => {
	for (const appId of USABLE_VAPPS) {
		test(`holodeck route: ${appId}`, async ({ page }) => {
			const pageErrors: string[] = [];
			page.on("pageerror", (error) => pageErrors.push(error.message));

			await page.goto(`/${appId}?test=1`);
			await waitForVappReady(page, { appId });

			await expect(page.locator(`[data-panel-app="${appId}"]`)).toBeVisible({
				timeout: 10_000,
			});
			await expect(page.locator(`[data-app="${appId}"]`).first()).toBeVisible({
				timeout: 10_000,
			});
			await expect(page.getByRole("link", { name: "Open on desktop" })).toBeVisible();

			expect(pageErrors, `Runtime errors while mounting ${appId}`).toEqual([]);
		});
	}
});
