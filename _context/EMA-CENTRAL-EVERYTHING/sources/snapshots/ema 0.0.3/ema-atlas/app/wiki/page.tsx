import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../vapps/_data";

/**
 * Wiki vApp — semantic-layer surface mockup.
 *
 * Read-only simulation of how wiki nodes render inside the EMA shell. The
 * wiki itself owns no state: nodes and edges live in the semantic layer;
 * comments and prompt threads live in the collab plane. This page is a
 * render over those planes, shaped like Google Docs + Discord + Wikipedia
 * + Obsidian — with inline prompt as the fourth stance.
 */

const nodeKinds: { kind: string; gloss: string }[] = [
  {
    kind: "concept",
    gloss: "A named idea with a canonical definition and incoming refinements.",
  },
  {
    kind: "decision",
    gloss: "A recorded choice — context, options, outcome, and who owns it.",
  },
  {
    kind: "person",
    gloss: "An identity node — human or agent — linkable from any surface.",
  },
  {
    kind: "project",
    gloss: "A scope-bearing node that groups decisions, people, and artifacts.",
  },
  {
    kind: "term",
    gloss: "A glossary entry. Short, one paragraph, linked where it appears.",
  },
];

const edgeKinds = ["cites", "refines", "contradicts", "derived-from"];

export default function WikiPage() {
  const wiki = vapps.find((v) => v.slug === "wiki");

  return (
    <SiteShell
      eyebrow="vApp"
      title="Wiki"
      intro="Semantic-layer surface with the feel of Google Docs + Discord + Wikipedia + Obsidian, plus inline prompt. The page renders nodes and edges from the semantic layer; comments and prompt threads live in the collab plane — the surface owns no state."
    >
      <section className="panel">
        <p className="panel__tag">Wiki surface — mock page</p>
        <h2 className="panel__title">Semantic Layer / Knowledge System</h2>
        <p className="panel__lede">
          {wiki?.oneLiner}
        </p>

        <figure>
          <aside className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">3</span>
              <span>reading</span>
            </div>
            <div className="stat">
              <span className="stat__value">1</span>
              <span>editing</span>
            </div>
            <div className="stat">
              <span className="stat__value">3</span>
              <span>comment pins</span>
            </div>
            <div className="stat">
              <span className="stat__value">1</span>
              <span>prompt thread</span>
            </div>
          </aside>

          <p className="list__copy">
            The <mark>semantic layer</mark> is the typed knowledge graph EMA
            reads and writes against <sup>1</sup>. Nodes are concepts,
            decisions, people, projects, and terms; edges name the relation
            between them, not the rendering.
          </p>
          <p className="list__copy">
            The wiki is a view over that graph <sup>2</sup>. Editing a node
            writes back to the semantic layer; commenting on a range writes to
            the collab plane <sup>3</sup>. The surface is never the source of
            truth — it is the middle where many cursors meet{" "}
            <sup className="chip">prompt</sup>.
          </p>

          <figcaption className="list__copy">
            Pins 1–3 and the prompt pin are collab-plane artifacts. The wiki
            renders them; it does not store them. Remove the surface and the
            threads still exist.
          </figcaption>
        </figure>
      </section>

      <section className="panel">
        <p className="panel__tag">Node types and edges</p>
        <h2 className="panel__title">Five node kinds, four named edges</h2>
        <p className="panel__lede">
          The semantic layer defines the shape; the wiki renders typed cards
          and a chip row so the graph stays legible at a glance.
        </p>

        <div className="card-grid">
          {nodeKinds.map((n) => (
            <article className="panel vapp-card" key={n.kind}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">Node</p>
                <span className="vapp-card__status vapp-card__status--planned">
                  {wiki ? statusLabel(wiki.status) : "Planned"}
                </span>
              </div>
              <h3 className="list__title">{n.kind}</h3>
              <p className="list__copy">{n.gloss}</p>
            </article>
          ))}
        </div>

        <div>
          <span className="panel__label">Edge kinds</span>
          <div className="route-links">
            {edgeKinds.map((e) => (
              <span className="chip" key={e}>
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Inline prompt</p>
        <h2 className="panel__title">Selection becomes Chat context</h2>
        <p className="panel__lede">
          The fourth stance past Docs, Discord, Wikipedia, Obsidian: ask about
          a range without leaving the page. The prompt opens a collab-plane
          thread pinned to the selection.
        </p>

        <figure className="panel">
          <p className="list__eyebrow">Selected range</p>
          <p className="list__copy">
            <mark>
              Editing a node writes back to the semantic layer; commenting on a
              range writes to the collab plane.
            </mark>
          </p>
          <span className="panel__label">Prompt</span>
          <p className="list__copy">
            &ldquo;Does this contradict the shared-workspace brief? Draft a{" "}
            <code>contradicts</code> edge if so.&rdquo;
          </p>
          <ul className="inline-list">
            <li>selection → Chat context</li>
            <li>reply → pinned thread</li>
            <li>accepted edit → semantic-layer write</li>
          </ul>
          <figcaption className="list__copy">
            The wiki holds the pin coordinate only. The thread, the draft, and
            the proposed edge all live in planes the surface reads from.
          </figcaption>
        </figure>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps/wiki">
            Wiki brief
          </Link>
          <Link className="chip" href="/parts/semantic-layer">
            Semantic Layer
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/launchpad">
            Launchpad
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
