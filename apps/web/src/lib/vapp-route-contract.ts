/**
 * vApp Route Contract — Sprint 7
 *
 * One source of truth for which strings can address a vApp via URL, which
 * are first-class priorities, which export static popout pages, and which
 * historical aliases must keep resolving (notably `cwt -> cockpit`, the
 * post-absorption alias from
 * `docs/decisions/2026-05-07-cwt-absorbed-by-ema.md`).
 *
 * Holodeck (`/<appId>`), vDesktop (`/?vapp=<appId>`), and the native popout
 * (`/popout/<appId>`) all funnel through `resolveVappRoute()` so the three
 * surfaces stop disagreeing on what counts as a real route.
 */

import { APP_IDS } from "./app-ids";

export type VappId = string;

/**
 * The 15 priority vApps from the head-orchestrator master plan. Listed
 * in product priority order — the Launchpad and dock surface respect
 * this order when laying out the priority rail.
 */
export const PRIORITY_VAPPS = [
	"launchpad",
	"cockpit",
	"agent-work",
	"hq",
	"atlas",
	"blueprint",
	"chronicle",
	"git-ema",
	"clients",
	"threads",
	"wiki",
	"settings",
	"place-tools",
	"terminal",
	"finder",
] as const satisfies readonly VappId[];

/**
 * Every vApp whose id is a valid URL target. Derived from the runtime
 * registry source-of-truth (`APP_IDS` from `app-ids.ts`) so adding a new
 * registered app automatically makes it routable.
 */
export const ROUTABLE_VAPPS: readonly VappId[] = APP_IDS;

/**
 * Subset that exports static popout pages. Used by the static build for
 * `apps/web/app/popout/[appId]/page.tsx` `generateStaticParams`. Keeping
 * this list narrow keeps the build fast.
 */
export const STATIC_POPOUT_VAPPS = [
	"launchpad",
	"cockpit",
	"agent-work",
	"hq",
	"atlas",
	"blueprint",
	"chronicle",
	"settings",
	"duct-tape",
] as const satisfies readonly VappId[];

/**
 * Historical / muscle-memory aliases. Must stay parseable so old links
 * keep working.
 *
 *   cwt           -> cockpit       (post-absorption, ADR 2026-05-07)
 *   active-builds -> git-ema       (legacy folder name)
 *   braindump     -> brain-dump    (no-hyphen variant)
 */
export const VAPP_ALIASES: Readonly<Record<string, VappId>> = {
	cwt: "cockpit",
	"active-builds": "git-ema",
	braindump: "brain-dump",
};

const PRIORITY_SET: ReadonlySet<string> = new Set(PRIORITY_VAPPS);
const ROUTABLE_SET: ReadonlySet<string> = new Set(ROUTABLE_VAPPS);
const STATIC_POPOUT_SET: ReadonlySet<string> = new Set(STATIC_POPOUT_VAPPS);

export type ResolvedRoute = {
	readonly id: VappId;
	readonly canonical: string;
	readonly priority: boolean;
	readonly routable: boolean;
	readonly static_popout: boolean;
};

/**
 * Lower-case the input, resolve through `VAPP_ALIASES`, then check
 * `ROUTABLE_VAPPS`. Returns null for anything that is not a valid vApp
 * URL target. Holodeck / vDesktop / popout all consume this.
 */
export function resolveVappRoute(input: string | null | undefined): ResolvedRoute | null {
	if (!input) return null;
	const lower = String(input).trim().toLowerCase();
	if (lower.length === 0) return null;

	const aliased = VAPP_ALIASES[lower] ?? lower;
	if (!ROUTABLE_SET.has(aliased)) return null;

	return {
		id: aliased,
		canonical: `/${aliased}`,
		priority: PRIORITY_SET.has(aliased),
		routable: true,
		static_popout: STATIC_POPOUT_SET.has(aliased),
	};
}

/**
 * Cheap predicate for shells that want to decide priority-vs-secondary
 * styling without a full route resolve. Operates after alias resolution.
 */
export function isPriorityVapp(id: string): boolean {
	if (!id) return false;
	const lower = id.trim().toLowerCase();
	const aliased = VAPP_ALIASES[lower] ?? lower;
	return PRIORITY_SET.has(aliased);
}
