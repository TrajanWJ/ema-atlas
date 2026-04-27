"use client";

/**
 * Tooltip — lightweight hover tooltip. Donor's Place has a more elaborate
 * floating-ui-based Tooltip; we mirror the minimum surface (children +
 * content + delay) so DockIcon compiles. Positions the content above the
 * trigger with a configurable delay.
 *
 * RIP: place.org visual style (glass panel, text-secondary color) — logic
 *      is our own; this is Category A chrome.
 */

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";

interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly delay?: number;
  readonly placement?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  delay = 400,
  placement = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      switch (placement) {
        case "top":
          setCoords({ x: centerX, y: rect.top - 8 });
          break;
        case "bottom":
          setCoords({ x: centerX, y: rect.bottom + 8 });
          break;
        case "left":
          setCoords({ x: rect.left - 8, y: rect.top + rect.height / 2 });
          break;
        case "right":
          setCoords({ x: rect.right + 8, y: rect.top + rect.height / 2 });
          break;
      }
      setOpen(true);
    }, delay);
  }, [delay, placement]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const transform =
    placement === "top"
      ? "translate(-50%, -100%)"
      : placement === "bottom"
        ? "translate(-50%, 0)"
        : placement === "left"
          ? "translate(-100%, -50%)"
          : "translate(0, -50%)";

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      <AnimatePresence>
        {open && coords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.y,
              left: coords.x,
              transform,
              zIndex: 9999,
              pointerEvents: "none",
              padding: "6px 8px",
              borderRadius: 8,
              background: "var(--place-surface-1, rgba(20,20,30,0.92))",
              border: "1px solid var(--place-border-default, rgba(255,255,255,0.1))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: "var(--place-text-primary, #fff)",
              fontSize: "0.7rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
