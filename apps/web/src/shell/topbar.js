import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
import { OrgSelector } from "./org-selector";
import { SpaceSelector } from "./space-selector";
import { ProjectSelector } from "./project-selector";
import { ConnectorsIndicator } from "./connectors-indicator";
import { MOCK_PROJECTION_LABEL, mockTopbar } from "../app/mock-projections";
/**
 * Topbar — always renders three selectors (org / space / project),
 * plus the connectors indicator (lit when any connector is connected).
 *
 * Selectors prefer daemon projections. When the daemon has not provided
 * data, the shell renders a visibly labeled mock local projection.
 */
export function Topbar() {
    const topbar = useProjection("topbar");
    const current = topbar?.current_project ?? mockTopbar.current_project;
    const offline = topbar == null;
    return (_jsxs("header", { className: "ema-topbar", "data-offline": offline ? "true" : "false", children: [_jsxs("div", { className: "ema-topbar__brand", "aria-label": "EMA home", children: [_jsx("span", { children: "EMA" }), _jsx("small", { children: "0.0.5" })] }), _jsxs("div", { className: "ema-topbar__selectors", children: [_jsx(OrgSelector, {}), _jsx("span", { className: "ema-topbar__sep", children: "/" }), _jsx(SpaceSelector, {}), _jsx("span", { className: "ema-topbar__sep", children: "/" }), _jsx(ProjectSelector, {})] }), _jsxs("div", { className: "ema-topbar__project-sense", children: [_jsx("span", { children: "project" }), _jsx("strong", { children: current.name })] }), _jsxs("div", { className: "ema-topbar__right", children: [_jsx(ConnectorsIndicator, {}), offline && (_jsx("span", { className: "ema-topbar__badge", children: MOCK_PROJECTION_LABEL }))] })] }));
}
