/**
 * Thin wrapper over @ema/surface-core's IPC client.
 *
 * Surface-facing hooks:
 *   - useProjection(name)     → current snapshot of a named projection
 *   - useCommand()            → dispatch a command, await its result
 *   - useChannel(name, fn)    → subscribe to a channel's event stream
 *   - useIpcConnection()      → current ConnectionState (idle/connecting/open/offline/reconnecting)
 *
 * Everything else (subscribe/unsubscribe, reconnect, projection cache,
 * keepalive ping/pong) is owned by @ema/surface-core.
 */

export { IpcProvider } from "./provider";
export { useProjection } from "./use-projection";
export { useCommand } from "./use-command";
export { useChannel } from "./use-channel";
export { useIpcConnection } from "./use-ipc-connection";
