import { expect, test } from "@playwright/test";
import { waitForVappReady } from "../lib/vapp-readiness";

type VappCase = {
	readonly appId: string;
	readonly path: string;
	readonly assertions: readonly RegExp[];
	readonly timeoutMs?: number;
};

const CASES: readonly VappCase[] = [
	{
		appId: "launchpad",
		path: "/launchpad?test=1",
		assertions: [/Launchpad/i, /Workspace/i],
	},
	{
		appId: "cockpit",
		path: "/cockpit?test=1#/clients/client:ms-wilson/proslync-app-ios-final",
		assertions: [/proslync-app-ios-final/i, /Intentions/i, /Builds/i, /Surfaces/i],
		timeoutMs: 45_000,
	},
	{
		appId: "agent-work",
		path: "/agent-work?test=1",
		assertions: [/Workspace, calendar, and queue/i, /Lane/i, /queue/i],
	},
	{
		appId: "hq",
		path: "/hq?test=1",
		assertions: [/Surface switchboard/i, /Next actions/i, /Lane status/i],
	},
	{
		appId: "atlas",
		path: "/atlas?test=1",
		assertions: [/EMA Atlas/i, /Blueprint/i],
	},
	{
		appId: "blueprint",
		path: "/blueprint?test=1",
		assertions: [/project blueprint/i, /EMA 0\.0\.6 Blueprint/i, /daemon projection/i],
	},
	{
		appId: "chronicle",
		path: "/chronicle?test=1",
		assertions: [/daemon activity/i, /events/i, /sessions/i],
	},
	{
		appId: "git-ema",
		path: "/git-ema?test=1",
		assertions: [/Active builds/i, /Source attachments/i],
	},
	{
		appId: "clients",
		path: "/clients?test=1",
		assertions: [/Clients/i, /Client Cockpit/i, /Proslync Cockpit/i],
	},
	{
		appId: "threads",
		path: "/threads?test=1",
		assertions: [/Threads/i],
	},
	{
		appId: "wiki",
		path: "/wiki?test=1",
		assertions: [/Wiki/i, /Doctrine/i],
	},
	{
		appId: "settings",
		path: "/settings?test=1",
		assertions: [/Live Preview/i, /Finder/i],
	},
	{
		appId: "place-tools",
		path: "/place-tools?test=1",
		assertions: [/Place Tools/i],
	},
	{
		appId: "terminal",
		path: "/terminal?test=1",
		assertions: [/EMA terminal v0\.6/i],
	},
	{
		appId: "finder",
		path: "/finder?test=1",
		assertions: [/Finder/i],
	},
];

test.describe("Proslync-first priority vApps", () => {
	test.describe.configure({ timeout: 90_000 });

	for (const entry of CASES) {
		test(`${entry.appId} renders a useful Proslync work surface`, async ({ page }) => {
			await page.addInitScript(() => {
				localStorage.setItem("place-welcome-dismissed", "true");
			});
			await page.goto(entry.path);
			await waitForVappReady(page, { appId: entry.appId });
			await expect(page.locator(`[data-app="${entry.appId}"]`).first()).toBeVisible();
			for (const assertion of entry.assertions) {
				await expect(page.getByText(assertion).first()).toBeVisible({
					timeout: entry.timeoutMs,
				});
			}
		});
	}
});
