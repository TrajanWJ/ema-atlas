"use client";

/**
 * DesktopSwitcher — virtual-desktop thumbnails with rename/add/remove
 * context menu. Direct-rip from donor; imports swapped to our bridge.
 *
 * RIP: place.org src/components/desktop/DesktopSwitcher.tsx
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useVirtualDesktopStore } from "../../shell-state/virtual-desktop-store-bridge";

interface ContextMenuState {
  readonly x: number;
  readonly y: number;
  readonly desktopId: string | null;
}

function SwitcherContextMenu({
  state,
  onClose,
  onRename,
}: {
  readonly state: ContextMenuState;
  readonly onClose: () => void;
  readonly onRename: (id: string) => void;
}) {
  const addDesktop = useVirtualDesktopStore((s) => s.addDesktop);
  const removeDesktop = useVirtualDesktopStore((s) => s.removeDesktop);
  const desktopCount = useVirtualDesktopStore((s) => s.desktops.length);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", handlePointer);
    });
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [onClose]);

  const items: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }> = [];

  if (state.desktopId) {
    items.push({
      label: "Rename",
      onClick: () => {
        if (state.desktopId) onRename(state.desktopId);
        onClose();
      },
    });
    items.push({
      label: "Remove",
      onClick: () => {
        if (state.desktopId) removeDesktop(state.desktopId);
        onClose();
      },
      disabled: desktopCount <= 1,
    });
  }

  items.push({
    label: "Add Desktop",
    onClick: () => {
      addDesktop();
      onClose();
    },
    disabled: desktopCount >= 8,
  });

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: state.y,
        left: state.x,
        minWidth: 140,
        padding: 4,
        borderRadius: 8,
        background: "rgba(20, 20, 30, 0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 9999,
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={item.onClick}
          style={{
            display: "flex",
            width: "100%",
            padding: "5px 10px",
            borderRadius: 5,
            border: "none",
            background: "transparent",
            color: item.disabled
              ? "rgba(255,255,255,0.25)"
              : "var(--place-text-primary, #fff)",
            fontSize: 12,
            cursor: item.disabled ? "not-allowed" : "default",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function DesktopThumbnail({
  id,
  name,
  windowCount,
  isActive,
  index,
  onSwitch,
  onContextMenu,
}: {
  readonly id: string;
  readonly name: string;
  readonly windowCount: number;
  readonly isActive: boolean;
  readonly index: number;
  readonly onSwitch: (id: string) => void;
  readonly onContextMenu: (e: React.MouseEvent, id: string) => void;
}) {
  const handleClick = useCallback(() => onSwitch(id), [onSwitch, id]);

  const handleCtx = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, id);
    },
    [onContextMenu, id],
  );

  const windowLabel = windowCount === 1 ? "1 window" : `${windowCount} windows`;
  const tooltip = `${name} (${windowLabel})`;
  const dotCount = Math.min(windowCount, 5);

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleCtx}
      title={tooltip}
      className={[
        "relative flex flex-col items-center justify-center gap-0.5",
        "w-10 h-7 rounded-md text-[10px] font-medium transition-all duration-150",
        "hover:bg-white/15",
        isActive
          ? "bg-white/10 border border-teal-400/60 text-white shadow-[0_0_6px_rgba(45,212,191,0.2)]"
          : "bg-white/5 border border-white/10 text-white/60",
      ].join(" ")}
    >
      <span className="leading-none">{index + 1}</span>
      {dotCount > 0 && (
        <div className="flex gap-px">
          {Array.from({ length: dotCount }, (_, i) => (
            <span
              key={`dot-${id}-${i}`}
              className={[
                "block w-1 h-1 rounded-full",
                isActive ? "bg-teal-400/80" : "bg-white/30",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </button>
  );
}

function RenameInput({
  desktopId,
  currentName,
  onClose,
}: {
  readonly desktopId: string;
  readonly currentName: string;
  readonly onClose: () => void;
}) {
  const renameDesktop = useVirtualDesktopStore((s) => s.renameDesktop);
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      renameDesktop(desktopId, trimmed);
    }
    onClose();
  }, [value, currentName, desktopId, renameDesktop, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Escape") onClose();
    },
    [handleSubmit, onClose],
  );

  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[100]">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="w-28 rounded-md bg-black/80 border border-white/20 px-2 py-1 text-xs text-white outline-none focus:border-teal-400/60"
        maxLength={20}
      />
    </div>
  );
}

export function DesktopSwitcher() {
  const desktops = useVirtualDesktopStore((s) => s.desktops);
  const activeDesktopId = useVirtualDesktopStore((s) => s.activeDesktopId);
  const switchTo = useVirtualDesktopStore((s) => s.switchTo);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);

  const handleRename = useCallback((id: string) => {
    setRenamingId(id);
  }, []);

  const handleCloseRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleThumbnailCtx = useCallback((e: React.MouseEvent, id: string) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, desktopId: id });
  }, []);

  const handleEmptyCtx = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, desktopId: null });
  }, []);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  return (
    <div
      className="relative flex items-center gap-1"
      onContextMenu={handleEmptyCtx}
      title="Virtual desktops"
    >
      {desktops.map((desktop, index) => (
        <div key={desktop.id} className="relative">
          <DesktopThumbnail
            id={desktop.id}
            name={desktop.name}
            windowCount={desktop.windowIds.length}
            isActive={desktop.id === activeDesktopId}
            index={index}
            onSwitch={switchTo}
            onContextMenu={handleThumbnailCtx}
          />
          {renamingId === desktop.id && (
            <RenameInput
              desktopId={desktop.id}
              currentName={desktop.name}
              onClose={handleCloseRename}
            />
          )}
        </div>
      ))}
      {ctxMenu && (
        <SwitcherContextMenu
          state={ctxMenu}
          onClose={closeCtxMenu}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
