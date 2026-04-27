// Region 6 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 6".
// Six staged controls from seeAgentWorkProjection.controls. Each: label +
// state pill + CLI string + copy-CLI affordance. Clicking the button itself
// is a no-op with a `pending daemon writer` tooltip.
import { useCallback, useState } from "react";
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";

export function CommandPanel() {
  const { controls } = seeAgentWorkProjection;
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
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </div>
      <div className="ema-saw-command-panel__grid">
        {controls.map((control) => (
          <article
            key={control.label}
            className="ema-saw-cmd-btn"
            data-state={control.state}
          >
            <button
              type="button"
              className="ema-saw-cmd-btn__action"
              onClick={(e) => {
                e.preventDefault();
                // pending daemon writer — no side effect
              }}
              aria-label={`${control.label} (pending daemon writer)`}
              title="pending daemon writer — click has no side effect"
            >
              <span>{control.label}</span>
              <strong>{control.state}</strong>
              <small className="ema-saw-cmd-btn__hint">pending daemon writer</small>
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
        ))}
      </div>
    </section>
  );
}
