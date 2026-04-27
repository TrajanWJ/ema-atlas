import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Driver matrix — the five named harness drivers (hermes-native, claude-cli,
 * codex-cli, peer-remote, simulated-tui) laid out against capabilities and
 * runtime shape. Only hermes-native ships today; the rest are planned and the
 * contract surface (Q5) plus the permission-scope mapping (Q10) are still
 * open.
 *
 * Doctrine: EMA owns truth. Hermes owns execution. Drivers live in Hermes;
 * the control plane records what they did, it does not prescribe how.
 */

type DriverStatus = "implemented" | "planned";

const drivers: {
  name: string;
  status: DriverStatus;
  runtime: string;
  produces: string;
}[] = [
  {
    name: "hermes-native",
    status: "implemented",
    runtime: "in-daemon BEAM",
    produces:
      "session_id, provider_id, tool-call output — all written through event_log.",
  },
  {
    name: "claude-cli",
    status: "planned",
    runtime: "external subprocess",
    produces:
      "session_id wrapping the CLI pid, provider_id per model, tool-call output from CLI stream.",
  },
  {
    name: "codex-cli",
    status: "planned",
    runtime: "external subprocess",
    produces:
      "session_id for the codex invocation, provider_id for the codex backend, tool-call output for each codex step.",
  },
  {
    name: "peer-remote",
    status: "planned",
    runtime: "remote peer",
    produces:
      "session_id bound to the peer dispatch, provider_id for the remote engine, tool-call output relayed inward.",
  },
  {
    name: "simulated-tui",
    status: "planned",
    runtime: "simulation",
    produces:
      "session_id for the synthetic run, provider_id marked sim, tool-call output shaped like the real thing.",
  },
];

const capabilities: {
  capability: string;
  support: { driver: string; supported: boolean }[];
  recordedAt: string;
}[] = [
  {
    capability: "streamed-tokens",
    support: [
      { driver: "hermes-native", supported: true },
      { driver: "claude-cli", supported: true },
      { driver: "codex-cli", supported: true },
      { driver: "peer-remote", supported: true },
      { driver: "simulated-tui", supported: false },
    ],
    recordedAt:
      "recorded as token.delta events keyed to the session_id in event_log.",
  },
  {
    capability: "tool-calls",
    support: [
      { driver: "hermes-native", supported: true },
      { driver: "claude-cli", supported: true },
      { driver: "codex-cli", supported: true },
      { driver: "peer-remote", supported: true },
      { driver: "simulated-tui", supported: true },
    ],
    recordedAt:
      "recorded as tool.run events with ExecutionId — event_log is the receipt.",
  },
  {
    capability: "file-io",
    support: [
      { driver: "hermes-native", supported: true },
      { driver: "claude-cli", supported: true },
      { driver: "codex-cli", supported: true },
      { driver: "peer-remote", supported: false },
      { driver: "simulated-tui", supported: false },
    ],
    recordedAt:
      "recorded as fs.read / fs.write events scoped by the active permission grant.",
  },
  {
    capability: "subagents",
    support: [
      { driver: "hermes-native", supported: true },
      { driver: "claude-cli", supported: true },
      { driver: "codex-cli", supported: false },
      { driver: "peer-remote", supported: false },
      { driver: "simulated-tui", supported: false },
    ],
    recordedAt:
      "recorded as dispatch.spawn events that reference the parent DispatchId.",
  },
  {
    capability: "interactive-tui",
    support: [
      { driver: "hermes-native", supported: false },
      { driver: "claude-cli", supported: true },
      { driver: "codex-cli", supported: true },
      { driver: "peer-remote", supported: false },
      { driver: "simulated-tui", supported: true },
    ],
    recordedAt:
      "recorded as tui.frame events; the terminal itself is not canonical.",
  },
  {
    capability: "peer-remote-exec",
    support: [
      { driver: "hermes-native", supported: false },
      { driver: "claude-cli", supported: false },
      { driver: "codex-cli", supported: false },
      { driver: "peer-remote", supported: true },
      { driver: "simulated-tui", supported: false },
    ],
    recordedAt:
      "recorded as peer.dispatch events that carry the remote ExecutionId back home.",
  },
];

const forbidden: string[] = [
  "driver decides canonicality on its own — truth is EMA's, not the driver's.",
  "driver stores long-lived workspace state — workspaces are a shared part, not a driver concern.",
  "driver bypasses event_log for tool results — if it is not in the log, it did not happen.",
  "driver invents its own id scheme — DispatchId and ExecutionId come from the control plane.",
];

function statusText(s: DriverStatus): string {
  return s === "implemented" ? "Implemented" : "Planned";
}

function statusClass(s: DriverStatus): string {
  return s === "implemented"
    ? "vapp-card__status vapp-card__status--partial"
    : "vapp-card__status vapp-card__status--planned";
}

export default function DriverMatrixPage() {
  return (
    <SiteShell
      eyebrow="Harness fabric"
      title="Driver matrix"
      intro="Five named harness drivers — hermes-native, claude-cli, codex-cli, peer-remote, simulated-tui — laid out against capabilities and runtime shape. Only hermes-native is implemented today. The driver contract surface (Q5) and how control-plane permission scope maps onto each driver (Q10) both remain unresolved."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Drivers</p>
          <h2 className="panel__title">Five named drivers, one canonical log</h2>
          <p className="panel__lede">
            Each driver sits somewhere on the runtime spectrum — in-daemon,
            subprocess, remote peer, simulation — but all of them write through
            the same <code>event_log</code> and all of them produce the same
            three canonical objects.
          </p>
        </div>
        <div className="card-grid">
          {drivers.map((d) => (
            <article className="panel vapp-card" key={d.name}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{d.name}</p>
                <span className={statusClass(d.status)}>
                  {statusText(d.status)}
                </span>
              </div>
              <h3 className="list__title">{d.runtime}</h3>
              <p className="list__copy">{d.produces}</p>
              <p className="panel__label">
                canonical objects — session_id, provider_id, tool-call output.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Capability matrix</p>
        <h2 className="panel__title">Six capabilities across five drivers</h2>
        <p className="panel__lede">
          Filled chips mean the driver supports the capability; ghost chips
          mean it does not. Every row ends with the event kind the value is
          recorded as — support or not, the log is where it lands.
        </p>
        <ul className="inline-list">
          {capabilities.map((row) => (
            <li key={row.capability}>
              <span className="list__eyebrow">{row.capability}</span>
              <div className="route-links">
                {row.support.map((s) => (
                  <span
                    className={s.supported ? "chip" : "chip chip--ghost"}
                    key={s.driver}
                  >
                    {s.driver}
                  </span>
                ))}
              </div>
              <span className="list__copy">{row.recordedAt}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="vapp-card__head">
          <p className="panel__tag">Contract surface (Q5)</p>
          <span className="vapp-card__status vapp-card__status--planned">
            Q5 open
          </span>
        </div>
        <h2 className="panel__title">
          Minimal contract a driver must satisfy
        </h2>
        <p className="panel__lede">
          To be harness-compatible, a driver must meet four requirements. The
          exact shape of the wire — whether it is a BEAM behaviour, a JSON
          protocol, or a port interface — is Q5-open.
        </p>
        <ul className="inline-list">
          <li>
            <span className="list__eyebrow">a</span>
            <span className="list__title">accepts a normalized DispatchId</span>
            <span className="list__copy">
              the control plane hands one in; the driver does not mint its
              own.
            </span>
          </li>
          <li>
            <span className="list__eyebrow">b</span>
            <span className="list__title">produces ExecutionIds</span>
            <span className="list__copy">
              one per tool invocation, stable enough to reference from later
              events.
            </span>
          </li>
          <li>
            <span className="list__eyebrow">c</span>
            <span className="list__title">emits a normalized event stream</span>
            <span className="list__copy">
              token.delta, tool.run, dispatch.progress — shaped the same
              regardless of runtime.
            </span>
          </li>
          <li>
            <span className="list__eyebrow">d</span>
            <span className="list__title">
              honors permission scope from the control plane
            </span>
            <span className="list__copy">
              the grant travels with the DispatchId; how each driver enforces
              it is Q10-open.
            </span>
          </li>
        </ul>
        <p className="panel__label">
          Q5 (contract surface) and Q10 (permission-scope mapping) both remain
          unresolved.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Forbidden driver behaviors</p>
        <h2 className="panel__title">Four things a driver must not do</h2>
        <ul className="inline-list">
          {forbidden.map((f) => (
            <li key={f}>
              <span className="list__copy">{f}</span>
            </li>
          ))}
        </ul>
        <p className="panel__label">
          canonical rule — EMA owns truth, Hermes owns execution, drivers do
          not own state.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/state-planes">
            State planes
          </Link>
          <Link className="chip" href="/canonical-rule">
            Canonical rule
          </Link>
          <Link className="chip" href="/parts/harness-execution">
            Harness / Execution
          </Link>
          <Link className="chip" href="/chat">
            Chat
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
