"use client";

/**
 * DockContextMenu — portalled right-click menu for dock icons. Self-
 * contained (no store or donor-hook imports), so this is a verbatim
 * direct-rip.
 *
 * RIP: place.org src/components/desktop/DockContextMenu.tsx
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface MenuItemDef {
  readonly label: string;
  readonly onClick: () => void;
}

type MenuEntry = MenuItemDef | "separator";

export interface DockContextMenuState {
  readonly isOpen: boolean;
  readonly x: number;
  readonly y: number;
  readonly items: readonly MenuEntry[];
}

const CLOSED: DockContextMenuState = { isOpen: false, x: 0, y: 0, items: [] };

export function useDockContextMenu() {
  const [state, setState] = useState<DockContextMenuState>(CLOSED);

  const open = useCallback(
    (x: number, y: number, items: readonly MenuEntry[]) => {
      setState({ isOpen: true, x, y, items });
    },
    [],
  );

  const close = useCallback(() => setState(CLOSED), []);

  return { state, open, close };
}

function DockMenuItem({
  item,
  onClose,
}: {
  readonly item: MenuEntry;
  readonly onClose: () => void;
}) {
  if (item === "separator") {
    return (
      <div
        role="separator"
        className="my-1 h-px"
        style={{ backgroundColor: "var(--place-border-subtle)" }}
      />
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-[6px] px-3 py-1.5 text-left text-sm transition-colors"
      style={{ color: "var(--place-text-primary)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
      }}
      onClick={() => {
        item.onClick();
        onClose();
      }}
    >
      <span>{item.label}</span>
    </button>
  );
}

interface DockContextMenuProps {
  readonly state: DockContextMenuState;
  readonly onClose: () => void;
}

export function DockContextMenu({ state, onClose }: DockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [state.isOpen, onClose]);

  useEffect(() => {
    if (!state.isOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointer);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [state.isOpen, onClose]);

  const MENU_W = 200;
  const MENU_H = 180;
  const x = Math.min(state.x, typeof window !== "undefined" ? window.innerWidth - MENU_W - 8 : state.x);
  const y = Math.max(8, state.y - MENU_H);

  const portal = (
    <AnimatePresence>
      {state.isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-label="Dock icon context menu"
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="fixed z-[9999] min-w-[180px] rounded-[10px] p-1.5"
          style={{
            top: y,
            left: x,
            transformOrigin: "bottom left",
            background: "var(--place-surface-1)",
            border: "1px solid var(--place-border-default)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {state.items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <DockMenuItem key={i} item={item} onClose={onClose} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(portal, document.body);
}
