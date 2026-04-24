import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RIP: codebase-agent-os-bridge mission/handoff/proposal state transitions
//      (adapt — idea→ready→active→review→blocked→done columns, donor vocab)
// Region 3 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 3".
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
const COLUMNS = ["idea", "ready", "active", "review", "blocked", "done"];
export function LaneBoard() {
    const { lanes, actors } = seeAgentWorkProjection;
    const ownerOf = (actorId) => actorId ? actors.find((a) => a.id === actorId) : undefined;
    const bucketed = {
        idea: [],
        ready: [],
        active: [],
        review: [],
        blocked: [],
        done: [],
    };
    for (const lane of lanes) {
        const col = COLUMNS.includes(lane.status)
            ? lane.status
            : "active";
        bucketed[col].push(lane);
    }
    return (_jsxs("section", { className: "ema-panel ema-panel--wide ema-saw-region ema-saw-lane-board", "aria-label": "Lane board", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "lane board" }), _jsx("h2", { children: "Lanes by state" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-saw-lane-board__grid", children: COLUMNS.map((col) => (_jsxs("div", { className: "ema-saw-lane-column", "data-column": col, children: [_jsxs("header", { className: "ema-saw-lane-column__heading", children: [_jsx("span", { className: "ema-kicker", children: col }), _jsx("strong", { children: bucketed[col].length })] }), _jsxs("ol", { className: "ema-saw-lane-column__list", children: [bucketed[col].length === 0 && (_jsx("li", { className: "ema-saw-lane-column__empty", children: "no lanes in this column" })), bucketed[col].map((lane) => {
                                    const owner = ownerOf(lane.owner_actor_id);
                                    return (_jsxs("li", { className: "ema-saw-lane-card", children: [_jsx("p", { className: "ema-kicker", children: owner ? `${owner.kind} · ${owner.display_name}` : "unassigned" }), _jsx("strong", { children: lane.title }), _jsx("code", { className: "ema-saw-cli", children: lane.cli }), _jsx("footer", { children: _jsx("span", { className: "ema-pill ema-pill--hot", children: "pending daemon writer" }) })] }, lane.id));
                                })] })] }, col))) })] }));
}
