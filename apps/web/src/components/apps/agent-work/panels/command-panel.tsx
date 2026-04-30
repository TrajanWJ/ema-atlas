// Region 6 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 6".
// Six staged controls from seeAgentWorkProjection.controls. Each: label +
// state pill + CLI string + copy-CLI affordance. Clicking the button itself
// is a no-op with a `pending daemon writer` tooltip.
import { useCallback, useState } from "react";
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function CommandPanel({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  const { controls } = projection;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback((label: string, command: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(command).then(() => {
      setCopiedId(label);
      setTimeout(() => setCopiedId((prev) => (prev === label ? null : prev)), 1400);
    });
  }, []);

  return (
    <section className="ema-panel ema-saw-region ema-saw-command-panel" aria-label="Command panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">command panel</p>
          <h2>Queued controls · CLI parity</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>
      <div className="ema-saw-command-panel__grid">
        {controls.map((control) => {
          const daemonBacked = isDaemonBacked(control.command);
          const stateLabel = daemonBacked ? "daemon-backed" : "pending daemon writer";
          return (
            <article
              key={control.label}
              className="ema-saw-cmd-btn"
              data-state={daemonBacked ? "daemon-backed" : control.state}
            >
              <button
                type="button"
                className="ema-saw-cmd-btn__action"
                onClick={(e) => {
                  e.preventDefault();
                  // CLI-copy affordance only; no GUI mutation in this slice.
                }}
                aria-label={`${control.label} (${stateLabel})`}
                title={`${stateLabel} — click has no side effect`}
              >
                <span>{control.label}</span>
                <strong>{daemonBacked ? "daemon-backed" : control.state}</strong>
                <small className="ema-saw-cmd-btn__hint">{stateLabel}</small>
              </button>
              <code className="ema-saw-cli">{control.command}</code>
              <button
                type="button"
                className="ema-saw-cmd-btn__copy"
                onClick={() => copy(control.label, control.command)}
              >
                {copiedId === control.label ? "copied" : "copy cli"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function isDaemonBacked(command: string): boolean {
  return /^ema (lane (open|list|show|claim|block|move|release|close)|queue (add|list|show|ready|block|close))\b/.test(command);
}
