"use client";

/**
 * KickoffLauncher — full-screen grid launcher with search + favorites.
 * Visual style ripped from donor; app list comes from EMA's registry
 * (getAllApps) so clicks actually open EMA surfaces.
 *
 * RIP: place.org src/components/desktop/KickoffLauncher.tsx (visual rip;
 *      app-list logic is EMA-native against getAllApps)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useLauncherStore } from "../../shell-state/launcher-store-bridge";
import { useWindowStore } from "../../shell-state/window-store-bridge";
import { getAllApps, type App } from "../../lib/app-registry";
import { APP_LABELS } from "../../lib/constants";
import type { AppId } from "../../types/window";
import { SearchIcon } from "../../icons";

function FavoritesRow({
  favorites,
  onLaunch,
}: {
  readonly favorites: readonly AppId[];
  readonly onLaunch: (id: AppId) => void;
}) {
  if (favorites.length === 0) return null;
  const allApps = getAllApps();

  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--place-border-subtle)",
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--place-text-muted)",
          marginBottom: "6px",
        }}
      >
        Favorites
      </div>
      <div className="flex items-center gap-2">
        {favorites.slice(0, 6).map((appId) => {
          const app = allApps.find((a) => a.id === appId);
          if (!app) return null;
          return <FavoriteIcon key={appId} app={app} onLaunch={onLaunch} />;
        })}
      </div>
    </div>
  );
}

function FavoriteIcon({
  app,
  onLaunch,
}: {
  readonly app: App;
  readonly onLaunch: (id: AppId) => void;
}) {
  return (
    <button
      type="button"
      title={APP_LABELS[app.id]}
      onClick={() => onLaunch(app.id)}
      className="flex h-9 w-9 items-center justify-center rounded-lg"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--place-border-subtle)",
        color: "var(--place-text-secondary)",
        cursor: "default",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "var(--place-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.color = "var(--place-text-secondary)";
      }}
    >
      {app.icon}
    </button>
  );
}

function AppRow({
  app,
  onLaunch,
  onContextMenu,
}: {
  readonly app: App;
  readonly onLaunch: (id: AppId) => void;
  readonly onContextMenu: (e: React.MouseEvent, id: AppId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onLaunch(app.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, app.id);
      }}
      className="flex w-full items-center gap-2.5 px-4 py-1.5"
      style={{
        background: "transparent",
        border: "none",
        cursor: "default",
        color: "var(--place-text-secondary)",
        fontSize: "0.72rem",
        textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.color = "var(--place-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--place-text-secondary)";
      }}
    >
      <span className="flex shrink-0">{app.icon}</span>
      <span className="flex flex-col gap-0">
        <span style={{ fontWeight: 500 }}>{APP_LABELS[app.id]}</span>
        <span style={{ fontSize: "0.58rem", color: "var(--place-text-muted)" }}>
          {app.description}
        </span>
      </span>
    </button>
  );
}

function LauncherContextMenu({
  x,
  y,
  appId,
  isFavorite,
  onClose,
}: {
  readonly x: number;
  readonly y: number;
  readonly appId: AppId;
  readonly isFavorite: boolean;
  readonly onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { addFavorite, removeFavorite } = useLauncherStore();

  useEffect(() => {
    const handleClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handleClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handleClick);
    };
  }, [onClose]);

  const handleToggle = () => {
    if (isFavorite) removeFavorite(appId);
    else addFavorite(appId);
    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      role="menu"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[10000] min-w-[160px] rounded-lg p-1"
      style={{
        top: y,
        left: x,
        background: "var(--place-surface-1)",
        border: "1px solid var(--place-border-default)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center rounded-md px-3 py-1.5 text-sm"
        style={{
          color: "var(--place-text-primary)",
          background: "none",
          border: "none",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "";
        }}
      >
        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>
    </motion.div>
  );
}

export function KickoffLauncher() {
  const { isOpen, close, favorites } = useLauncherStore();
  const openWindow = useWindowStore((s) => s.openWindow);
  const [search, setSearch] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    appId: AppId;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleLaunch = useCallback(
    (id: AppId) => {
      openWindow(id);
      close();
    },
    [openWindow, close],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, appId: AppId) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, appId });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtxMenu(null);
        close();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      const trigger = document.querySelector("[data-launcher-trigger]");
      if (trigger?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        close();
      }
    };
    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const maxH =
    typeof window !== "undefined" ? Math.min(480, window.innerHeight - 80) : 480;

  if (typeof document === "undefined") return null;

  const allApps = getAllApps();
  const lc = search.trim().toLowerCase();
  const filtered = lc
    ? allApps.filter(
        (a) =>
          APP_LABELS[a.id].toLowerCase().includes(lc) ||
          a.description.toLowerCase().includes(lc) ||
          a.keywords.some((k) => k.toLowerCase().includes(lc)),
      )
    : allApps;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="glass-elevated fixed z-[9998] flex flex-col overflow-hidden rounded-2xl"
            style={{
              width: 340,
              maxHeight: maxH,
              bottom: 64,
              left: 16,
              boxShadow:
                "0 12px 48px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ padding: "10px 12px 8px" }}>
              <div
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--place-border-subtle)",
                }}
              >
                <SearchIcon size={13} />
                <input
                  type="text"
                  placeholder="Search surfaces..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent outline-none"
                  style={{
                    color: "var(--place-text-primary)",
                    fontSize: "0.72rem",
                    border: "none",
                  }}
                />
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto"
              style={{ scrollbarGutter: "stable" }}
            >
              {!lc && (
                <FavoritesRow favorites={favorites} onLaunch={handleLaunch} />
              )}
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    fontSize: "0.7rem",
                    color: "var(--place-text-muted)",
                  }}
                >
                  No matching surfaces
                </div>
              ) : (
                filtered.map((app) => (
                  <AppRow
                    key={app.id}
                    app={app}
                    onLaunch={handleLaunch}
                    onContextMenu={handleContextMenu}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ctxMenu && (
          <LauncherContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            appId={ctxMenu.appId}
            isFavorite={favorites.includes(ctxMenu.appId)}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
