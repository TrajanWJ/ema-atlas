// Region 6 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 6".
// Controls from seeAgentWorkProjection.controls. Supported lane/queue reads
// execute through the cockpit projection bridge; unreleased writers remain
// clearly marked and copyable.
import { useCallback, useState } from "react";
import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function CommandPanel({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  const { controls } = projection;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [resultByLabel, setResultByLabel] = useState<Record<string, string>>({});

  const copy = useCallback((label: string, command: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(command).then(() => {
      setCopiedId(label);
      setTimeout(() => setCopiedId((prev) => (prev === label ? null : prev)), 1400);
    });
  }, []);

  const run = useCallback(async (label: string, command: string) => {
    setRunningId(label);
    try {
      const result = await runSupportedCommand(command);
      setResultByLabel((prev) => ({ ...prev, [label]: result }));
    } catch (error) {
      setResultByLabel((prev) => ({
        ...prev,
        [label]: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setRunningId((prev) => (prev === label ? null : prev));
    }
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
                  if (daemonBacked) void run(control.label, control.command);
                }}
                aria-label={`${control.label} (${stateLabel})`}
                title={daemonBacked ? "Run supported daemon-backed command" : `${stateLabel} — copy CLI to run manually`}
                disabled={runningId === control.label}
              >
                <span>{control.label}</span>
                <strong>{runningId === control.label ? "running" : daemonBacked ? "daemon-backed" : control.state}</strong>
                <small className="ema-saw-cmd-btn__hint">{stateLabel}</small>
              </button>
              <code className="ema-saw-cli">{control.command}</code>
              {resultByLabel[control.label] ? (
                <small className="ema-saw-cmd-btn__hint">{resultByLabel[control.label]}</small>
              ) : null}
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

async function runSupportedCommand(command: string): Promise<string> {
  if (/^ema (lane|queue) list\b/.test(command)) {
    const response = await fetch("/api/cockpit/projection", { cache: "no-store" });
    if (!response.ok) throw new Error(`projection refresh failed (${response.status})`);
    const payload = (await response.json()) as {
      readonly lanes?: readonly unknown[];
      readonly queue?: readonly unknown[];
    };
    if (command.startsWith("ema lane")) return `refreshed ${payload.lanes?.length ?? 0} lanes`;
    return `refreshed ${payload.queue?.length ?? 0} queue items`;
  }
  throw new Error("supported in CLI; GUI writer not wired for this command yet");
}
