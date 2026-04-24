import { useContext } from "react";
import { IpcContext } from "./provider";
/**
 * Returns a function that dispatches a command to the daemon and
 * resolves with the result.
 *
 * Surfaces NEVER mutate canonical state themselves. Every mutation flows
 * through this.
 */
export function useCommand() {
    const client = useContext(IpcContext);
    return async function dispatch(op, args = {}) {
        if (!client) {
            return {
                ok: false,
                error: { class: "internal", message: "ipc client not mounted" },
            };
        }
        return client.sendCommand(op, args);
    };
}
