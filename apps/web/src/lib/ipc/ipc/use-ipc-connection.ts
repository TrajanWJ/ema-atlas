import { useContext, useEffect, useState } from "react";
import { IpcContext } from "./provider";
import type { ConnectionState } from "@ema/surface-core/ipc-client";

/**
 * Returns the current daemon-IPC connection state. Lets surfaces show
 * a clear "offline / reconnecting" indicator instead of inferring it
 * from a `null` projection.
 */
export function useIpcConnection(): ConnectionState {
  const client = useContext(IpcContext);
  const [state, setState] = useState<ConnectionState>(
    client ? client.getConnectionState() : "idle",
  );

  useEffect(() => {
    if (!client) return;
    const unsub = client.subscribeConnection(setState);
    return unsub;
  }, [client]);

  return state;
}
