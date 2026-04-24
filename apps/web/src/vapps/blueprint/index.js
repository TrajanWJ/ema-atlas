import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { MOCK_PROJECTION_LABEL, blueprintProjection, } from "../../app/mock-projections";
import { useProjection } from "../../lib/ipc";
import { AttachDialog } from "../git-ema/attach-to-object";
/**
 * Blueprint vApp page (wave 1 stub).
 *
 * Renders the current project's section tree from the `blueprint.sections`
 * projection. Each section has an "Attach…" button that opens git-ema's
 * shared attach dialog targeting that section.
 *
 * No prose editing. No Yjs. That's a later wave.
 */
export function BlueprintPage() {
    const sections = useProjection("blueprint.sections");
    const isMock = sections == null;
    const documents = sections?.documents ?? blueprintProjection.documents;
    const [attachTarget, setAttachTarget] = useState(null);
    if (documents.length === 0) {
        return (_jsxs("section", { className: "ema-vapp ema-vapp--blueprint", children: [_jsx("h1", { children: "Blueprint" }), _jsx("p", { children: "No documents in this project yet." })] }));
    }
    return (_jsxs("section", { className: "ema-vapp ema-vapp--blueprint", children: [_jsxs("header", { className: "ema-vapp__header ema-vapp__header--split", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "project map" }), _jsx("h1", { children: "Blueprint" }), _jsx("p", { className: "ema-vapp__tagline", children: "Project sections and attachment targets for the operational shell." })] }), isMock && (_jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL }))] }), documents.map((doc) => (_jsxs("article", { className: "ema-bp-doc", children: [_jsx("h2", { children: doc.title }), _jsx(SectionTree, { sections: doc.sections, onAttach: (sectionId) => setAttachTarget({ sectionId }) })] }, doc.id))), attachTarget && (_jsx(AttachDialog, { object: {
                    object_kind: "blueprint_section",
                    object_id: attachTarget.sectionId,
                }, onClose: () => setAttachTarget(null) }))] }));
}
function SectionTree({ sections, onAttach, }) {
    return (_jsx("ul", { className: "ema-bp-section-tree", children: sections.map((s) => (_jsxs("li", { children: [_jsx("span", { className: "ema-bp-section__title", children: s.title }), _jsx("button", { className: "ema-bp-section__attach", onClick: () => onAttach(s.id), children: "Attach\u2026" }), s.children && s.children.length > 0 && (_jsx(SectionTree, { sections: s.children, onAttach: onAttach }))] }, s.id))) }));
}
