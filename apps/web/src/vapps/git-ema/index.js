import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConnectorsPanel } from "./connectors-panel";
import { AttachmentList } from "./attachment-list";
/**
 * The git-ema vApp page.
 *
 *   scope="user"    — standalone /git-ema page, shows every attachment
 *                     the current user can see + connector management.
 *   scope="project" — rendered from within a project, scoped to that
 *                     project's attachments.
 *
 * The connectors panel is shown in both modes; the attachment list
 * scopes its projection name accordingly.
 */
export function GitEmaPage({ scope }) {
    return (_jsxs("section", { className: "ema-vapp ema-vapp--git-ema", children: [_jsxs("header", { className: "ema-vapp__header", children: [_jsx("p", { className: "ema-kicker", children: "files + repos surface" }), _jsx("h1", { children: "git-ema" }), _jsx("p", { className: "ema-vapp__tagline", children: "Files and codebases, native to EMA." })] }), _jsx(ConnectorsPanel, {}), _jsxs("section", { className: "ema-vapp__section", children: [_jsxs("h2", { children: ["Attachments ", scope === "project" ? "(this project)" : "(all visible)"] }), _jsx(AttachmentList, { scope: scope })] })] }));
}
