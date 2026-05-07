import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";

import { APP_IDS } from "@/src/lib/app-ids";

export type LiveClaim = {
	readonly owner: string;
	readonly lane: string;
	readonly scope: string;
	readonly goal: string;
	readonly next: string;
	readonly refreshBy: string;
	readonly blocker: string;
};

export type LiveHandoff = {
	readonly route: string;
	readonly state: string;
	readonly changed: string;
	readonly open: string;
	readonly verify: string;
	readonly notes: string;
};

export type LaneRow = {
	readonly lane: string;
	readonly owner: string;
	readonly project: string;
	readonly status: string;
	readonly doneWhen: string;
};

export type SourceDoc = {
	readonly title: string;
	readonly href: string;
	readonly summary: string;
	readonly status: string;
	readonly updatedAt: string;
};

export type SubprojectRecord = {
	readonly name: string;
	readonly href: string;
	readonly summary: string;
};

export type RouteLink = {
	readonly href: string;
	readonly label: string;
	readonly group: string;
};

export type LocalSurface = {
	readonly label: string;
	readonly href: string;
	readonly note: string;
	readonly kind: "internal" | "external";
};

export type AtlasLiveState = {
	readonly generatedAt: string;
	readonly claims: readonly LiveClaim[];
	readonly closedClaims: readonly string[];
	readonly handoffs: readonly LiveHandoff[];
	readonly lanes: readonly LaneRow[];
	readonly blueprints: readonly SourceDoc[];
	readonly workspaceDocs: readonly SourceDoc[];
	readonly projectDocs: readonly SourceDoc[];
	readonly subprojects: readonly SubprojectRecord[];
	readonly routes: readonly RouteLink[];
	readonly localSurfaces: readonly LocalSurface[];
	readonly cwt: {
		readonly name: string;
		readonly projectId: string;
		readonly standaloneUrl: string;
		readonly bridgeUrl: string;
		readonly desktopUrl: string;
		readonly ownership: readonly string[];
		readonly activeBuild: string;
		readonly projectRecord: string;
	};
};

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, "../..");
const desktopRoot = path.resolve(repoRoot, "../..");
const emaProjectRoot =
	process.env.EMA_PROJECT_ROOT?.trim() ||
	path.join(desktopRoot, "Projects", "EMA");
const atlasRoot = path.join(emaProjectRoot, "atlas");
const cwtManifestPath =
	process.env.CWT_MANIFEST_PATH?.trim() ||
	path.join(
		desktopRoot,
		"Active builds",
		"current-work-tracker-trajan",
		"cwt.vapp.json",
	);

async function readText(absPath: string): Promise<string> {
	try {
		return await fs.readFile(absPath, "utf8");
	} catch {
		return "";
	}
}

async function readJson<T>(absPath: string, fallback: T): Promise<T> {
	try {
		return JSON.parse(await fs.readFile(absPath, "utf8")) as T;
	} catch {
		return fallback;
	}
}

async function fileUpdatedAt(absPath: string): Promise<string> {
	try {
		const stat = await fs.stat(absPath);
		return stat.mtime.toISOString();
	} catch {
		return "";
	}
}

function field(block: string, name: string): string {
	const match = new RegExp(`^${name}:\\s*(.+)$`, "m").exec(block);
	return match?.[1]?.trim() ?? "";
}

function stripMarkdown(text: string): string {
	return text
		.replace(/^---[\s\S]*?---\s*/m, "")
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`([^`]+)`/g, "$1")
		.trim();
}

function firstHeading(text: string, fallback: string): string {
	const match = /^#\s+(.+)$/m.exec(text);
	return match?.[1]?.trim() ?? fallback;
}

function firstParagraph(text: string): string {
	return stripMarkdown(text)
		.split("\n")
		.map((line) => line.trim())
		.filter(
			(line) =>
				line &&
				!line.startsWith("#") &&
				!line.startsWith(">") &&
				!line.startsWith("|"),
		)
		.slice(0, 2)
		.join(" ");
}

function titleFromFile(file: string): string {
	return path
		.basename(file, ".md")
		.replace(/^\d+-/, "")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function markdownBlocks(text: string): readonly string[] {
	return [...text.matchAll(/```md\n([\s\S]*?)```/g)]
		.map((match) => match[1])
		.filter((block): block is string => typeof block === "string");
}

function parseClaims(text: string): LiveClaim[] {
	return markdownBlocks(text)
		.filter((block) => /^Claim:/m.test(block))
		.map((block) => {
			const head = /^Claim:\s*(.+?)\s*\|\s*Lane:\s*(.+)$/m.exec(block);
			return {
				owner: head?.[1]?.trim() ?? "unknown",
				lane: head?.[2]?.trim() ?? "unknown",
				scope: field(block, "Scope"),
				goal: field(block, "Goal"),
				next: field(block, "Next"),
				refreshBy: field(block, "Refresh by"),
				blocker: field(block, "Blocker"),
			};
		})
		.filter(
			(claim) =>
				!claim.owner.includes("<") &&
				!claim.lane.includes("<") &&
				claim.lane !== "unknown",
		);
}

function parseClosedClaims(text: string): string[] {
	return markdownBlocks(text)
		.filter((block) => /^Closed:/m.test(block))
		.map((block) => block.replace(/\s+/g, " ").trim())
		.slice(0, 6);
}

function parseHandoffs(text: string): LiveHandoff[] {
	return markdownBlocks(text)
		.filter((block) => /^Handoff:/m.test(block))
		.map((block) => ({
			route: field(block, "Handoff"),
			state: field(block, "State"),
			changed: field(block, "Changed"),
			open: field(block, "Open"),
			verify: field(block, "Verify"),
			notes: field(block, "Notes"),
		}))
		.filter(
			(handoff) =>
				!handoff.route.includes("<") &&
				!handoff.state.includes("done | blocked"),
		);
}

function parseLaneRows(text: string): LaneRow[] {
	return text
		.split("\n")
		.filter((line) => line.startsWith("| `lane:"))
		.map((line) =>
			line
				.split("|")
				.slice(1, -1)
				.map((cell) => cell.trim().replace(/^`|`$/g, "")),
		)
		.map(([lane, owner, project, status, doneWhen]) => ({
			lane: lane ?? "lane:unknown",
			owner: owner ?? "unknown",
			project: project ?? "unknown",
			status: status ?? "unknown",
			doneWhen: doneWhen ?? "",
		}));
}

async function readDocs(dir: string, hrefPrefix: string): Promise<SourceDoc[]> {
	try {
		const files = (await fs.readdir(dir))
			.filter((file) => file.endsWith(".md"))
			.sort();
		return Promise.all(
			files.map(async (file) => {
				const absPath = path.join(dir, file);
				const text = await readText(absPath);
				return {
					title: firstHeading(text, titleFromFile(file)),
					href: `${hrefPrefix}/${file}`,
					summary: firstParagraph(text),
					status: text.includes("(stub") ? "stub" : "live file",
					updatedAt: await fileUpdatedAt(absPath),
				};
			}),
		);
	} catch {
		return [];
	}
}

async function readProjectDocs(): Promise<SourceDoc[]> {
	const files = ["project.md", "PROJECT-MAP.md", "MASTER-EMA-DESIGN-DOC.md", "README.md"];
	const docs = await Promise.all(
		files.map(async (file) => {
			const absPath = path.join(emaProjectRoot, file);
			const text = await readText(absPath);
			return {
				title: firstHeading(text, titleFromFile(file)),
				href: `/${file}`,
				summary: firstParagraph(text),
				status: text ? "live file" : "missing",
				updatedAt: await fileUpdatedAt(absPath),
			};
		}),
	);
	return docs.filter((doc) => doc.status !== "missing");
}

async function readSubprojects(): Promise<SubprojectRecord[]> {
	const dir = path.join(emaProjectRoot, "subprojects");
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		return Promise.all(
			entries
				.filter((entry) => entry.isDirectory())
				.map(async (entry) => {
					const absPath = path.join(dir, entry.name, "project.md");
					const text = await readText(absPath);
					return {
						name: firstHeading(text, entry.name),
						href: `/subprojects/${entry.name}/project.md`,
						summary: firstParagraph(text),
					};
				}),
		);
	} catch {
		return [];
	}
}

function pagePathToRoute(file: string): string {
	const relative = file
		.replace(/^app\//, "")
		.replace(/\/page\.tsx$/, "")
		.replace(/^page\.tsx$/, "");
	const parts = relative.split(path.sep).filter((segment) => !segment.startsWith("("));
	if (parts.length === 0 || parts.join("/") === "") return "/";
	return `/${parts.join("/")}`;
}

function routeLabel(route: string): string {
	if (route === "/") return "Desktop";
	return route
		.split("/")
		.filter(Boolean)
		.at(-1)!
		.replace(/\[|\]/g, "")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function routeGroup(route: string): string {
	if (["/", "/desk", "/canvas", "/launchpad"].includes(route)) return "Surfaces";
	if (["/atlas", "/blueprint", "/wiki", "/chronicle"].includes(route)) return "Atlas";
	if (["/hq", "/agent-work", "/cwt", "/clients", "/threads", "/git-ema"].includes(route)) {
		return "Live state";
	}
	if (["/portfolio", "/about", "/community", "/services", "/cool-stuff", "/companion"].includes(route)) {
		return "Web";
	}
	return "Tools";
}

async function discoverRoutes(): Promise<RouteLink[]> {
	const files: string[] = [];

	async function walk(dir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await fs.readdir(path.join(webRoot, dir), { withFileTypes: true });
		} catch {
			return;
		}

		await Promise.all(
			entries.map(async (entry) => {
				const next = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					await walk(next);
				} else if (entry.name === "page.tsx") {
					files.push(next);
				}
			}),
		);
	}

	await walk("app");

	const physicalRoutes = files
		.map(pagePathToRoute)
		.filter((route) => !route.includes("["));
	const vappRoutes = ["braindump", ...APP_IDS].map((id) => `/${id}`);
	const routes = Array.from(new Set([...physicalRoutes, ...vappRoutes])).sort();

	return routes.map((route) => ({
		href: route,
		label: routeLabel(route),
		group: routeGroup(route),
	}));
}

type CwtManifest = {
	readonly name?: string;
	readonly project_id?: string;
	readonly project_record?: string;
	readonly active_build?: string;
	readonly surface?: { readonly url?: string; readonly embed?: { readonly host_route?: string } };
	readonly ports?: { readonly ema_web_host?: number };
	readonly ownership?: { readonly owns?: readonly string[] };
};

export async function getAtlasLiveState(): Promise<AtlasLiveState> {
	const claimsText = await readText(path.join(atlasRoot, "workspace", "CLAIMS.md"));
	const handoffsText = await readText(path.join(atlasRoot, "workspace", "HANDOFFS_PENDING.md"));
	const lanesText = await readText(path.join(atlasRoot, "workspace", "LANES_CATALOG.md"));
	const cwtManifest = await readJson<CwtManifest>(cwtManifestPath, {});
	const cwtUrl = cwtManifest.surface?.url ?? "http://127.0.0.1:3015";
	const hostPort = cwtManifest.ports?.ema_web_host ?? 5173;
	const hostRoute = cwtManifest.surface?.embed?.host_route ?? "/cwt";

	return {
		generatedAt: new Date().toISOString(),
		claims: parseClaims(claimsText),
		closedClaims: parseClosedClaims(claimsText),
		handoffs: parseHandoffs(handoffsText),
		lanes: parseLaneRows(lanesText),
		blueprints: await readDocs(path.join(emaProjectRoot, "blueprint"), "/blueprint"),
		workspaceDocs: await readDocs(path.join(atlasRoot, "workspace"), "/workspace"),
		projectDocs: await readProjectDocs(),
		subprojects: await readSubprojects(),
		routes: await discoverRoutes(),
		localSurfaces: [
			{ label: "EMA desktop", href: "/", note: "Canonical root and place.org-descended holodeck desktop", kind: "internal" },
			{ label: "Launchpad", href: "/launchpad", note: "vApp launch surface inside EMA", kind: "internal" },
			{ label: "Atlas vApp", href: "/atlas", note: "Live project map, rendered in EMA style", kind: "internal" },
			{ label: "CWT standalone", href: cwtUrl, note: "Current Work Tracker web surface", kind: "external" },
			{ label: "CWT in EMA", href: `http://127.0.0.1:${hostPort}${hostRoute}`, note: "Embedded CWT bridge route", kind: "external" },
		],
		cwt: {
			name: cwtManifest.name ?? "current-work-tracker",
			projectId: cwtManifest.project_id ?? "project:unknown",
			standaloneUrl: cwtUrl,
			bridgeUrl: `http://127.0.0.1:${hostPort}${hostRoute}`,
			desktopUrl: `http://127.0.0.1:${hostPort}/?vapp=cwt`,
			ownership: cwtManifest.ownership?.owns ?? [],
			activeBuild:
				cwtManifest.active_build ??
				path.join(desktopRoot, "Active builds", "current-work-tracker-trajan"),
			projectRecord:
				cwtManifest.project_record ??
				path.join(desktopRoot, "Projects", "current-work-tracker-trajan"),
		},
	};
}
