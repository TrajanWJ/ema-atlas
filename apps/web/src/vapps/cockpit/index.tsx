/**
 * cockpit vApp — EMA's port of the cwt (current-work-tracker-trajan) web UI.
 *
 * Slice 4 of the EMA-absorbs-cwt migration: the donor surface is rendered
 * in-process inside EMA's shell. Donor data is stubbed; daemon WebSocket
 * reads/writes wire in Slice 5 (search the cockpit/ subtree for
 * `TODO(slice-5)`).
 *
 * Donor URL layout -> cockpit hash routes (read in `router.ts`):
 *   /                    -> #/now              (NOW dashboard)
 *   /capture             -> #/capture          (Brain Dump capture form)
 *   /clients/[clientId]  -> #/clients/<id>
 *   /clients/[clientId]/[projectId] -> #/clients/<clientId>/<projectId>
 *   /personal/[id]       -> #/personal/<id>
 *   /workshop/[id]       -> #/workshop/<id>
 *   /tl                  -> #/tl
 *
 * Donor token -> EMA design-system token (added in
 * `packages/design-system/src/tokens.css` where missing):
 *
 *   --color-fg                -> --place-text-primary
 *   --color-fg-muted          -> --place-text-secondary
 *   --color-fg-dim            -> --place-text-tertiary
 *   --color-bg                -> --place-base
 *   --color-bg-elevated       -> --place-surface-1
 *   --color-bg-soft           -> --place-surface-2
 *   --color-border            -> --place-border-default
 *   --color-accent            -> --place-accent-client       (NEW: hue-aligned with --place-secondary-400)
 *   --color-accent-personal   -> --place-accent-personal     (NEW: cwt donor green #7ed957)
 *   --color-accent-internal   -> --place-accent-internal     (NEW: cwt donor purple #a78bfa)
 *   --color-accent-warning    -> --place-accent-warning      (NEW: cwt donor amber #f5a524)
 *   --color-accent-danger     -> --place-accent-danger       (NEW: cwt donor red #f25f4c)
 *
 * Anti-patterns honored (blueprint 10): no emoji, no popovers, no toasts,
 * no drag-reorder, no infinite scroll, no praise copy. Italic empty states.
 * Monospace IDs.
 */

"use client";

import "./cockpit.css";

import { CapturePage } from "./pages/capture";
import { ClientsBenchPage } from "./pages/clients-bench";
import { NowPage } from "./pages/now";
import { ProjectBenchPage } from "./pages/project-bench";
import { TlAboutPage } from "./pages/tl";
import { Sidebar } from "./components/sidebar";
import { useCockpitRoute } from "./router";

export function CockpitApp() {
	const { route, path } = useCockpitRoute();

	return (
		<section data-app="cockpit" className="cockpit-shell">
			<Sidebar activeRoute={path} />
			<main className="cockpit-main">
				<div className="cockpit-main__inner">
					<CockpitView route={route} />
				</div>
			</main>
		</section>
	);
}

function CockpitView({ route }: { readonly route: ReturnType<typeof useCockpitRoute>["route"] }) {
	switch (route.kind) {
		case "now":
			return <NowPage />;
		case "capture":
			return <CapturePage />;
		case "tl":
			return <TlAboutPage />;
		case "client":
			return <ClientsBenchPage clientId={route.clientId} />;
		case "client-project":
			return <ProjectBenchPage projectId={route.projectId} kind="client" />;
		case "personal-project":
			return <ProjectBenchPage projectId={route.projectId} kind="personal" />;
		case "workshop-project":
			return <ProjectBenchPage projectId={route.projectId} kind="workshop" />;
		default:
			return <NowPage />;
	}
}

export default CockpitApp;
