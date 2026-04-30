import { useContext, useEffect, useRef } from "react";
import { IpcContext } from "./provider";
import type { ChannelListener } from "@ema/surface-core/ipc-client";

/**
 * Subscribe to a daemon channel and invoke `listener` for every
 * `event`-typed message that arrives on it. Useful for surfaces that
 * need event streams (e.g. chronicles), in addition to the snapshot
 * shape provided by `useProjection`.
 */
export function useChannel(channel: string, listener: ChannelListener) {
  const client = useContext(IpcContext);
  const ref = useRef(listener);
  ref.current = listener;

  useEffect(() => {
    if (!client) return;
    const unsub = client.subscribeChannel(channel, (event) => ref.current(event));
    return unsub;
  }, [client, channel]);
}
