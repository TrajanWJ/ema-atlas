import { ReactNode, useRef, useCallback } from "react";
import type { WindowState } from "./window-store";

/**
 * Window frame — pure geometry chrome for a vApp.
 *
 * The vApp inside is the state owner; the frame itself persists only
 * window geometry (x/y/w/h/z) and minimized state.
 */
export function WindowFrame({
  window: win,
  onFocus,
  onClose,
  onMinimize,
  onMove,
  onResize,
  children,
}: {
  window: WindowState;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLElement>(null);

  const handleHeaderPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = win.x;
    const originY = win.y;
    const onMove = (ev: PointerEvent) => {
      onMoveWindow(originX + (ev.clientX - startX), originY + (ev.clientY - startY));
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);

    function onMoveWindow(nextX: number, nextY: number) {
      onMoveRef.current(nextX, nextY);
    }
  }, [win.x, win.y, onFocus]);

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = win.width;
    const originH = win.height;
    const onMove = (ev: PointerEvent) => {
      onResizeRef.current(
        Math.max(420, originW + (ev.clientX - startX)),
        Math.max(280, originH + (ev.clientY - startY)),
      );
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [win.width, win.height]);

  if (win.minimized) return null;

  return (
    <section
      ref={frameRef}
      className="ema-window"
      data-vapp={win.vapp}
      style={{
        transform: `translate(${win.x}px, ${win.y}px)`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.z,
      }}
      onPointerDown={onFocus}
      aria-label={`${win.title} window`}
    >
      <div
        className="ema-window__header"
        onPointerDown={handleHeaderPointerDown}
      >
        <div className="ema-window__title">
          <span className="ema-window__title-eyebrow">{win.vapp}</span>
          <strong>{win.title}</strong>
        </div>
        <div className="ema-window__controls">
          <button
            type="button"
            className="ema-window__control ema-window__control--min"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            aria-label="Minimize window"
          >
            –
          </button>
          <button
            type="button"
            className="ema-window__control ema-window__control--close"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close window"
          >
            ×
          </button>
        </div>
      </div>
      <div className="ema-window__body">{children}</div>
      <button
        type="button"
        className="ema-window__resize"
        aria-label="Resize window"
        onPointerDown={handleResizePointerDown}
      />
    </section>
  );
}
