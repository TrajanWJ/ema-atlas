import { useContext } from "react";
import { IpcContext } from "./provider";
import type { CommandResult } from "@ema/surface-core/ipc-client";

/**
 * Returns a function that dispatches a command to the daemon and
 * resolves with the result.
 *
 * Surfaces NEVER mutate canonical state themselves. Every mutation flows
 * through this.
 */
export function useCommand() {
  const client = useContext(IpcContext);

  return async function dispatch(
    op: string,
    args: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    if (!client) {
      return {
        ok: false,
        error: { class: "internal", message: "ipc client not mounted" },
      };
    }
    return client.sendCommand(op, args);
  };
}
