import { useProjection } from "../lib/ipc";
import { gitEmaUserConnectorsProjection } from "../app/mock-projections";
import { useShell } from "./virtual-desktop-shell";

/**
 * Tiny badge that lights up when any connector is connected. Clicking
 * it opens (or focuses) the git-ema window through the shell context.
 */
export function ConnectorsIndicator() {
  const p = useProjection("git_ema.user_connectors");
  const connectors: Array<{ status: string }> =
    p?.connectors ?? gitEmaUserConnectorsProjection.connectors;
  const anyConnected = connectors.some((c) => c.status === "connected");
  const { openSurface } = useShell();

  return (
    <button
      type="button"
      onClick={() => openSurface("git-ema")}
      className="ema-connectors-indicator"
      data-on={anyConnected ? "true" : "false"}
      aria-label="git-ema connectors"
      title={anyConnected ? "git-ema connectors connected" : "git-ema"}
    >
      ◈ git-ema
    </button>
  );
}
