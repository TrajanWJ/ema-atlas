import { SiteShell } from "@/components/site-shell";
import { DecisionCard } from "@/components/decision-card";
import { loadDecisions } from "@/lib/decisions";

export default async function DecisionsPage() {
  const decisions = await loadDecisions();
  const redCount = decisions.filter((d) => d.readiness === "red").length;
  const amberCount = decisions.filter((d) => d.readiness === "amber").length;
  const greenCount = decisions.filter((d) => d.readiness === "green").length;

  return (
    <SiteShell
      eyebrow="Decision Pressure Board"
      title="Open questions, in tension."
      intro="The hard questions that EMA hasn't resolved yet. Each one has a tradeoff axis, a status, and a readiness signal for v0.0.3 — the point is to keep the pressure visible, not to pretend it's gone."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Pressure / Now</p>
          <h2 className="panel__title">{decisions.length} open decisions on the board.</h2>
          <p className="panel__lede">
            A small number of these block v0.0.3 readiness. Most of the rest still shape the
            architecture even when they look optional.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{redCount}</span>
              <span>Block v0.0.3</span>
            </div>
            <div className="stat">
              <span className="stat__value">{amberCount}</span>
              <span>Watch closely</span>
            </div>
            <div className="stat">
              <span className="stat__value">{greenCount}</span>
              <span>Deferred</span>
            </div>
          </div>
        </article>
      </section>

      <section>
        <div className="futures-grid">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
