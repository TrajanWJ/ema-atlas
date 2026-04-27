import { useState } from "react";
import {
  MOCK_PROJECTION_LABEL,
  gitEmaUserConnectorsProjection,
} from "../../app/mock-projections";
import { useCommand, useProjection } from "../../lib/ipc";
import { PickerDialog } from "./picker-dialog";

type Connector = {
  id: string;
  provider: "google_drive" | "github";
  status: "connected" | "disconnected";
  display_label: string;
};

const PROVIDERS: Array<{ id: "google_drive" | "github"; label: string }> = [
  { id: "google_drive", label: "Google Drive" },
  { id: "github", label: "GitHub" },
];

/**
 * Staged OAuth buttons + connected-state management.
 *
 * The local projection shows the intended connector contract while the real
 * Google/GitHub OAuth path remains disabled until the daemon writer lands.
 */
export function ConnectorsPanel() {
  const p = useProjection("git_ema.user_connectors");
  const isMock = p == null;
  const connectors: Connector[] =
    p?.connectors ?? gitEmaUserConnectorsProjection.connectors;
  const dispatch = useCommand();

  const [pickerFor, setPickerFor] = useState<Connector | null>(null);

  function byProvider(pid: Connector["provider"]): Connector | undefined {
    return connectors.find((c) => c.provider === pid);
  }

  async function connect(provider: Connector["provider"]) {
    await dispatch("connector.connect", { provider });
  }

  async function disconnect(connectorId: string) {
    await dispatch("connector.disconnect", { connector_id: connectorId });
  }

  return (
    <section className="ema-connectors-panel ema-vapp__section">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">connector projection</p>
          <h2>Connectors</h2>
        </div>
        {isMock && (
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
        )}
      </div>
      <p className="ema-connectors-panel__note">
        Staged mode — connector actions stay disabled until the daemon OAuth
        writer is present.
      </p>
      <ul className="ema-connectors-panel__list">
        {PROVIDERS.map(({ id, label }) => {
          const c = byProvider(id);
          const connected = c?.status === "connected";
          return (
            <li
              key={id}
              className="ema-connector-row"
              data-connected={connected ? "true" : "false"}
              data-provider={id}
            >
              <span className="ema-connector-row__label">{label}</span>
              <span className="ema-connector-row__state">
                {connected ? c?.display_label : "not connected"}
              </span>
              {connected ? (
                <>
                  <button onClick={() => setPickerFor(c!)} disabled={isMock}>
                    Browse…
                  </button>
                  <button
                    onClick={() => disconnect(c!.id)}
                    disabled={isMock}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button onClick={() => connect(id)} disabled={isMock}>
                  Connect {label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {pickerFor && (
        <PickerDialog
          connector={pickerFor}
          onClose={() => setPickerFor(null)}
        />
      )}
    </section>
  );
}
