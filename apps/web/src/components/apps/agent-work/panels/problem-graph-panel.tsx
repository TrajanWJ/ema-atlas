import type { AgentWorkspacePanelProps } from "./component-types";
import { sourcePillClass } from "./component-types";

export function ProblemGraphPanel({ projection, sourceLabel, isLive }: AgentWorkspacePanelProps) {
  return (
    <section className="ema-panel ema-saw-region ema-saw-problems" aria-label="Problem graph panel">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">problem graph</p>
          <h2>Recursive problems and solutions</h2>
        </div>
        <span className={sourcePillClass(isLive)}>{sourceLabel}</span>
      </div>
      <ol className="ema-saw-work-list">
        {projection.problems.map((problem) => (
          <li key={problem.id} className="ema-saw-work-item" data-state={problem.status}>
            <header>
              <p className="ema-kicker">{problem.status}</p>
              <strong>{problem.title}</strong>
            </header>
            <p>{problem.solution}</p>
            <dl>
              <div>
                <dt>depends on</dt>
                <dd>{problem.depends_on.join(", ") || "none"}</dd>
              </div>
              <div>
                <dt>edges</dt>
                <dd>{edgesFor(projection.dependencies, problem.id)}</dd>
              </div>
            </dl>
            <code className="ema-saw-cli">{problem.cli}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

function edgesFor(
  dependencies: AgentWorkspacePanelProps["projection"]["dependencies"],
  nodeId: string,
): string {
  const edges = dependencies.filter((dependency) => dependency.from === nodeId || dependency.to === nodeId);
  if (edges.length === 0) return "none";
  return edges
    .map((dependency) => `${dependency.from} ${dependency.relation} ${dependency.to}`)
    .join(" / ");
}
