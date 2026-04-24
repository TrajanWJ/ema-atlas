import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { surfaceLinks } from "../app/mock-projections";
export function SurfaceNav() {
    return (_jsx("nav", { className: "ema-surface-nav", "aria-label": "EMA surfaces", children: surfaceLinks.map((surface) => (_jsxs(NavLink, { to: surface.path, end: surface.path === "/", className: ({ isActive }) => isActive ? "ema-surface-nav__item is-active" : "ema-surface-nav__item", children: [_jsx("span", { children: surface.eyebrow }), _jsx("strong", { children: surface.label })] }, surface.id))) }));
}
