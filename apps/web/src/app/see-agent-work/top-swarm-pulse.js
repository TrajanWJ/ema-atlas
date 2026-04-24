import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RIP: codebase-frontend-layer operator-dashboard pulse grid
//      (adapt — reuses existing .ema-pulse-grid instead of donor Tailwind)
// Region 1 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 1".
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
export function TopSwarmPulse() {
    const { swarms, lanes, blocked_work, vcalendar } = seeAgentWorkProjection;
    const activeLanes = lanes.filter((l) => l.status === "active").length;
    const nextCheckup = vcalendar.checkups_due[0];
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-pulse", "aria-label": "Top swarm pulse", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "top swarm pulse" }), _jsx("h2", { children: "Live control room" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsxs("div", { className: "ema-pulse-grid ema-saw-pulse__grid", children: [_jsxs("article", { className: "ema-pulse-card", "data-saw-pulse": "swarms", children: [_jsx("span", { children: "active swarms" }), _jsx("strong", { children: swarms.length }), _jsx("p", { children: swarms[0]?.name ?? "no swarm active" })] }), _jsxs("article", { className: "ema-pulse-card", "data-saw-pulse": "lanes", children: [_jsx("span", { children: "active lanes" }), _jsx("strong", { children: activeLanes }), _jsxs("p", { children: ["of ", lanes.length, " total across all missions"] })] }), _jsxs("article", { className: "ema-pulse-card", "data-saw-pulse": "blocked", children: [_jsx("span", { children: "blocked items" }), _jsx("strong", { children: blocked_work.length }), _jsx("p", { children: blocked_work[0] ?? "no blockers" })] }), _jsxs("article", { className: "ema-pulse-card", "data-saw-pulse": "checkup", children: [_jsx("span", { children: "next checkup" }), _jsx("strong", { children: nextCheckup ? nextCheckup.label : "—" }), _jsx("p", { children: nextCheckup ? nextCheckup.cadence : "no checkups scheduled" })] })] })] }));
}
