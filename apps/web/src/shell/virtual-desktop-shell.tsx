import { ReactNode, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Topbar } from "./topbar";
import { Dock } from "./dock";
import { Wallpaper } from "./wallpaper";
import { WindowFrame } from "./window-frame";
import { PresenceLayer } from "./presence-layer";
import { useWindowStore } from "./window-store";
import { AgentWorkPage } from "../app/agent-work-page";
import { BlueprintPage } from "../vapps/blueprint";
import { GitEmaPage } from "../vapps/git-ema";
import { HqPage } from "../app/hq-page";
import { PlaceholderPage } from "../app/placeholder-page";
import { SettingsPage } from "../app/settings-page";
import {
  EMA_SCOPE,
  PROJECT_ROOT_PATH,
  surfaceLinks,
  type SurfaceId,
} from "../app/mock-projections";

type VappId = SurfaceId | "settings";

function vappBody(vapp: VappId, route: string): ReactNode {
  switch (vapp) {
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

function routeToVapp(pathname: string): { vapp: VappId; title: string; route: string } | null {
  if (pathname === "/") return { vapp: "hq", title: "HQ", route: "/" };
  if (pathname === "/agent-work") return { vapp: "agent-work", title: "See Agent Work", route: "/agent-work" };
  if (pathname === "/wiki") return { vapp: "wiki", title: "Wiki / Doctrine", route: "/wiki" };
  if (pathname === "/threads") return { vapp: "threads", title: "Chat / Threads", route: "/threads" };
  if (pathname === "/settings") return { vapp: "settings", title: "Settings", route: "/settings" };
  if (pathname === "/git-ema") return { vapp: "git-ema", title: "git-ema", route: "/git-ema" };
  if (pathname.endsWith("/git-ema")) return { vapp: "git-ema", title: "git-ema", route: pathname };
  if (pathname.startsWith("/orgs/")) return { vapp: "blueprint", title: "Blueprint", route: pathname };
  return null;
}

/**
 * VirtualDesktopShell — the root surface per doctrine
 * (`doctrine/research/virtual-desktop-deep.md`).
 *
 * Layers (bottom to top):
 *   1. Wallpaper — per-project scene, workspace-plane.
 *   2. Windows — vApps rendered inside movable/resizable frames.
 *   3. Dock — Launchpad-semantics launcher scoped to the Desktop frame.
 *   4. Topbar — org/space/project projection + connectors indicator.
 *   5. Presence — ephemeral collab-plane cursors + window outlines.
 *
 * Routes remain as deep links: navigating to `/agent-work` opens (or
 * focuses) the See Agent Work window. Closing the last window returns
 * to the bare desktop.
 */
export function VirtualDesktopShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const projectId = EMA_SCOPE.projectId;
  const store = useWindowStore(projectId);

  useEffect(() => {
    const match = routeToVapp(location.pathname);
    if (!match) return;
    store.openWindow({
      vapp: match.vapp,
      title: match.title,
      route: match.route,
    });
  }, [location.pathname, store]);

  const visibleWindows = useMemo(
    () => store.windows.filter((w) => !w.minimized),
    [store.windows],
  );

  return (
    <div className="ema-desktop" data-project={projectId}>
      <Wallpaper projectId={projectId} />
      <Topbar />
      <div className="ema-desktop__stage" aria-label="Virtual desktop stage">
        {visibleWindows.map((win) => (
          <WindowFrame
            key={win.id}
            window={win}
            onFocus={() => store.focusWindow(win.id)}
            onClose={() => {
              store.closeWindow(win.id);
              if (location.pathname === win.route) navigate("/");
            }}
            onMinimize={() => store.minimizeWindow(win.id, true)}
            onMove={(x, y) => store.moveWindow(win.id, x, y)}
            onResize={(width, height) => store.resizeWindow(win.id, width, height)}
          >
            {vappBody(win.vapp, win.route)}
          </WindowFrame>
        ))}
      </div>
      <Dock
        store={store}
        onOpen={(surfaceId, path, label) => {
          navigate(surfaceId === "blueprint" ? PROJECT_ROOT_PATH : path);
          store.openWindow({
            vapp: surfaceId,
            title: label,
            route: surfaceId === "blueprint" ? PROJECT_ROOT_PATH : path,
          });
        }}
      />
      <PresenceLayer />
    </div>
  );
}

// Backward-compatibility: some call sites may still import `ShellLayout`.
// The VirtualDesktopShell is the root shell now; `ShellLayout` is an alias.
export { VirtualDesktopShell as ShellLayout };

export const REGISTERED_VAPPS = surfaceLinks;
