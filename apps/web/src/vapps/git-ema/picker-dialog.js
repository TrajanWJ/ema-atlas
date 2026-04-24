import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useCommand } from "../../lib/ipc";
/**
 * Fake picker dialog. Fetches the daemon's hard-coded demo catalog for
 * the given connector and lets the user create attachments from any
 * picked item. No real API call.
 */
export function PickerDialog({ connector, onClose, }) {
    const dispatch = useCommand();
    const [items, setItems] = useState([]);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await dispatch("connector.list_picker_items", {
                connector_id: connector.id,
            });
            if (cancelled)
                return;
            // The daemon returns `picker_items` inline on command_result for
            // this query-style command; see shell-protocol.md.
            // Using `any` here because the CommandResult type upstream keeps
            // query payloads loose until typed bindings generate.
            const picker = res.picker_items ?? [];
            setItems(picker);
        })();
        return () => {
            cancelled = true;
        };
    }, [connector.id, dispatch]);
    async function importOne(item) {
        setBusy(true);
        try {
            await dispatch("connector.import_resource", {
                connector_id: connector.id,
                picker_item_id: item.id,
            });
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "ema-modal", role: "dialog", "aria-label": "Browse source", children: [_jsx("div", { className: "ema-modal__backdrop", onClick: onClose }), _jsxs("div", { className: "ema-modal__panel", children: [_jsxs("header", { className: "ema-modal__header", children: [_jsxs("h3", { children: ["Browse ", connector.display_label] }), _jsx("button", { onClick: onClose, children: "Close" })] }), _jsxs("ul", { className: "ema-picker__list", children: [items.length === 0 && _jsx("li", { children: "(nothing to show)" }), items.map((it) => (_jsxs("li", { className: "ema-picker__item", children: [_jsx("span", { children: it.display_name }), _jsx("span", { className: "ema-picker__kind", children: it.kind_hint }), _jsx("button", { onClick: () => importOne(it), disabled: busy, children: "Import" })] }, it.id)))] })] })] }));
}
