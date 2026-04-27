"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { Topbar } from "./topbar";
import { Dock } from "./dock";
import { Wallpaper } from "./wallpaper";
import * as ShellWindow from "./window-frame";
import { PresenceLayer } from "./presence-layer";
import {
  ActivityPulse,
  CommandPalette,
  Screensaver,
  useDesktopStore,
  useWindowStore,
} from "../place-reflection";
import type { AppId, ProcessWindow } from "../place-reflection/types/window";
import { AgentWorkPage } from "../app/agent-work-page";
import { BlueprintPage } from "../vapps/blueprint";
import { BrainDumpPage } from "../vapps/braindump";
import { GitEmaPage } from "../vapps/git-ema";
import { HqPage } from "../app/hq-page";
import { LaunchpadPage } from "../vapps/launchpad";
import { PlaceholderPage } from "../app/placeholder-page";
import { SettingsPage } from "../app/settings-page";
import {
  EMA_SCOPE,
  surfaceLinks,
  type SurfaceId,
} from "../app/mock-projections";

type ShellApi = {
  openSurface: (appId: AppId) => void;
};

const ShellContext = createContext<ShellApi | null>(null);
const VALID_APP_IDS = new Set<AppId>([
  "launchpad",
  "braindump",
  "hq",
  "blueprint",
  "git-ema",
  "agent-work",
  "wiki",
  "threads",
  "settings",
]);

export function useShell(): ShellApi {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell() must be called inside <VirtualDesktopShell>");
  }
  return ctx;
}

function vappBody(appId: AppId, route: string): ReactNode {
  switch (appId) {
    case "launchpad":
      return <LaunchpadPage />;
    case "braindump":
      return <BrainDumpPage />;
    case "hq":
      return <HqPage />;
    case "blueprint":
      return <BlueprintPage />;
    case "git-ema": {
      const scope: "project" | "user" = route.startsWith("/orgs/") ? "project" : "user";
      return <GitEmaPage scope={scope} />;
    }
    case "agent-work":
      return <AgentWorkPage />;
    case "wiki":
      return <PlaceholderPage kind="wiki" />;
    case "threads":
      return <PlaceholderPage kind="threads" />;
    case "settings":
      return <SettingsPage />;
  }
}

function routeFor(appId: AppId): string {
  if (appId === "settings") return "/settings";
  const link = surfaceLinks.find((s) => s.id === (appId as SurfaceId));
  return link?.path ?? "/";
}

function isProcessWindow(value: unknown): value is ProcessWindow {
  if (!value || typeof value !== "object") return false;
  const win = value as Partial<ProcessWindow>;
  return (
    typeof win.id === "string" &&
    typeof win.appId === "string" &&
    VALID_APP_IDS.has(win.appId as AppId) &&
    Boolean(win.position) &&
    typeof win.position?.x === "number" &&
    typeof win.position?.y === "number" &&
    typeof win.position?.width === "number" &&
    typeof win.position?.height === "number"
  );
}

/**
 * VirtualDesktopShell — the root surface per doctrine
 * (`doctrine/research/virtual-desktop-deep.md`).
 *
 * Layers (bottom to top):
 *   1. Wallpaper — per-project scene, workspace-plane.
 *   2. Windows — vApps rendered inside movable/resizable frames.
 *   3. Dock — donor-styled dock from place-reflection (Wave 2).
 *   4. Topbar — org/space/project projection + connectors indicator.
 *   5. Presence — ephemeral collab-plane cursors + window outlines.
 *
 * Window state lives in `place-reflection/shell-state/window-store-bridge`
 * (zustand, workspace-plane, localStorage-persisted per project scope).
 */
export function VirtualDesktopShell() {
  const projectId = EMA_SCOPE.projectId;
  const windows = useWindowStore((s) => s.windows);
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const getWindowsByApp = useWindowStore((s) => s.getWindowsByApp);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);

  const openSurface = useCallback(
    (appId: AppId) => {
      const existing = getWindowsByApp(appId);
      const visible = existing.find((w) => !w.minimized);
      if (visible) {
        focusWindow(visible.id);
        return;
      }
      const minimized = existing.find((w) => w.minimized);
      if (minimized) {
        focusWindow(minimized.id);
        return;
      }
      openWindow(appId);
    },
    [getWindowsByApp, focusWindow, openWindow],
  );

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if ([...windows.values()].filter(isProcessWindow).length === 0) {
      openWindow("hq", { x: 36, y: 50, width: 840, height: 520 });
      openWindow("blueprint", { x: 84, y: 52, width: 860, height: 500 });
    }
  }, [windows.size, openWindow]);

  const toggleCommandPalette = useDesktopStore((s) => s.toggleCommandPalette);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommandPalette]);

  const allWindows = useMemo(
    () => [...windows.values()].filter(isProcessWindow),
    [windows],
  );
  const visibleCount = useMemo(
    () => allWindows.filter((w) => !w.minimized).length,
    [allWindows],
  );

  useEffect(() => {
    if (activeWindowId || allWindows.length === 0) return;
    const topWindow = [...allWindows].sort((a, b) => b.zIndex - a.zIndex)[0];
    if (topWindow) focusWindow(topWindow.id);
  }, [activeWindowId, allWindows, focusWindow]);

  const shellApi = useMemo<ShellApi>(() => ({ openSurface }), [openSurface]);

  return (
    <ShellContext.Provider value={shellApi}>
      <div className="ema-desktop" data-project={projectId}>
        <Wallpaper projectId={projectId} />
        <Topbar />
        <div className="ema-desktop__stage" aria-label="Virtual desktop stage">
          {allWindows.map((win) => (
            <ShellWindow.WindowFrame key={win.id} win={win}>
              {vappBody(win.appId, routeFor(win.appId))}
            </ShellWindow.WindowFrame>
          ))}
        </div>
        <ShellEnvironmentRail openWindowCount={visibleCount} />
        <Dock />
        <PresenceLayer />
        <ActivityPulse />
        <CommandPalette />
        <Screensaver />
      </div>
    </ShellContext.Provider>
  );
}

function ShellEnvironmentRail({ openWindowCount }: { openWindowCount: number }) {
  const counts = useMemo(() => {
    return surfaceLinks.reduce(
      (acc, surface) => {
        acc[surface.status] += 1;
        return acc;
      },
      { live: 0, projection: 0, staged: 0 },
    );
  }, []);

  return (
    <aside className="ema-env-rail" aria-label="EMA environment status">
      <span className="ema-env-rail__dot" aria-hidden="true" />
      <strong>zen environment</strong>
      <span>{openWindowCount} open</span>
      <span>{counts.projection} projections</span>
      <span>{counts.live} live</span>
      <span>{counts.staged} staged</span>
    </aside>
  );
}

export { VirtualDesktopShell as ShellLayout };

export const REGISTERED_VAPPS = surfaceLinks;
