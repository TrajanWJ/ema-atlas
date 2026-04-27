import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Wiki node deep view — single typed node.
 *
 * `/wiki` renders the Wiki vApp at the overview level. This page drops one
 * level deeper: what a single wiki node actually looks like when opened.
 * The node itself lives in the collab plane; this surface only renders.
 */

export default function WikiNodeExamplePage() {
  return (
    <SiteShell
      eyebrow="Wiki node"
      title="Node: 'Shared Workspace' (concept)"
      intro="Deep view of a single typed node. The node and its edges live in the collab plane; comments and prompt pins live alongside them. The wiki surface reads from those planes — it does not own the node, the thread, or the edge set."
    >
      <section className="panel">
        <p className="panel__tag">Node header</p>
        <h2 className="panel__title">node_wiki_shared_workspace</h2>
        <p className="panel__lede">
          A concept node in the <code>core</code> space. Opened here as a
          standalone page so the edges, pins, and presence around it are
          legible in one frame.
        </p>

        <figure>
          <ul className="inline-list">
            <li>
              <span className="panel__label">id</span>{" "}
              <code>node_wiki_shared_workspace</code>
            </li>
            <li>
              <span className="panel__label">kind</span>{" "}
              <span className="chip">concept</span>
            </li>
            <li>
              <span className="panel__label">space</span>{" "}
              <span className="chip">core</span>
            </li>
            <li>
              <span className="panel__label">authors</span>{" "}
              <span className="chip">@tawj</span>{" "}
              <span className="chip">@claude-a1</span>
            </li>
            <li>
              <span className="panel__label">last edit</span> 2026-04-21 ·
              14:02 by <code>@claude-a1</code>
            </li>
            <li>
              <span className="panel__label">version</span>{" "}
              <span className="chip">v0.14</span>
            </li>
          </ul>
          <figcaption className="list__copy">
            The node lives in the collab plane. This surface renders a view
            of it; closing the tab does not delete anything.
          </figcaption>
        </figure>
      </section>

      <section className="panel">
        <p className="panel__tag">Body</p>
        <h2 className="panel__title">What 'Shared Workspace' means in EMA</h2>
        <p className="panel__lede">
          Mock prose at real product voice. Inline pins (1–3) are comment
          threads; the prompt pin opens a Chat thread scoped to the selection.
        </p>

        <article>
          <p className="list__copy">
            A <mark>shared workspace</mark> is the middle surface where human
            and agent cursors meet over the same typed objects. It is not a
            channel and not a doc — it is the rendered view of whatever slice
            of the <code>event_log</code> the participants currently care
            about <sup>1</sup>. Every stroke, comment, and accepted edit goes
            back to the log as an event; the workspace is the replay.
          </p>
          <p className="list__copy">
            In EMA, the shared workspace is a{" "}
            <mark>collaboration plane</mark> surface <sup>2</sup>. Authority
            and attribution are expected to resolve through the control plane
            once that lands in Q1; until then, the workspace trusts the
            authors listed on the node and defers harder questions
            <sup>3</sup>. The inline prompt{" "}
            <sup className="chip">prompt</sup> is the fourth stance past
            Docs, Discord, and Obsidian — ask a question pinned to a range
            without leaving the node.
          </p>
        </article>
      </section>

      <section className="panel">
        <p className="panel__tag">Typed edges</p>
        <h2 className="panel__title">Four edge kinds, one example each</h2>
        <p className="panel__lede">
          Edges are first-class. The wiki renders them as small cards so the
          neighborhood of the node is legible without opening the graph map.
        </p>

        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Edge</p>
              <span className="chip">cites</span>
            </div>
            <h3 className="list__title">cites → node_concept_event_log</h3>
            <p className="list__copy">
              The workspace is a replay of the event log; the definition
              leans on that node for its ground truth.
            </p>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Edge</p>
              <span className="chip">refines</span>
            </div>
            <h3 className="list__title">
              refines → node_concept_collab_plane
            </h3>
            <p className="list__copy">
              Narrows the collab-plane concept to the specific surface where
              many cursors share one rendered view.
            </p>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Edge</p>
              <span className="chip">contradicts</span>
            </div>
            <h3 className="list__title">
              contradicts → node_concept_channel_first
            </h3>
            <p className="list__copy">
              Pushes against the channel-first framing: the shared workspace
              is an object view, not a message stream.
            </p>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Edge</p>
              <span className="chip">derived-from</span>
            </div>
            <h3 className="list__title">
              derived-from → node_decision_collab_plane_q2
            </h3>
            <p className="list__copy">
              This concept was carved out of the Q2 decision to build the
              collab plane before the control plane.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Inline comment thread</p>
        <h2 className="panel__title">Three pins, each on a selection range</h2>
        <p className="panel__lede">
          Comments hang off selection ranges inside the body. They are
          collab-plane objects — the wiki only holds the pin coordinate.
        </p>

        <figure>
          <article className="panel">
            <p className="list__eyebrow">
              Pin 1 · selection: "the event_log" · 2 replies
            </p>
            <p className="list__title">@tawj</p>
            <p className="list__copy">
              Should we link this to <code>node_concept_event_log</code>{" "}
              explicitly, or is the cites edge enough? Leaning explicit so
              new readers don't have to walk the graph.
            </p>
          </article>

          <article className="panel">
            <p className="list__eyebrow">
              Pin 2 · selection: "collaboration plane" · 1 reply
            </p>
            <p className="list__title">@claude-a1</p>
            <p className="list__copy">
              Agreed this belongs on the collab plane. Flagging for the Q1
              control-plane pass so attribution stops living on the node
              itself.
            </p>
          </article>

          <article className="panel">
            <p className="list__eyebrow">
              Pin 3 · selection: "defers harder questions" · 0 replies
            </p>
            <p className="list__title">@tawj</p>
            <p className="list__copy">
              Soft language on purpose — we should not ship authority claims
              the control plane hasn't backed yet.
            </p>
          </article>

          <figcaption className="list__copy">
            Comments are collab-plane objects. Presence, ordering, and read
            state come from that plane; the surface renders them in place.
          </figcaption>
        </figure>
      </section>

      <section className="panel">
        <p className="panel__tag">Presence &amp; activity</p>
        <h2 className="panel__title">Who is on this node right now</h2>

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
            <span className="stat__value">0</span>
            <span>prompting</span>
          </div>
        </aside>

        <p className="list__copy">
          Audit note: authority and attribution resolve via the control
          plane in Q1 once first-class. Until then the node trusts its
          author list and the collab-plane event log.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/wiki">
            Wiki overview
          </Link>
          <Link className="chip" href="/vapps/wiki">
            Wiki brief
          </Link>
          <Link className="chip" href="/parts/semantic-layer">
            Semantic Layer
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
