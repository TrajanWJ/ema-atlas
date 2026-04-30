import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function QueuePanel({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  return (
    <section className="ema-panel ema-saw-region ema-saw-queue" aria-label="Queue and dependency panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">agent queue</p>
          <h2>Later work with blockers</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>
      <ol className="ema-saw-work-list">
        {projection.queue_items.map((item) => {
          const itemDetails = item as typeof item & {
            lane_id?: string | null;
            blocked_by?: string | null;
            result?: string | null;
          };
          return (
            <li key={item.id} className="ema-saw-work-item" data-state={item.status}>
              <header>
                <p className="ema-kicker">{item.status}</p>
                <strong>{item.title}</strong>
              </header>
              <p>{item.why}</p>
              <dl>
                <div>
                  <dt>lane</dt>
                  <dd>{itemDetails.lane_id || "none"}</dd>
                </div>
                <div>
                  <dt>depends on</dt>
                  <dd>{item.depends_on.join(", ") || "none"}</dd>
                </div>
                <div>
                  <dt>blocked by</dt>
                  <dd>{itemDetails.blocked_by || "none"}</dd>
                </div>
                <div>
                  <dt>done when</dt>
                  <dd>{item.done_when || "not set"}</dd>
                </div>
                <div>
                  <dt>result</dt>
                  <dd>{itemDetails.result || "open"}</dd>
                </div>
                <div>
                  <dt>source</dt>
                  <dd>{item.source}</dd>
                </div>
              </dl>
              <code className="ema-saw-cli">{item.cli}</code>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
