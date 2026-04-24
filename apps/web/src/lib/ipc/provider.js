import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useEffect, useMemo, useState } from "react";
import { createIpcClient } from "@ema/surface-core/ipc-client";
export const IpcContext = createContext(null);
export function IpcProvider({ children }) {
    const [client] = useState(() => createIpcClient({
        url: inferDaemonUrl(),
        surface: "web",
    }));
    useEffect(() => {
        client.connect();
        return () => client.disconnect();
    }, [client]);
    const value = useMemo(() => client, [client]);
    return _jsx(IpcContext.Provider, { value: value, children: children });
}
function inferDaemonUrl() {
    // In dev the daemon is on 127.0.0.1:49555. Surfaces never talk to a
    // remote host; EMA's remote reach is daemon→daemon replication.
    return "ws://127.0.0.1:49555";
}
