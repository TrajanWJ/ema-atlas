import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts } from "@/lib/ema-atlas";

export default function DesktopPage() {
  return (
    <SiteShell
      eyebrow="Spatial Surface"
      title="EMA Desktop"
      intro="A place.org-inspired deliverable route. Not the final product, but a demonstration that the atlas can also be spatial, windowed, and world-like."
    >
      <section className="desktop">
        <article className="desktop__window" style={{ left: "3%", top: "5%", width: "32%" }}>
          <h3>HQ / Pressure Map</h3>
          <p className="desktop__caption">
            This window stands in for the live command shell: project state, active parts, blocked futures, and the hard questions that keep surfacing.
          </p>
          <div className="route-links">
            <Link className="chip" href="/parts">
              Open Parts
            </Link>
            <Link className="chip" href="/artifacts">
              Artifact Modes
            </Link>
          </div>
        </article>

        <article className="desktop__window" style={{ left: "39%", top: "10%", width: "28%" }}>
          <h3>Semantic Layer</h3>
          <p className="desktop__caption">
            The graph, docs, and atlas all feed the semantic layer rather than living as disconnected prep artifacts.
          </p>
          <Link className="chip" href="/graph">
            Open Graph
          </Link>
        </article>

        <article className="desktop__window" style={{ right: "4%", top: "8%", width: "24%" }}>
          <h3>Swarm / Planner</h3>
          <p className="desktop__caption">
            Lanes, handoffs, checkups, queues, and weekly phases deserve their own surface family.
          </p>
          <Link className="chip" href={`/parts/${parts[3].slug}`}>
            Open Coordination
          </Link>
        </article>

        <article className="desktop__window" style={{ left: "12%", bottom: "18%", width: "34%" }}>
          <h3>Futures Studio</h3>
          <p className="desktop__caption">
            Every part carries three competing futures. The desktop keeps them visible instead of smoothing them away.
          </p>
          <div className="route-links">
            <Link className="chip" href={`/slides/${parts[0].slug}`}>
              Operator Deck
            </Link>
            <Link className="chip" href={`/canvas/${parts[4].slug}`}>
              Semantic Canvas
            </Link>
          </div>
        </article>

        <article className="desktop__window" style={{ right: "10%", bottom: "22%", width: "30%" }}>
          <h3>Place Reference Window</h3>
          <p className="desktop__caption">
            This is where the place.org metaphor stays alive: not as nostalgia, but as pressure on the product to feel like an environment rather than a dashboard stack.
          </p>
        </article>

        <div className="desktop__dock">
          {["HQ", "Graph", "Parts", "Canvas", "Slides", "Docs"].map((label) => (
            <div className="dock__item" key={label}>
              <span className="dock__glyph" />
              <span className="dock__label">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
