/**
 * Cockpit internal router.
 *
 * The cockpit vApp lives inside the EMA shell, so it cannot own the page URL
 * pathname (`?vapp=cockpit` is owned by the shell). We use the URL hash for
 * internal pages instead. Examples:
 *   ?vapp=cockpit#/now
 *   ?vapp=cockpit#/capture
 *   ?vapp=cockpit#/clients/<id>
 *   ?vapp=cockpit#/clients/<clientId>/<projectId>
 *   ?vapp=cockpit#/personal/<id>
 *   ?vapp=cockpit#/workshop/<id>
 *   ?vapp=cockpit#/tl
 *
 * `useCockpitRoute()` returns the current parsed route and resubscribes to
 * `hashchange`. `cockpitNavigate(route)` writes the next hash and lets the
 * subscription pick it up.
 *
 * Slice 5 will replace this with a real shell router primitive once vApps
 * become full URL citizens.
 */

import { useEffect, useState } from "react";

export type CockpitRoute =
	| { readonly kind: "now" }
	| { readonly kind: "capture" }
	| { readonly kind: "tl" }
	| { readonly kind: "client"; readonly clientId: string }
	| {
			readonly kind: "client-project";
			readonly clientId: string;
			readonly projectId: string;
	  }
	| { readonly kind: "personal-project"; readonly projectId: string }
	| { readonly kind: "workshop-project"; readonly projectId: string };

export const COCKPIT_DEFAULT_PATH = "/now";

export function parseCockpitRoute(raw: string): CockpitRoute {
	const path = normalizePath(raw);
	if (path === "/" || path === "/now") return { kind: "now" };
	if (path === "/capture") return { kind: "capture" };
	if (path === "/tl") return { kind: "tl" };

	const clientProject = path.match(/^\/clients\/([^/]+)\/([^/]+)$/);
	if (clientProject) {
		return {
			kind: "client-project",
			clientId: decodeURIComponent(clientProject[1]!),
			projectId: decodeURIComponent(clientProject[2]!),
		};
	}

	const client = path.match(/^\/clients\/([^/]+)$/);
	if (client) return { kind: "client", clientId: decodeURIComponent(client[1]!) };

	const personal = path.match(/^\/personal\/([^/]+)$/);
	if (personal) return { kind: "personal-project", projectId: decodeURIComponent(personal[1]!) };

	const workshop = path.match(/^\/workshop\/([^/]+)$/);
	if (workshop) return { kind: "workshop-project", projectId: decodeURIComponent(workshop[1]!) };

	return { kind: "now" };
}

function normalizePath(raw: string): string {
	if (!raw) return "/";
	let path = raw.startsWith("#") ? raw.slice(1) : raw;
	if (!path.startsWith("/")) path = `/${path}`;
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
	return path;
}

function readHashPath(): string {
	if (typeof window === "undefined") return COCKPIT_DEFAULT_PATH;
	const hash = window.location.hash;
	if (!hash || hash === "#") return COCKPIT_DEFAULT_PATH;
	return hash;
}

export function useCockpitRoute(): {
	readonly route: CockpitRoute;
	readonly path: string;
} {
	const [path, setPath] = useState<string>(() => normalizePath(readHashPath()));

	useEffect(() => {
		function sync() {
			setPath(normalizePath(readHashPath()));
		}
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);

	return { path, route: parseCockpitRoute(path) };
}

export function cockpitNavigate(route: string): void {
	if (typeof window === "undefined") return;
	const next = normalizePath(route);
	if (window.location.hash === `#${next}`) return;
	window.location.hash = next;
}
