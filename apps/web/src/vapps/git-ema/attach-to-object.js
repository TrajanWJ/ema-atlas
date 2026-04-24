import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCommand, useProjection } from "../../lib/ipc";
/**
 * The shared attach dialog. Any vApp can open this to link an existing
 * attachment to one of its objects. Creating a brand-new attachment (via
 * picker) is done from the git-ema page itself; this dialog only links.
 *
 * Anti-silo rule: other vApps MUST NOT build their own attach UI. They
 * render this.
 */
export function AttachDialog({ object, onClose, }) {
    const p = useProjection("git_ema.user_attachments");
    const attachments = p?.attachments ?? [];
    const dispatch = useCommand();
    async function link(attachmentId) {
        await dispatch("attachment.link", {
            attachment_id: attachmentId,
            object_kind: object.object_kind,
            object_id: object.object_id,
        });
        onClose();
    }
    return (_jsxs("div", { className: "ema-modal", role: "dialog", "aria-label": "Attach to object", children: [_jsx("div", { className: "ema-modal__backdrop", onClick: onClose }), _jsxs("div", { className: "ema-modal__panel", children: [_jsxs("header", { className: "ema-modal__header", children: [_jsxs("h3", { children: ["Attach to ", object.object_kind] }), _jsx("button", { onClick: onClose, children: "Close" })] }), attachments.length === 0 ? (_jsxs("p", { children: ["No attachments yet. Go to", " ", _jsx("a", { href: "/git-ema", children: "git-ema" }), " to import some first."] })) : (_jsx("ul", { className: "ema-attach__list", children: attachments.map((a) => (_jsxs("li", { className: "ema-attach__row", children: [_jsx("span", { children: a.display_name }), _jsxs("span", { className: "ema-attach__meta", children: [a.source, " \u00B7 ", a.kind] }), _jsx("button", { onClick: () => link(a.id), children: "Attach" })] }, a.id))) }))] })] }));
}
