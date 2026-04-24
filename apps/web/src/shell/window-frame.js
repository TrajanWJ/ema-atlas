import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback } from "react";
/**
 * Window frame — pure geometry chrome for a vApp.
 *
 * The vApp inside is the state owner; the frame itself persists only
 * window geometry (x/y/w/h/z) and minimized state.
 */
export function WindowFrame({ window: win, onFocus, onClose, onMinimize, onMove, onResize, children, }) {
    const frameRef = useRef(null);
    const handleHeaderPointerDown = useCallback((event) => {
        if (event.button !== 0)
            return;
        onFocus();
        const startX = event.clientX;
        const startY = event.clientY;
        const originX = win.x;
        const originY = win.y;
        const onMove = (ev) => {
            onMoveWindow(originX + (ev.clientX - startX), originY + (ev.clientY - startY));
        };
        const onUp = () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
        function onMoveWindow(nextX, nextY) {
            onMoveRef.current(nextX, nextY);
        }
    }, [win.x, win.y, onFocus]);
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;
    const onResizeRef = useRef(onResize);
    onResizeRef.current = onResize;
    const handleResizePointerDown = useCallback((event) => {
        if (event.button !== 0)
            return;
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const originW = win.width;
        const originH = win.height;
        const onMove = (ev) => {
            onResizeRef.current(Math.max(420, originW + (ev.clientX - startX)), Math.max(280, originH + (ev.clientY - startY)));
        };
        const onUp = () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    }, [win.width, win.height]);
    if (win.minimized)
        return null;
    return (_jsxs("section", { ref: frameRef, className: "ema-window", "data-vapp": win.vapp, style: {
            transform: `translate(${win.x}px, ${win.y}px)`,
            width: `${win.width}px`,
            height: `${win.height}px`,
            zIndex: win.z,
        }, onPointerDown: onFocus, "aria-label": `${win.title} window`, children: [_jsxs("div", { className: "ema-window__header", onPointerDown: handleHeaderPointerDown, children: [_jsxs("div", { className: "ema-window__title", children: [_jsx("span", { className: "ema-window__title-eyebrow", children: win.vapp }), _jsx("strong", { children: win.title })] }), _jsxs("div", { className: "ema-window__controls", children: [_jsx("button", { type: "button", className: "ema-window__control ema-window__control--min", onClick: (e) => { e.stopPropagation(); onMinimize(); }, "aria-label": "Minimize window", children: "\u2013" }), _jsx("button", { type: "button", className: "ema-window__control ema-window__control--close", onClick: (e) => { e.stopPropagation(); onClose(); }, "aria-label": "Close window", children: "\u00D7" })] })] }), _jsx("div", { className: "ema-window__body", children: children }), _jsx("button", { type: "button", className: "ema-window__resize", "aria-label": "Resize window", onPointerDown: handleResizePointerDown })] }));
}
