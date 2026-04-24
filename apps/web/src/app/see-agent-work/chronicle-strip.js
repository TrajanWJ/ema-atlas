import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RIP: lineage-original-elixir-ema @max_events 200 → CHRONICLE_MAX
// RIP: codebase-agent-os-v8 framed WS client UX (visual command vs event)
// Region 8 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 8".
import { useProjection } from "../../lib/ipc";
import { CHRONICLE_MAX, MOCK_PROJECTION_LABEL, seeAgentWorkProjection, } from "../mock-projections";
export function ChronicleStrip() {
    const real = useProjection("event_trail");
    const mock = seeAgentWorkProjection.recent_events;
    const feed = real
        ? real.events.slice(-CHRONICLE_MAX).reverse().map((e) => ({
            ts: e.ts.slice(11, 16) || e.ts,
            actor: "daemon",
            kind: e.kind,
            summary: e.label,
        }))
        : mock.slice(0, CHRONICLE_MAX);
    const isLive = real != null;
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-chronicle", "aria-label": "Chronicle strip", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "chronicle strip" }), _jsx("h2", { children: isLive ? "Daemon event trail" : "Local projection trail" })] }), _jsx("span", { className: isLive ? "ema-pill" : "ema-pill ema-pill--hot", children: isLive ? "live" : MOCK_PROJECTION_LABEL })] }), _jsx("ol", { className: "ema-saw-chronicle__list", "aria-label": `Recent events, capped at ${CHRONICLE_MAX}`, children: feed.map((event, idx) => (_jsxs("li", { className: "ema-saw-chronicle__item", "data-frame": frameBucket(event.kind), children: [_jsx("time", { children: event.ts }), _jsx("span", { className: "ema-saw-chronicle__actor", children: event.actor }), _jsx("span", { className: "ema-saw-chronicle__kind", children: event.kind }), _jsx("span", { className: "ema-saw-chronicle__summary", children: event.summary })] }, `${event.ts}-${idx}`))) }), _jsx("footer", { className: "ema-saw-chronicle__footer", children: _jsxs("small", { children: ["bounded buffer \u00B7 cap CHRONICLE_MAX = ", CHRONICLE_MAX, " · ", "donor lineage-original-elixir-ema"] }) })] }));
}
function frameBucket(kind) {
    if (kind.includes("command"))
        return "command";
    if (kind === "projection" || kind.startsWith("projection"))
        return "projection";
    if (kind === "event" || kind.includes("."))
        return "event";
    return "other";
}
