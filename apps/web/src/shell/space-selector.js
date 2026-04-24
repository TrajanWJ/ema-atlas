import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";
export function SpaceSelector() {
    const topbar = useProjection("topbar");
    const spaces = topbar?.spaces ?? mockTopbar.spaces;
    const current = topbar?.current_space ?? mockTopbar.current_space;
    return (_jsxs("select", { className: "ema-selector ema-selector--space", value: current?.id ?? "", onChange: (e) => {
            /* TODO(ema-0.0.5): dispatch a "select space" IPC command */
            void e;
        }, disabled: spaces.length === 0, children: [spaces.length === 0 && _jsx("option", { value: "", children: "(no spaces)" }), spaces.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }));
}
