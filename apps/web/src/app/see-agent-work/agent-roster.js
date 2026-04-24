import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RIP: codebase-mission-control-claude hierarchical-roles / agent-status panel
//      (inspire — display only; enforcement lands with ema_memberships writer)
// Region 5 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 5".
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
export function AgentRoster() {
    const { actors, lanes } = seeAgentWorkProjection;
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-roster", "aria-label": "Agent roster", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "agent roster" }), _jsx("h2", { children: "Who is in the room" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-saw-roster__grid", children: actors.map((actor) => {
                    const activeLanes = lanes.filter((l) => l.owner_actor_id === actor.id && l.status === "active");
                    return (_jsxs("article", { className: "ema-saw-actor-card", "data-actor-kind": actor.kind, children: [_jsxs("header", { children: [_jsx("p", { className: "ema-kicker", children: actor.kind }), _jsx("strong", { children: actor.display_name })] }), _jsxs("dl", { className: "ema-saw-actor-card__meta", children: [_jsxs("div", { children: [_jsx("dt", { children: "role" }), _jsxs("dd", { children: [actor.role, _jsx("span", { className: "ema-pill ema-pill--hot ema-saw-pill-tight", children: "display only \u2014 not yet enforced" })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "current lane" }), _jsx("dd", { children: actor.current_lane })] }), _jsxs("div", { children: [_jsx("dt", { children: "active lane count" }), _jsxs("dd", { children: [activeLanes.length, _jsx("span", { className: "ema-pill ema-pill--hot ema-saw-pill-tight", children: "pending daemon writer" })] })] })] })] }, actor.id));
                }) })] }));
}
