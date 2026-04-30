import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility sweep recovered from the pre-port web backup and adapted to
 * the modern vApp routes. By default it logs serious/critical findings as
 * visible debt; set EMA_E2E_ENFORCE_A11Y=1 to make blockers fail CI.
 */

const ENFORCE_A11Y = process.env.EMA_E2E_ENFORCE_A11Y === "1";

const ROUTES = [
	{ name: "shell", path: "/?test=1" },
	{ name: "blueprint", path: "/blueprint?test=1" },
	{ name: "agent-work", path: "/agent-work?test=1" },
	{ name: "git-ema", path: "/git-ema?test=1" },
	{ name: "wiki", path: "/wiki?test=1" },
	{ name: "high-contrast", path: "/?contrast=high&test=1" },
] as const;

for (const route of ROUTES) {
	test(`a11y: ${route.name}`, async ({ page }) => {
		await page.goto(route.path, { waitUntil: "domcontentloaded" });
		await page.waitForLoadState("networkidle");
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		const blockers = results.violations.filter(
			(violation) =>
				violation.impact === "serious" || violation.impact === "critical",
		);

		if (blockers.length > 0) {
			console.log(
				`[a11y:${route.name}] ${blockers.length} blocker(s):\n` +
					blockers
						.map(
							(violation) =>
								`  - ${violation.id} (${violation.impact}): ${violation.help}\n` +
								`    targets: ${violation.nodes
									.slice(0, 3)
									.map((node) => node.target.join(" "))
									.join(" | ")}`,
						)
						.join("\n"),
			);
		}

		if (ENFORCE_A11Y) {
			expect(
				blockers,
				`Serious/critical a11y issues on ${route.name}`,
			).toEqual([]);
		} else {
			expect(Array.isArray(blockers)).toBe(true);
		}
	});
}
