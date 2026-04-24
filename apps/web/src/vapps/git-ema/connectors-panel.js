import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { MOCK_PROJECTION_LABEL, gitEmaUserConnectorsProjection, } from "../../app/mock-projections";
import { useCommand, useProjection } from "../../lib/ipc";
import { PickerDialog } from "./picker-dialog";
const PROVIDERS = [
    { id: "google_drive", label: "Google Drive" },
    { id: "github", label: "GitHub" },
];
/**
 * Demo OAuth buttons + connected-state management.
 *
 * Everything here is stubbed. `connector.connect` appends a
 * `connector.connected` event in the daemon with `fake: true`.
 * Nothing talks to the real Google or GitHub.
 */
export function ConnectorsPanel() {
    const p = useProjection("git_ema.user_connectors");
    const isMock = p == null;
    const connectors = p?.connectors ?? gitEmaUserConnectorsProjection.connectors;
    const dispatch = useCommand();
    const [pickerFor, setPickerFor] = useState(null);
    function byProvider(pid) {
        return connectors.find((c) => c.provider === pid);
    }
    async function connect(provider) {
        await dispatch("connector.connect", { provider });
    }
    async function disconnect(connectorId) {
        await dispatch("connector.disconnect", { connector_id: connectorId });
    }
    return (_jsxs("section", { className: "ema-connectors-panel ema-vapp__section", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "connector projection" }), _jsx("h2", { children: "Connectors" })] }), isMock && (_jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL }))] }), _jsx("p", { className: "ema-connectors-panel__note", children: "Demo mode \u2014 clicking connects a fake account. Real OAuth lands in a later wave." }), _jsx("ul", { className: "ema-connectors-panel__list", children: PROVIDERS.map(({ id, label }) => {
                    const c = byProvider(id);
                    const connected = c?.status === "connected";
                    return (_jsxs("li", { className: "ema-connector-row", children: [_jsx("span", { className: "ema-connector-row__label", children: label }), _jsx("span", { className: "ema-connector-row__state", children: connected ? c?.display_label : "not connected" }), connected ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setPickerFor(c), disabled: isMock, children: "Browse\u2026" }), _jsx("button", { onClick: () => disconnect(c.id), disabled: isMock, children: "Disconnect" })] })) : (_jsxs("button", { onClick: () => connect(id), disabled: isMock, children: ["Connect ", label] }))] }, id));
                }) }), pickerFor && (_jsx(PickerDialog, { connector: pickerFor, onClose: () => setPickerFor(null) }))] }));
}
