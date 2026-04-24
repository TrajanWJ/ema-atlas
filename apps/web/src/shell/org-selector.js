import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";
export function OrgSelector() {
    const topbar = useProjection("topbar");
    const orgs = topbar?.orgs ?? mockTopbar.orgs;
    const current = topbar?.current_org ?? mockTopbar.current_org;
    return (_jsxs("select", { className: "ema-selector ema-selector--org", value: current?.id ?? "", onChange: (e) => {
            /* TODO(ema-0.0.5): dispatch a "select org" IPC command */
            void e;
        }, disabled: orgs.length === 0, children: [orgs.length === 0 && _jsx("option", { value: "", children: "(no orgs)" }), orgs.map((o) => (_jsx("option", { value: o.id, children: o.name }, o.id)))] }));
}
