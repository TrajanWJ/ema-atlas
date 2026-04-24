import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { SurfaceNav } from "./surface-nav";
import { Topbar } from "./topbar";
/**
 * ShellLayout — the frame every route renders inside.
 *
 * Topbar carries org/space/project selectors; body is the current
 * route's element.
 */
export function ShellLayout() {
    return (_jsxs("div", { className: "ema-shell", children: [_jsx(Topbar, {}), _jsxs("div", { className: "ema-shell__grid", children: [_jsx(SurfaceNav, {}), _jsx("main", { className: "ema-shell__body", children: _jsx(Outlet, {}) })] })] }));
}
