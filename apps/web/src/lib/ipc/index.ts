/**
 * Thin wrapper over @ema/surface-core's IPC client.
 *
 * Surfaces only need two hooks in wave 1:
 *   - useProjection(name)          → current snapshot of a named projection
 *   - useCommand()                 → dispatch a command, await its result
 *
 * Everything else (subscribe/unsubscribe, reconnect, projection cache)
 * is owned by @ema/surface-core.
 */

export { IpcProvider } from "./provider";
export { useProjection } from "./use-projection";
export { useCommand } from "./use-command";
