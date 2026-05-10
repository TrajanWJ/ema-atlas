import { expect, test } from "@playwright/test";
import { waitForCockpitReady } from "../lib/vapp-readiness";

// Sprint 9 timing budgets for the Proslync cockpit render.
// These become hard gates once Sprint 7 lands `data-cockpit-ready`.
const FIRST_FRAME_BUDGET_MS = 1_500;
const WORKPACK_BUDGET_MS = 3_000;

test("Proslync cockpit shows workspace, builds, surfaces, and intentions", async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem("place-welcome-dismissed", "true");
	});

	const navStart = Date.now();
	await page.goto("/?vapp=cockpit&test=1#/clients/client:ms-wilson/proslync-app-ios-final");

	// First frame: domcontentloaded must arrive under 1.5 s.
	await page.waitForLoadState("domcontentloaded");
	const firstFrameMs = Date.now() - navStart;
	// eslint-disable-next-line no-console
	console.log(`[cockpit-proslync] first-frame ${firstFrameMs}ms`);

	const readiness = await waitForCockpitReady(page);
	const readyMs = Date.now() - navStart;
	// eslint-disable-next-line no-console
	console.log(
		`[cockpit-proslync] cockpit-ready ${readyMs}ms (mode=${readiness.mode} state=${readiness.state ?? "n/a"})`,
	);

	// Surface assertions before timing gates so a slow render still
	// produces a useful failure trace.
	await expect(page.locator('[data-app="cockpit"]').first()).toBeVisible();
	await expect(page.getByText("proslync-app-ios-final").first()).toBeVisible();
	await expect(page.getByText("Proslync ready").first()).toBeVisible();
	await expect(page.getByRole("button", { name: /Intentions/i })).toBeVisible();

	// Workpack visible by the time the cockpit declares ready.
	const workpackMs = Date.now() - navStart;
	// eslint-disable-next-line no-console
	console.log(`[cockpit-proslync] workpack-visible ${workpackMs}ms`);

	// Timing assertions are only enforced once the deterministic markers
	// land in Sprint 7. While we are still falling back to a settle period,
	// we observe-but-do-not-fail so existing CI does not regress.
	if (readiness.mode === "marker") {
		expect(firstFrameMs, "first frame should render under 1.5s").toBeLessThan(
			FIRST_FRAME_BUDGET_MS,
		);
		expect(workpackMs, "workpack should be visible under 3s").toBeLessThan(WORKPACK_BUDGET_MS);
	}

	// Intentions tab can lazy-load — no timing gate here.
	await page.getByRole("button", { name: /Intentions/i }).click();
	await expect(page.getByText(/lost follow-ups/i).first()).toBeVisible();
	await expect(page.getByText(/ema intention backfeed/).first()).toBeVisible();
	await expect(page.getByRole("button", { name: "Accept" }).first()).toBeVisible();

	await page.getByRole("button", { name: /Builds/i }).click();
	await expect(page.getByText("Proslync iOS app").first()).toBeVisible();
	await expect(page.getByText("Proslync backend").first()).toBeVisible();

	await page.getByRole("button", { name: /Surfaces/i }).click();
	await expect(page.getByText("AD cockpit").first()).toBeVisible();
	await expect(page.getByText("Brand HQ").first()).toBeVisible();
});
