import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";
export function ProjectSelector() {
    const topbar = useProjection("topbar");
    const projects = topbar?.projects ?? mockTopbar.projects;
    const current = topbar?.current_project ?? mockTopbar.current_project;
    return (_jsxs("select", { className: "ema-selector ema-selector--project", value: current?.id ?? "", onChange: (e) => {
            /* TODO(ema-0.0.5): dispatch a "select project" IPC command */
            void e;
        }, disabled: projects.length === 0, children: [projects.length === 0 && _jsx("option", { value: "", children: "(no projects)" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }));
}
