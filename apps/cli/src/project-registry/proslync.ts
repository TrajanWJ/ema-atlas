/**
 * Proslync project registry — single source of truth for the Proslync pilot.
 *
 * Sprint 3 of the EMA Proslync-First head-orchestrator master plan moved the
 * Proslync constants out of `apps/cli/src/commands/cockpit.ts` and the web
 * route at `apps/web/app/api/cockpit/projection/route.ts` into this registry
 * so adding a second client (e.g. another NIL platform) becomes a registry
 * entry rather than a code-shape change.
 *
 * Web consumers cannot import from `apps/cli/src/...` directly (separate
 * tsconfig + bundle). The mirrored copy lives at
 * `apps/web/src/lib/project-registry/proslync.ts` and must be kept in sync
 * with this file. The root script `tooling/check-registry-parity.mjs`
 * compares the two and fails CI if they diverge.
 */

export type ActiveBuild = {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly path: string;
	readonly repoUrl: string | null;
	readonly devCommand: string | null;
};

export type Surface = {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly owner: string;
	readonly buildId: string;
	readonly path: string;
	readonly localUrl: string | null;
	readonly status: "live" | "candidate" | "planned" | "queued";
};

export type ProjectRegistryEntry = {
	readonly projectSlug: string;
	readonly projectId: string;
	readonly clientId: string | null;
	readonly clientName: string | null;
	readonly clientColor: string | null;
	readonly projectRecordPath: string | null;
	readonly activeBuilds: readonly ActiveBuild[];
	readonly surfaces: readonly Surface[];
	readonly canonicalPlans: readonly string[];
	readonly verificationCommands: readonly string[];
	/**
	 * Queue items that must be closed before the project is launch-ready.
	 *
	 * Intentionally empty for the current Proslync pass: Sprint 3 of the master
	 * plan does not list specific gating queue IDs. The Proslync Swarm Launch
	 * Gate in the master plan is encoded as a doctrine checklist, not as
	 * machine-checked queue closures. Future projects (or later Proslync
	 * sprints) may populate this list when concrete gates exist.
	 */
	readonly requiredQueueGates: readonly string[];
	readonly recommendedLanes: readonly string[];
};

const ACTIVE_BUILDS_ROOT = "/Users/trajanm4air/Desktop/Active builds";

export const Proslync: ProjectRegistryEntry = {
	projectSlug: "proslync-app-ios-final",
	projectId: "project:01KR0FKC3Q028AX7DK658J8D99",
	clientId: "client:ms-wilson",
	clientName: "Ms. Wilson",
	clientColor: "#d49a6a",
	projectRecordPath: "/Users/trajanm4air/Desktop/Projects/proslync-app-ios-final",
	activeBuilds: [
		{
			id: "proslync-app-ios-final",
			label: "Proslync iOS app",
			role: "mobile mirror, athlete/brand/persona flows",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-app-ios-final`,
			repoUrl: "https://github.com/TrajanWJ/proslync-app-ios-final",
			devCommand: "npx expo start",
		},
		{
			id: "proslync-backend",
			label: "Proslync backend",
			role: "Bun/Hono/Drizzle API and product-core persistence",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-backend`,
			repoUrl: "https://github.com/TrajanWJ/proslync-backend-final",
			devCommand: "bun --hot src/server.ts",
		},
		{
			id: "proslync-desktop",
			label: "Proslync desktop",
			role: "AD cockpit and Brand HQ desktop surface",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-desktop`,
			repoUrl: "https://github.com/TrajanWJ/proslync-desktop-site-final",
			devCommand: "pnpm dev",
		},
		{
			id: "proslync-presentation-assets-final",
			label: "Presentation assets",
			role: "master plan, research capture, client narrative",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-presentation-assets-final`,
			repoUrl: "https://github.com/TrajanWJ/proslync-presentation-assets-final",
			devCommand: null,
		},
	],
	surfaces: [
		{
			id: "ad-cockpit",
			label: "AD cockpit",
			role: "Buyer control room: revenue share, cap context, compliance health.",
			owner: "Proslync desktop",
			buildId: "proslync-desktop",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-desktop/app/ad/page.tsx`,
			localUrl: "http://localhost:3021/ad",
			status: "planned",
		},
		{
			id: "brand-hq",
			label: "Brand HQ",
			role: "Open-deal workflow, ranked applicants, rationale, and trust metadata.",
			owner: "Proslync desktop",
			buildId: "proslync-desktop",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-desktop/app/brand/page.tsx`,
			localUrl: "http://localhost:3021/brand",
			status: "candidate",
		},
		{
			id: "nil-deal-detail",
			label: "NIL Deal Detail",
			role: "Cross-role spine: packet, deliverables, review tracks, audit timeline.",
			owner: "Proslync iOS app",
			buildId: "proslync-app-ios-final",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-app-ios-final/app/deal/[id].tsx`,
			localUrl: null,
			status: "planned",
		},
		{
			id: "nil-manager",
			label: "NIL Manager",
			role: "Consent-aware review queue and approval gates.",
			owner: "Proslync iOS app",
			buildId: "proslync-app-ios-final",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-app-ios-final/components/nil-manager/nil-manager-view.tsx`,
			localUrl: null,
			status: "candidate",
		},
		{
			id: "backend-api",
			label: "Backend API",
			role: "Product-core objects, routes, seed data, and trust metadata.",
			owner: "Proslync backend",
			buildId: "proslync-backend",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-backend/src`,
			localUrl: "http://localhost:3020/api/health",
			status: "candidate",
		},
		{
			id: "master-plan",
			label: "Master plan and assets",
			role: "Client story, role happiness, research, and presentation proof.",
			owner: "Presentation assets",
			buildId: "proslync-presentation-assets-final",
			path: `${ACTIVE_BUILDS_ROOT}/proslync-presentation-assets-final/docs/plans/proslync-role-happiness-master-plan-2026-05-09/README.md`,
			localUrl: null,
			status: "live",
		},
		{
			id: "hero-website",
			label: "Hero website",
			role: "Remote narrative surface for AD wedge, demo proof, and launch story.",
			owner: "Proslync website",
			buildId: "proslync-website",
			path: "https://github.com/TrajanWJ/proslync-website",
			localUrl: "https://proslync-hero.vercel.app",
			status: "queued",
		},
	],
	canonicalPlans: [
		"/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/PLAN.md",
		"/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/ORCHESTRATOR.md",
		"/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final/docs/plans/proslync-role-happiness-master-plan-2026-05-09/README.md",
		"/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final/docs/research/prep-capture-2026-05-09/mrs-wilson-asks-extracted.md",
	],
	verificationCommands: [
		"pnpm --filter @ema/cli typecheck",
		"pnpm build:cli",
		"pnpm --dir apps/web exec tsc --noEmit",
		"ema cockpit workpack --project proslync-app-ios-final --json",
	],
	requiredQueueGates: [],
	recommendedLanes: [
		"lane:01KR7K0ZGA009YGND4AHPRJ9BN",
		"lane:01KR7K1ARD00B24MDAZFQVCEFN",
		"lane:01KR7HPFFV000QCZ4XCQY718VB",
		"lane:01KR7K1B4Q00CNGW965NX52J5A",
		"lane:01KR7KN7XV0185XD90VVV2YPBJ",
	],
};
