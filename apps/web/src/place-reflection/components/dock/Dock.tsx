"use client";

/**
 * Dock — bottom-centered glass bar with launcher trigger, pinned apps,
 * running apps, settings, and virtual-desktop switcher. Direct-rip from
 * donor; imports swapped to our bridges + the EMA-native KickoffLauncher
 * so the app list iterates real EMA surfaces.
 *
 * RIP: place.org src/components/desktop/Dock.tsx
 */

import { type ReactNode, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useWindowStore } from "../../shell-state/window-store-bridge";
import { useDesktopStore } from "../../shell-state/desktop-store-bridge";
import { useDockStore } from "../../shell-state/dock-store-bridge";
import { useLauncherStore } from "../../shell-state/launcher-store-bridge";
import { useSettingsStore } from "../../shell-state/settings-store-bridge";
import { useVirtualDesktopStore } from "../../shell-state/virtual-desktop-store-bridge";
import { useDockAutohide } from "../../hooks/use-dock-autohide";
import { DockIcon } from "./DockIcon";
import { DockContextMenu, useDockContextMenu } from "./DockContextMenu";
import { KickoffLauncher } from "./KickoffLauncher";
import { DesktopSwitcher } from "./DesktopSwitcher";
import type { AppId } from "../../types/window";
import type { DockSize } from "../../types/settings";
import { getApp } from "../../lib/app-registry";
import { SettingsIcon } from "../../icons";

const DOCK_SIZE_CONFIG: Record<
  DockSize,
  {
    readonly iconSize: number;
    readonly gap: number;
    readonly paddingX: number;
    readonly paddingY: number;
  }
> = {
  small: { iconSize: 36, gap: 4, paddingX: 8, paddingY: 4 },
  medium: { iconSize: 44, gap: 8, paddingX: 12, paddingY: 8 },
  large: { iconSize: 52, gap: 10, paddingX: 16, paddingY: 10 },
};

interface ResolvedDockApp {
  readonly id: AppId;
  readonly icon: ReactNode;
  readonly label: string;
  readonly description: string;
}

function resolveApp(appId: AppId): ResolvedDockApp | null {
  const app = getApp(appId);
  if (!app) return null;
  return { id: appId, icon: app.icon, label: app.name, description: app.description };
}

export function Dock() {
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const inboxCount = useDesktopStore((s) => s.inboxCount);
  const pinnedAppIds = useDockStore((s) => s.pinnedAppIds);
  const pin = useDockStore((s) => s.pin);
  const unpin = useDockStore((s) => s.unpin);
  const { isHidden } = useDockAutohide();
  const { state: ctxState, open: openCtx, close: closeCtx } = useDockContextMenu();

  const dockSize = useSettingsStore((s) => s.dockSize);
  const magnification = useSettingsStore((s) => s.dockMagnification);
  const virtualDesktopsEnabled = useSettingsStore((s) => s.virtualDesktopsEnabled);
  const sizeConfig = DOCK_SIZE_CONFIG[dockSize];

  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const effectiveMouseX = magnification ? mouseX : null;

  const pinnedApps = useMemo(
    () => pinnedAppIds.map(resolveApp).filter(Boolean) as ResolvedDockApp[],
    [pinnedAppIds],
  );

  const runningApps = useMemo(() => {
    const pinnedSet = new Set<string>(pinnedAppIds);
    const seen = new Set<string>();
    const result: ResolvedDockApp[] = [];
    for (const w of windows.values()) {
      if (pinnedSet.has(w.appId) || seen.has(w.appId)) continue;
      seen.add(w.appId);
      const resolved = resolveApp(w.appId);
      if (resolved) result.push(resolved);
    }
    return result;
  }, [windows, pinnedAppIds]);

  const handleDockMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!magnification) return;
      const rect = dockRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMouseX(e.clientX - rect.left);
    },
    [magnification],
  );

  const handleDockMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const handleClick = useCallback(
    (appId: AppId) => {
      const vdState = useVirtualDesktopStore.getState();
      const currentDesktop = vdState.desktops.find(
        (d) => d.id === vdState.activeDesktopId,
      );
      const currentIds = new Set(currentDesktop?.windowIds ?? []);
      const appWindows = [...windows.values()].filter(
        (w) => w.appId === appId && (currentIds.size === 0 || currentIds.has(w.id)),
      );
      if (appWindows.length === 0) {
        openWindow(appId);
        return;
      }
      const win = appWindows[0];
      if (!win) return;
      if (win.minimized) {
        focusWindow(win.id);
      } else if (win.id === activeWindowId) {
        minimizeWindow(win.id);
      } else {
        focusWindow(win.id);
      }
    },
    [windows, activeWindowId, openWindow, focusWindow, minimizeWindow],
  );

  const handleSettingsClick = useCallback(() => {
    openWindow("settings");
  }, [openWindow]);

  const handlePinnedCtx = useCallback(
    (e: React.MouseEvent, appId: AppId) => {
      const appWindows = [...windows.values()].filter((w) => w.appId === appId);
      openCtx(e.clientX, e.clientY, [
        { label: "Open", onClick: () => openWindow(appId) },
        { label: "Open New Window", onClick: () => openWindow(appId) },
        {
          label: "Close All Windows",
          onClick: () => {
            for (const w of appWindows) closeWindow(w.id);
          },
        },
        "separator",
        { label: "Unpin from Dock", onClick: () => unpin(appId) },
      ]);
    },
    [windows, openCtx, openWindow, closeWindow, unpin],
  );

  const handleRunningCtx = useCallback(
    (e: React.MouseEvent, appId: AppId) => {
      const appWindows = [...windows.values()].filter((w) => w.appId === appId);
      openCtx(e.clientX, e.clientY, [
        { label: "Open New Window", onClick: () => openWindow(appId) },
        {
          label: "Close All Windows",
          onClick: () => {
            for (const w of appWindows) closeWindow(w.id);
          },
        },
        "separator",
        { label: "Pin to Dock", onClick: () => pin(appId) },
      ]);
    },
    [windows, openCtx, openWindow, closeWindow, pin],
  );

  return (
    <>
      <motion.div
        ref={dockRef}
        role="toolbar"
        aria-label="Dock"
        className="glass absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center rounded-2xl"
        style={{
          zIndex: 50,
          maxWidth: "calc(100vw - 24px)",
          overflow: "visible",
          gap: sizeConfig.gap,
          paddingLeft: sizeConfig.paddingX,
          paddingRight: sizeConfig.paddingX,
          paddingTop: sizeConfig.paddingY,
          paddingBottom: sizeConfig.paddingY,
        }}
        animate={{ y: isHidden ? "100%" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseMove={handleDockMouseMove}
        onMouseLeave={handleDockMouseLeave}
      >
        <LauncherTrigger mouseX={effectiveMouseX} iconSize={sizeConfig.iconSize} />
        <DockDivider title="Pinned apps" />

        {pinnedApps.map((app) => (
          <PinnedDockItem
            key={app.id}
            app={app}
            windows={windows}
            activeWindowId={activeWindowId}
            inboxCount={inboxCount}
            mouseX={effectiveMouseX}
            iconSize={sizeConfig.iconSize}
            onClick={handleClick}
            onContextMenu={handlePinnedCtx}
          />
        ))}

        {runningApps.length > 0 && (
          <>
            <DockDivider title="Running apps" />
            <div
              className="flex items-center"
              style={{ overflow: "visible", gap: sizeConfig.gap }}
            >
              {runningApps.map((app) => (
                <RunningDockItem
                  key={app.id}
                  app={app}
                  windows={windows}
                  activeWindowId={activeWindowId}
                  mouseX={effectiveMouseX}
                  iconSize={sizeConfig.iconSize}
                  onClick={handleClick}
                  onContextMenu={handleRunningCtx}
                />
              ))}
            </div>
          </>
        )}

        <DockDivider title="Settings" />
        <DockIcon
          icon={<SettingsIcon size={20} />}
          label="Settings"
          description="Accent color, data management, and system info"
          isOpen={false}
          isFocused={false}
          mouseX={effectiveMouseX}
          size={sizeConfig.iconSize}
          onClick={handleSettingsClick}
        />

        {virtualDesktopsEnabled && (
          <>
            <div className="mx-1 h-8 w-px bg-white/15" />
            <DesktopSwitcher />
          </>
        )}
      </motion.div>
      <DockContextMenu state={ctxState} onClose={closeCtx} />
      <KickoffLauncher />
    </>
  );
}

function DockDivider({ title }: { readonly title?: string }) {
  return (
    <div
      className="mx-0.5 h-8 w-px shrink-0"
      style={{ background: "var(--place-border-default)", opacity: 0.5 }}
      title={title}
    />
  );
}

interface PinnedDockItemProps {
  readonly app: ResolvedDockApp;
  readonly windows: ReadonlyMap<string, { readonly appId: AppId; readonly id: string }>;
  readonly activeWindowId: string | null;
  readonly inboxCount: number;
  readonly mouseX: number | null;
  readonly iconSize: number;
  readonly onClick: (appId: AppId) => void;
  readonly onContextMenu: (e: React.MouseEvent, appId: AppId) => void;
}

function PinnedDockItem({
  app,
  windows,
  activeWindowId,
  inboxCount,
  mouseX,
  iconSize,
  onClick,
  onContextMenu,
}: PinnedDockItemProps) {
  const appWindows = useMemo(
    () => [...windows.values()].filter((w) => w.appId === app.id),
    [windows, app.id],
  );
  const isOpen = appWindows.length > 0;
  const isFocused = appWindows.some((w) => w.id === activeWindowId);
  const badge = app.id === "threads" ? inboxCount : undefined;

  return (
    <DockIcon
      icon={app.icon}
      label={app.label}
      description={app.description}
      isOpen={isOpen}
      isFocused={isFocused}
      badge={badge}
      mouseX={mouseX}
      size={iconSize}
      onClick={() => onClick(app.id)}
      onContextMenu={(e) => onContextMenu(e, app.id)}
    />
  );
}

interface RunningDockItemProps {
  readonly app: ResolvedDockApp;
  readonly windows: ReadonlyMap<string, { readonly appId: AppId; readonly id: string }>;
  readonly activeWindowId: string | null;
  readonly mouseX: number | null;
  readonly iconSize: number;
  readonly onClick: (appId: AppId) => void;
  readonly onContextMenu: (e: React.MouseEvent, appId: AppId) => void;
}

function RunningDockItem({
  app,
  windows,
  activeWindowId,
  mouseX,
  iconSize,
  onClick,
  onContextMenu,
}: RunningDockItemProps) {
  const appWindows = useMemo(
    () => [...windows.values()].filter((w) => w.appId === app.id),
    [windows, app.id],
  );
  const isFocused = appWindows.some((w) => w.id === activeWindowId);

  return (
    <DockIcon
      icon={app.icon}
      label={app.label}
      description={app.description}
      isOpen
      isFocused={isFocused}
      mouseX={mouseX}
      size={iconSize}
      onClick={() => onClick(app.id)}
      onContextMenu={(e) => onContextMenu(e, app.id)}
    />
  );
}

const GRID_ICON = (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

function LauncherTrigger({
  mouseX,
  iconSize,
}: {
  readonly mouseX: number | null;
  readonly iconSize: number;
}) {
  const toggle = useLauncherStore((s) => s.toggle);
  const isOpen = useLauncherStore((s) => s.isOpen);

  return (
    <div data-launcher-trigger>
      <DockIcon
        icon={GRID_ICON}
        label="App Launcher"
        description="Browse and launch all surfaces"
        isOpen={false}
        isFocused={isOpen}
        mouseX={mouseX}
        size={iconSize}
        onClick={toggle}
      />
    </div>
  );
}
