import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MOCK_PROJECTION_LABEL, gitEmaAttachmentsProjection, } from "../../app/mock-projections";
import { useCommand, useProjection } from "../../lib/ipc";
export function AttachmentList({ scope }) {
    const projection = scope === "project"
        ? "git_ema.project_attachments"
        : "git_ema.user_attachments";
    const p = useProjection(projection);
    const isMock = p == null;
    const attachments = p?.attachments ?? gitEmaAttachmentsProjection.attachments;
    const dispatch = useCommand();
    if (attachments.length === 0) {
        return _jsx("p", { className: "ema-attachments__empty", children: "No attachments yet." });
    }
    async function remove(id) {
        await dispatch("attachment.delete", { attachment_id: id });
    }
    return (_jsxs(_Fragment, { children: [isMock && (_jsxs("p", { className: "ema-projection-note", children: ["Showing ", MOCK_PROJECTION_LABEL, "; delete buttons are disabled until a daemon projection is present."] })), _jsx("ul", { className: "ema-attachments__list", children: attachments.map((a) => (_jsxs("li", { className: "ema-attachment-row", children: [_jsx("span", { className: "ema-attachment-row__kind", "data-kind": a.kind, children: iconFor(a.kind) }), _jsx("span", { className: "ema-attachment-row__name", children: a.display_name }), _jsx("span", { className: "ema-attachment-row__source", children: a.source }), _jsx("button", { onClick: () => remove(a.id), disabled: isMock, children: "Delete" })] }, a.id))) })] }));
}
function iconFor(kind) {
    switch (kind) {
        case "git_repo":
        case "git_path":
            return "⎇";
        case "drive_file":
        case "drive_folder":
            return "▤";
        case "folder":
            return "▥";
        default:
            return "◻";
    }
}
