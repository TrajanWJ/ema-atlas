import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Region 4 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 4".
// Single row: weekly phase label + compact blocks list + checkups_due chips.
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
export function VcalendarStrip() {
    const { vcalendar, actors } = seeAgentWorkProjection;
    const ownerOf = (actorId) => actorId ? actors.find((a) => a.id === actorId) : undefined;
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-vcal-strip", "aria-label": "vCalendar strip", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "vcalendar strip" }), _jsx("h2", { children: vcalendar.weekly_phase })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-saw-vcal-strip__blocks", children: vcalendar.blocks.map((block) => {
                    const owner = ownerOf(block.actor_id);
                    return (_jsxs("article", { className: "ema-saw-vcal-block", "data-block-kind": block.kind, children: [_jsx("p", { className: "ema-kicker", children: block.kind }), _jsx("strong", { children: block.label }), _jsx("small", { children: owner ? `${owner.kind} · ${owner.display_name}` : "unassigned" })] }, block.id));
                }) }), _jsxs("div", { className: "ema-saw-vcal-strip__checkups", "aria-label": "checkups due", children: [_jsx("span", { className: "ema-kicker", children: "checkups due" }), vcalendar.checkups_due.map((checkup) => (_jsxs("span", { className: "ema-pill ema-saw-vcal-chip", children: [checkup.label, " \u00B7 ", _jsx("small", { children: checkup.cadence })] }, checkup.id)))] })] }));
}
