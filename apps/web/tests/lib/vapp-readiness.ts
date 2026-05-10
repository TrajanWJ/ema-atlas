import { type Page, expect } from "@playwright/test";

/**
 * Wait for a vApp surface to expose deterministic readiness markers.
 *
 * Sprint 7 (vApp route/frame contract) is responsible for adding
 * `data-vapp-ready` and `data-cockpit-ready` attributes to the priority
 * vApp surfaces. Until that lands, this helper has a graceful fallback so
 * Sprint 9 tests do not break on the way in.
 *
 * Strategy:
 *   1. Wait for `domcontentloaded` (cheap, deterministic).
 *   2. Try to observe the readiness selector with a short timeout.
 *   3. If the selector is absent, fall back to a 2 s settle period and
 *      log a warning so the missing marker is visible.
 *
 * `networkidle` is intentionally banned — see Sprint 9 §"Ban networkidle".
 */

export type ReadinessState = "live" | "staged" | "offline";

const READY_PATTERN = /^(live|staged|offline)$/;
const PRIMARY_TIMEOUT_MS = 5_000;
const FALLBACK_SETTLE_MS = 2_000;

export interface VappReadinessOptions {
	/** Optional vApp id to scope the wait to `[data-app="<id>"]`. */
	readonly appId?: string;
	/** Override the primary readiness timeout. */
	readonly timeoutMs?: number;
	/** Override the fallback settle period when markers are absent. */
	readonly fallbackMs?: number;
}

export interface VappReadinessResult {
	readonly mode: "marker" | "fallback";
	readonly state: ReadinessState | null;
	readonly elapsedMs: number;
}

/**
 * Wait for any priority vApp readiness marker.
 *
 * Returns the observed mode/state so callers can layer additional
 * assertions (e.g. timing budgets) on top.
 */
export async function waitForVappReady(
	page: Page,
	options: VappReadinessOptions = {},
): Promise<VappReadinessResult> {
	const startedAt = Date.now();
	await page.waitForLoadState("domcontentloaded");

	const timeoutMs = options.timeoutMs ?? PRIMARY_TIMEOUT_MS;
	const fallbackMs = options.fallbackMs ?? FALLBACK_SETTLE_MS;
	const scope = options.appId
		? `[data-app="${options.appId}"] [data-vapp-ready], [data-app="${options.appId}"][data-vapp-ready]`
		: "[data-vapp-ready]";

	const locator = page.locator(scope).first();
	try {
		await expect(locator).toHaveAttribute("data-vapp-ready", READY_PATTERN, {
			timeout: timeoutMs,
		});
		const state = (await locator.getAttribute("data-vapp-ready")) as ReadinessState | null;
		return {
			mode: "marker",
			state,
			elapsedMs: Date.now() - startedAt,
		};
	} catch {
		// Sprint 7 has not landed the markers yet. Fall back to a short
		// settle so existing tests keep passing.
		// eslint-disable-next-line no-console
		console.warn(
			`[vapp-readiness] data-vapp-ready not present${
				options.appId ? ` for "${options.appId}"` : ""
			}; falling back to ${fallbackMs}ms settle. Sprint 7 will tighten this.`,
		);
		await page.waitForTimeout(fallbackMs);
		return {
			mode: "fallback",
			state: null,
			elapsedMs: Date.now() - startedAt,
		};
	}
}

/**
 * Wait for cockpit-specific readiness.
 *
 * Cockpit publishes both `data-vapp-ready` (shared frame contract) and
 * `data-cockpit-ready` (workpack/runtime/projection agreement). We wait
 * on the cockpit-scoped marker since it is the stricter signal.
 */
export async function waitForCockpitReady(
	page: Page,
	options: VappReadinessOptions = {},
): Promise<VappReadinessResult> {
	const startedAt = Date.now();
	await page.waitForLoadState("domcontentloaded");

	const timeoutMs = options.timeoutMs ?? PRIMARY_TIMEOUT_MS;
	const fallbackMs = options.fallbackMs ?? FALLBACK_SETTLE_MS;

	const locator = page.locator("[data-cockpit-ready]").first();
	try {
		await expect(locator).toHaveAttribute("data-cockpit-ready", READY_PATTERN, {
			timeout: timeoutMs,
		});
		const state = (await locator.getAttribute("data-cockpit-ready")) as ReadinessState | null;
		return {
			mode: "marker",
			state,
			elapsedMs: Date.now() - startedAt,
		};
	} catch {
		// eslint-disable-next-line no-console
		console.warn(
			"[vapp-readiness] data-cockpit-ready not present; falling back to vApp marker + settle. Sprint 7 will tighten this.",
		);
		// Try the broader vApp marker before falling back to a hard settle.
		try {
			await expect(page.locator('[data-app="cockpit"] [data-vapp-ready]').first()).toHaveAttribute(
				"data-vapp-ready",
				READY_PATTERN,
				{ timeout: Math.max(1_000, Math.floor(timeoutMs / 2)) },
			);
			return {
				mode: "marker",
				state: null,
				elapsedMs: Date.now() - startedAt,
			};
		} catch {
			await page.waitForTimeout(fallbackMs);
			return {
				mode: "fallback",
				state: null,
				elapsedMs: Date.now() - startedAt,
			};
		}
	}
}
