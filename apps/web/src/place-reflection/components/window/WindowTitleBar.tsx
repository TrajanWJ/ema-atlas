"use client";

/**
 * WindowTitleBar — drag-handle + traffic-light controls row.
 *
 * RIP: place.org src/components/window-manager/WindowTitleBar.tsx
 * (direct-rip with provenance; imports rewritten to place-reflection paths).
 */

import { isTouchDevice } from "../../lib/popout-launcher";

interface WindowTitleBarProps {
  readonly appName: string;
  readonly onMinimize: () => void;
  readonly onMaximize: () => void;
  readonly onClose: () => void;
  readonly onDetach?: () => void;
}

function DetachIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="0.5" y="2.5" width="7" height="7" rx="1" />
      <path d="M5.5 0.5h4v4" />
      <path d="M9.5 0.5 L5.5 4.5" />
    </svg>
  );
}

export function WindowTitleBar({
  appName,
  onMinimize,
  onMaximize,
  onClose,
  onDetach,
}: WindowTitleBarProps) {
  const showDetach = onDetach && !isTouchDevice();

  return (
    <div
      className="ema-window__header drag-handle flex h-9 items-center justify-between px-3 select-none"
      style={{
        borderBottom: "1px solid var(--place-border-default, rgba(255,255,255,0.08))",
        cursor: "grab",
      }}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close window"
          className="ema-window__control ema-window__control--close h-3 w-3 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--place-error, #ff5f57)" }}
        />
        <button
          type="button"
          onClick={onMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Minimize window"
          className="ema-window__control ema-window__control--min h-3 w-3 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--place-tertiary-400, #febc2e)" }}
        />
        <button
          type="button"
          onClick={onMaximize}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Maximize window"
          className="ema-window__control ema-window__control--max h-3 w-3 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--place-success, #28c840)" }}
        />
      </div>

      <span
        style={{
          color: "var(--place-text-secondary, rgba(255,255,255,0.65))",
          fontSize: "0.75rem",
          fontWeight: 500,
          letterSpacing: "0.025em",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {appName}
      </span>

      <div className="flex items-center gap-1.5">
        {showDetach && (
          <button
            type="button"
            onClick={onDetach}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Detach to popout window"
            className="flex h-5 w-5 items-center justify-center rounded transition-opacity hover:opacity-80"
            style={{ color: "var(--place-text-secondary, rgba(255,255,255,0.65))" }}
          >
            <DetachIcon />
          </button>
        )}
      </div>
    </div>
  );
}
