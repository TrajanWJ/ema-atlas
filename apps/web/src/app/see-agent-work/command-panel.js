import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Region 6 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 6".
// Six mocked buttons from seeAgentWorkProjection.controls. Each: label +
// state pill + CLI string + copy-CLI affordance. Clicking the button itself
// is a no-op with a `pending daemon writer` tooltip.
import { useCallback, useState } from "react";
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";
export function CommandPanel() {
    const { controls } = seeAgentWorkProjection;
    const [copiedId, setCopiedId] = useState(null);
    const copy = useCallback((label, command) => {
        if (typeof navigator === "undefined" || !navigator.clipboard)
            return;
        navigator.clipboard.writeText(command).then(() => {
            setCopiedId(label);
            setTimeout(() => setCopiedId((prev) => (prev === label ? null : prev)), 1400);
        });
    }, []);
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-command-panel", "aria-label": "Command panel", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "command panel" }), _jsx("h2", { children: "Mocked controls \u00B7 CLI parity" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-saw-command-panel__grid", children: controls.map((control) => (_jsxs("article", { className: "ema-saw-cmd-btn", "data-state": control.state, children: [_jsxs("button", { type: "button", className: "ema-saw-cmd-btn__action", onClick: (e) => {
                                e.preventDefault();
                                // pending daemon writer — no side effect
                            }, "aria-label": `${control.label} (pending daemon writer)`, title: "pending daemon writer \u2014 click has no side effect", children: [_jsx("span", { children: control.label }), _jsx("strong", { children: control.state }), _jsx("small", { className: "ema-saw-cmd-btn__hint", children: "pending daemon writer" })] }), _jsx("code", { className: "ema-saw-cli", children: control.command }), _jsx("button", { type: "button", className: "ema-saw-cmd-btn__copy", onClick: () => copy(control.label, control.command), children: copiedId === control.label ? "copied" : "copy cli" })] }, control.label))) })] }));
}
