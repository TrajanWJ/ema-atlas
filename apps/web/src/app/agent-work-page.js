import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RIP: codebase-frontend-layer read-only observer posture
//      (adopt — this file never writes canon; every data source is a
//      projection or a mock, and every control is pending daemon writer)
//
// See Agent Work first screen per docs/vapps/see-agent-work.md §"First Screen"
// and SURFACE-SLICE-A.md §"Outcome". Eight regions, dense, honest mocks,
// CLI-parity, no UI-local state treated as canon.
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "./mock-projections";
import { AgentInstructionPanel, AgentRoster, ChronicleStrip, CommandPanel, LaneBoard, MissionRail, TopSwarmPulse, VcalendarStrip, } from "./see-agent-work";
export function AgentWorkPage() {
    const swarmName = seeAgentWorkProjection.swarms[0]?.name ?? "EMA 0.0.5 swarm";
    return (_jsxs("section", { className: "ema-vapp ema-vapp--agent-work ema-saw-root", children: [_jsxs("header", { className: "ema-vapp__header ema-vapp__header--split ema-saw-header", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "See Agent Work" }), _jsx("h1", { children: "Swarm control room" }), _jsx("p", { className: "ema-vapp__tagline", children: "Dense, operator-grade surface for coordinating external Codex, Claude CLI, and human founder work across missions, campaigns, lanes, handoffs, and vCalendar time \u2014 without pretending mocked controls executed real work." }), _jsxs("p", { className: "ema-saw-header__meta", children: [_jsx("code", { children: swarmName }), " \u00B7 ", seeAgentWorkProjection.missions.length, " ", "missions \u00B7 ", seeAgentWorkProjection.lanes.length, " lanes \u00B7", " ", seeAgentWorkProjection.handoffs.length, " handoffs"] })] }), _jsxs("aside", { className: "ema-saw-header__notice", "aria-label": "projection notice", children: [_jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL }), _jsx("strong", { children: "Every region is honest about its source." }), _jsxs("p", { children: ["Live panels render from daemon projections. Mock panels carry a visible tag. Controls are ", _jsx("code", { children: "pending daemon writer" }), "."] })] })] }), _jsx(TopSwarmPulse, {}), _jsx(MissionRail, {}), _jsx(LaneBoard, {}), _jsxs("div", { className: "ema-saw-row ema-saw-row--vcal-roster", children: [_jsx(VcalendarStrip, {}), _jsx(AgentRoster, {})] }), _jsxs("div", { className: "ema-saw-row ema-saw-row--command-prompt", children: [_jsx(CommandPanel, {}), _jsx(AgentInstructionPanel, {})] }), _jsx(ChronicleStrip, {})] }));
}
