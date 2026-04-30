/**
 * URL navigation contract for EMA.
 *
 * The URL is a first-class API into the shell — for users (deep-links, bookmarks)
 * and for agents/E2E tests (deterministic state assembly). Every param below
 * is read at boot and on every history change; missing params do nothing.
 *
 * See `docs/dev/url-test-api.md` for the full contract.
 *
 * Quick examples:
 *   /?vapp=blueprint
 *   /?mode=panel&vapp=wiki
 *   /?panel=wiki
 *   /?theme=dracula&contrast=high
 *   /?windows=blueprint:120,80,860,540;hq:1020,80,500,540
 *   /?vapp=blueprint&theme=tokyo-night&titlebar=compact&test=1
 */

// Note: `shell/vapp-registry` was removed in the place-port. We retain
// VAppId / isVAppId here as thin shims over the new `AppId` so this URL
// contract continues to type-check until url-nav is fully ported.
import { isAppId } from "./app-ids";
import type { AppId } from "../types/window";

export type VAppId = AppId;

const URL_VAPP_ALIASES = {
	braindump: "brain-dump",
} as const satisfies Record<string, AppId>;

function normalizeVAppId(value: string): AppId | null {
	const alias = URL_VAPP_ALIASES[value as keyof typeof URL_VAPP_ALIASES];
	if (alias) return alias;
	return isAppId(value) ? value : null;
}

export function isVAppId(value: unknown): value is VAppId {
	return typeof value === "string" && normalizeVAppId(value) !== null;
}

// ---------------------------------------------------------------------------
// Param names — keep these stable; URLs are user-visible.
// ---------------------------------------------------------------------------

export const URL_PARAMS = {
  vapp: "vapp",
  vapps: "vapps",
  theme: "theme",
  contrast: "contrast",
  mode: "mode",
  titlebar: "titlebar",
  desktop: "desktop",
  window: "window",
  windows: "windows",
  panel: "panel",
  route: "route",
  org: "org",
  space: "space",
  project: "project",
  test: "test",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContrastMode = "default" | "increased" | "high";
export type BaseMode = "default" | "light" | "dark";
export type TitlebarVariant = "default" | "compact" | "hidden";

export type UrlWindowSpec = {
  readonly appId: VAppId;
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
};

export type UrlState = {
  /** Single vApp to focus or open. */
  readonly vapp: VAppId | null;
  /** Multiple vApps to open at default positions (in order). */
  readonly vapps: readonly VAppId[];
  /** Theme preset id (e.g. "default", "dracula", "nord"). */
  readonly theme: string | null;
  readonly contrast: ContrastMode;
  readonly mode: BaseMode;
  readonly titlebar: TitlebarVariant;
  readonly desktop: number | null;
  readonly windows: readonly UrlWindowSpec[];
  /** Panel mode — render a single vApp full-bleed. */
  readonly panel: VAppId | null;
  readonly route: string | null;
  /** Debug scope overrides. These select render context only; daemon truth still owns data. */
  readonly org: string | null;
  readonly space: string | null;
  readonly project: string | null;
  /** Test mode — suppress ambient motion / non-deterministic effects. */
  readonly test: boolean;
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const VALID_THEMES = new Set([
  "default",
  "nord",
  "catppuccin-mocha",
  "dracula",
  "tokyo-night",
  "rose-pine",
  "solarized-dark",
  "gruvbox-dark",
  "one-dark",
  "monochrome",
]);

function parseVAppList(raw: string | null): readonly VAppId[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .map(normalizeVAppId)
    .filter((s): s is VAppId => s !== null);
}

function parseWindow(spec: string): UrlWindowSpec | null {
  // Format: "appId:x,y[,w,h]"
  const [idPart, coordsPart] = spec.split(":");
  if (!idPart || !coordsPart) return null;
  const appId = normalizeVAppId(idPart);
  if (!appId) return null;
  const nums = coordsPart.split(",").map((n) => Number.parseInt(n, 10));
  if (nums.length < 2 || nums.slice(0, 2).some(Number.isNaN)) return null;
  const [x, y, width, height] = nums;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return {
    appId,
    x,
    y,
    ...(typeof width === "number" && !Number.isNaN(width) ? { width } : {}),
    ...(typeof height === "number" && !Number.isNaN(height) ? { height } : {}),
  };
}

function parseWindowList(raw: string | null): readonly UrlWindowSpec[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseWindow)
    .filter((w): w is UrlWindowSpec => w !== null);
}

function parseSingleWindow(raw: string | null): readonly UrlWindowSpec[] {
  if (!raw) return [];
  const w = parseWindow(raw);
  return w ? [w] : [];
}

function parseContrast(raw: string | null): ContrastMode {
  if (raw === "increased" || raw === "high") return raw;
  return "default";
}

function parseMode(raw: string | null): BaseMode {
  if (raw === "light" || raw === "dark") return raw;
  return "default";
}

function parseTitlebar(raw: string | null): TitlebarVariant {
  if (raw === "compact" || raw === "hidden") return raw;
  return "default";
}

function parseTheme(raw: string | null): string | null {
  if (!raw) return null;
  return VALID_THEMES.has(raw) ? raw : null;
}

function parseVApp(raw: string | null): VAppId | null {
  return raw ? normalizeVAppId(raw) : null;
}

function parsePanel(params: URLSearchParams): VAppId | null {
  const explicitPanel = parseVApp(params.get(URL_PARAMS.panel));
  if (explicitPanel) return explicitPanel;
  return params.get(URL_PARAMS.mode) === "panel" ? parseVApp(params.get(URL_PARAMS.vapp)) : null;
}

function parseDesktop(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parses a `URLSearchParams` (or string) into the canonical `UrlState`. */
export function parseUrlState(input: URLSearchParams | string): UrlState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const get = (k: string) => params.get(k);

  const singleWindow = parseSingleWindow(get(URL_PARAMS.window));
  const windowList = parseWindowList(get(URL_PARAMS.windows));
  const windows = windowList.length > 0 ? windowList : singleWindow;

  return {
    vapp: parseVApp(get(URL_PARAMS.vapp)),
    vapps: parseVAppList(get(URL_PARAMS.vapps)),
    theme: parseTheme(get(URL_PARAMS.theme)),
    contrast: parseContrast(get(URL_PARAMS.contrast)),
    mode: parseMode(get(URL_PARAMS.mode)),
    titlebar: parseTitlebar(get(URL_PARAMS.titlebar)),
    desktop: parseDesktop(get(URL_PARAMS.desktop)),
    windows,
    panel: parsePanel(params),
    route: get(URL_PARAMS.route),
    org: get(URL_PARAMS.org),
    space: get(URL_PARAMS.space),
    project: get(URL_PARAMS.project),
    test: get(URL_PARAMS.test) === "1" || get(URL_PARAMS.test) === "true",
  };
}

// ---------------------------------------------------------------------------
// Encoding (for building shareable links / test fixtures)
// ---------------------------------------------------------------------------

function encodeWindow(w: UrlWindowSpec): string {
  const coords =
    typeof w.width === "number" && typeof w.height === "number"
      ? `${w.x},${w.y},${w.width},${w.height}`
      : `${w.x},${w.y}`;
  return `${w.appId}:${coords}`;
}

/** Builds a URLSearchParams string from a partial state. Omits empty values. */
export function encodeUrlState(state: Partial<UrlState>): string {
  const p = new URLSearchParams();
  if (state.vapp) p.set(URL_PARAMS.vapp, state.vapp);
  if (state.vapps && state.vapps.length > 0) p.set(URL_PARAMS.vapps, state.vapps.join(","));
  if (state.theme) p.set(URL_PARAMS.theme, state.theme);
  if (state.contrast && state.contrast !== "default") p.set(URL_PARAMS.contrast, state.contrast);
  if (state.mode && state.mode !== "default") p.set(URL_PARAMS.mode, state.mode);
  if (state.titlebar && state.titlebar !== "default") p.set(URL_PARAMS.titlebar, state.titlebar);
  if (typeof state.desktop === "number") p.set(URL_PARAMS.desktop, String(state.desktop));
  if (state.windows && state.windows.length > 0) {
    p.set(URL_PARAMS.windows, state.windows.map(encodeWindow).join(";"));
  }
  if (state.panel) p.set(URL_PARAMS.panel, state.panel);
  if (state.route) p.set(URL_PARAMS.route, state.route);
  if (state.org) p.set(URL_PARAMS.org, state.org);
  if (state.space) p.set(URL_PARAMS.space, state.space);
  if (state.project) p.set(URL_PARAMS.project, state.project);
  if (state.test) p.set(URL_PARAMS.test, "1");
  return p.toString();
}
