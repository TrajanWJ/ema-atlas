import { Link } from "react-router-dom";
import { useProjection } from "../lib/ipc";
import { gitEmaUserConnectorsProjection } from "../app/mock-projections";

/**
 * Tiny badge that lights up when any connector is connected. Clicking
 * it routes to the git-ema user-scope page.
 */
export function ConnectorsIndicator() {
  const p = useProjection("git_ema.user_connectors");
  const connectors: Array<{ status: string }> =
    p?.connectors ?? gitEmaUserConnectorsProjection.connectors;
  const anyConnected = connectors.some((c) => c.status === "connected");

  return (
    <Link
      to="/git-ema"
      className="ema-connectors-indicator"
      data-on={anyConnected ? "true" : "false"}
      aria-label="git-ema connectors"
      title={anyConnected ? "git-ema connectors connected" : "git-ema"}
    >
      ◈ git-ema
    </Link>
  );
}
