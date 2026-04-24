import { useContext, useEffect, useState } from "react";
import { IpcContext } from "./provider";
/**
 * Subscribe to a named projection and return its latest snapshot (or
 * `null` if the daemon hasn't sent one yet, e.g. offline).
 */
export function useProjection(name) {
    const client = useContext(IpcContext);
    const [data, setData] = useState(null);
    useEffect(() => {
        if (!client)
            return;
        const unsub = client.subscribeProjection(name, setData);
        return unsub;
    }, [client, name]);
    return data;
}
