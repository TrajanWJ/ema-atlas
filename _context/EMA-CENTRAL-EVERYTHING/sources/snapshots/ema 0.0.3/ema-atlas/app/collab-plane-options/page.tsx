import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function CollabPlaneOptionsPage() {
  return (
    <SiteShell
      eyebrow="Q2 + Q8"
      title="Collaboration plane — transport options"
      intro="Q2 asks who owns collaboration state; Q8 asks what sync model it runs on. Both are open, and both are load-bearing for the collaboration plane. This page lines up five concrete transport candidates side by side so the tradeoffs are visible — it applies pressure, it does not select."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Framing</p>
          <h2 className="panel__title">The shape of the problem</h2>
          <p className="panel__lede">
            Before picking a transport, name the objects and the properties.
            The collab plane has to carry more than chat.
          </p>
          <div>
            <span className="panel__label">Objects at stake</span>
            <div className="route-links">
              <span className="chip">wiki nodes</span>
              <span className="chip">typed edges</span>
              <span className="chip">comments</span>
              <span className="chip">inline-prompt threads</span>
              <span className="chip">cursors / presence</span>
            </div>
          </div>
          <div>
            <span className="panel__label">Properties we need</span>
            <ul className="inline-list">
              <li>Multi-writer convergence — two editors on one node do not corrupt it.</li>
              <li>Attribution — every change traces back to a human or agent actor.</li>
              <li>Offline tolerance — a writer mid-flight does not lose their edits when the link drops.</li>
              <li>Integration with <code>event_log</code> — canonical mutations still land as append-only records with lineage preserved.</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Candidates</p>
          <h2 className="panel__title">Five candidates</h2>
          <p className="panel__lede">
            Each card names the same five things: convergence state, attribution,
            <code> event_log</code> integration, what it forces us to build first,
            and what it costs.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate 1</p>
              <span className="chip chip--ghost">CRDT / JS</span>
            </div>
            <h3 className="list__title">Yjs</h3>
            <div>
              <span className="panel__label">Convergence state</span>
              <p className="list__copy">Y.Doc held per document; binary update log merged commutatively on every peer.</p>
            </div>
            <div>
              <span className="panel__label">Attribution</span>
              <p className="list__copy">Origin tag per transaction; actor id is a convention, not a guarantee — forgeable on the client unless a server signs.</p>
            </div>
            <div>
              <span className="panel__label"><code>event_log</code> integration</span>
              <p className="list__copy">Updates would be wrapped and appended as opaque blobs, or decoded into typed events at a gateway. Neither is free.</p>
            </div>
            <div>
              <span className="panel__label">Forces us to build</span>
              <p className="list__copy">A Yjs provider bridge to EMA, plus a decode path for the objects we want canonicalized.</p>
            </div>
            <div>
              <span className="panel__label">Cost</span>
              <p className="list__copy">Foreign runtime in the collab hot path; binary diffs are hard to audit by eye.</p>
            </div>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate 2</p>
              <span className="chip chip--ghost">CRDT / JSON</span>
            </div>
            <h3 className="list__title">Automerge</h3>
            <div>
              <span className="panel__label">Convergence state</span>
              <p className="list__copy">Per-document Automerge doc; JSON-shaped, history preserved inside the doc itself.</p>
            </div>
            <div>
              <span className="panel__label">Attribution</span>
              <p className="list__copy">Actor id per change is first-class and hashed into history; still client-asserted without a signing layer.</p>
            </div>
            <div>
              <span className="panel__label"><code>event_log</code> integration</span>
              <p className="list__copy">Automerge&apos;s own history is a log — tempting to treat as truth, which conflicts with EMA owning truth.</p>
            </div>
            <div>
              <span className="panel__label">Forces us to build</span>
              <p className="list__copy">A reconciler that decides which log is canonical and how the other mirrors it.</p>
            </div>
            <div>
              <span className="panel__label">Cost</span>
              <p className="list__copy">Two logs to keep honest; doc size grows with history unless compacted.</p>
            </div>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate 3</p>
              <span className="chip chip--ghost">Native / BEAM</span>
            </div>
            <h3 className="list__title">Pure-Elixir CRDT</h3>
            <div>
              <span className="panel__label">Convergence state</span>
              <p className="list__copy">CRDTs modeled as EMA modules — op-based, held in processes supervised alongside <code>event_log</code>.</p>
            </div>
            <div>
              <span className="panel__label">Attribution</span>
              <p className="list__copy">Server-authoritative; actor id comes from the authenticated session, not the client payload.</p>
            </div>
            <div>
              <span className="panel__label"><code>event_log</code> integration</span>
              <p className="list__copy">Most natural: each converged op is one typed <code>event_log</code> entry with lineage already in-shape.</p>
            </div>
            <div>
              <span className="panel__label">Forces us to build</span>
              <p className="list__copy">A correct CRDT library, per object type, with tests — this is the expensive path.</p>
            </div>
            <div>
              <span className="panel__label">Cost</span>
              <p className="list__copy">Engineering time. CRDTs are easy to get subtly wrong; bugs corrupt convergence silently.</p>
            </div>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate 4</p>
              <span className="chip chip--ghost">Server-of-record</span>
            </div>
            <h3 className="list__title">Centralized <code>event_log</code></h3>
            <div>
              <span className="panel__label">Convergence state</span>
              <p className="list__copy">None separate. The log is the state. Writers submit intents; the server serializes and emits canonical events.</p>
            </div>
            <div>
              <span className="panel__label">Attribution</span>
              <p className="list__copy">Strongest — every event is stamped by the server at commit, with session-bound actor id.</p>
            </div>
            <div>
              <span className="panel__label"><code>event_log</code> integration</span>
              <p className="list__copy">Identity. There is no other plane to integrate.</p>
            </div>
            <div>
              <span className="panel__label">Forces us to build</span>
              <p className="list__copy">Conflict rules at the server for concurrent edits, plus a fast fan-out for cursors and presence.</p>
            </div>
            <div>
              <span className="panel__label">Cost</span>
              <p className="list__copy">Offline writes are fragile; latency of round-trip becomes the edit experience.</p>
            </div>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate 5</p>
              <span className="chip chip--ghost">Mixed</span>
            </div>
            <h3 className="list__title">Hybrid (CRDT for text, <code>event_log</code> for structure)</h3>
            <div>
              <span className="panel__label">Convergence state</span>
              <p className="list__copy">CRDT only where it earns its keep (prose, cursors); structural mutations (edges, new nodes) go straight to <code>event_log</code>.</p>
            </div>
            <div>
              <span className="panel__label">Attribution</span>
              <p className="list__copy">Structural edits strong; prose edits only as strong as the CRDT layer allows.</p>
            </div>
            <div>
              <span className="panel__label"><code>event_log</code> integration</span>
              <p className="list__copy">Clean seam for structure, fuzzy seam for prose — requires a rule for when a prose edit becomes a canonical event.</p>
            </div>
            <div>
              <span className="panel__label">Forces us to build</span>
              <p className="list__copy">Both stacks. Plus the boundary logic that decides which object type goes where.</p>
            </div>
            <div>
              <span className="panel__label">Cost</span>
              <p className="list__copy">Two systems to operate and reason about; boundary drift is the long-term risk.</p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Matrix</p>
          <h2 className="panel__title">Scoring matrix</h2>
          <p className="panel__lede">
            Five axes, one line each. Each axis names the candidate that wins on
            that axis alone — never a winner overall. Q2 and Q8 stay open.
          </p>
          <ul className="inline-list">
            <li><strong>Convergence</strong> — Yjs and Automerge are strongest; both are battle-tested on exactly the multi-writer case.</li>
            <li><strong>Attribution</strong> — Centralized <code>event_log</code> wins; server-stamped identity is the hardest to forge.</li>
            <li><strong>Offline</strong> — Automerge wins narrowly; JSON-shaped offline history is the easiest to inspect and merge.</li>
            <li><strong>Integration</strong> — Pure-Elixir CRDT wins; converged ops land as typed <code>event_log</code> entries with no translation layer.</li>
            <li><strong>Operational risk</strong> — Centralized <code>event_log</code> wins; one system, one log, one failure mode. Hybrid is the worst here.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Blast radius</p>
          <h2 className="panel__title">What the choice touches downstream</h2>
          <ul className="inline-list">
            <li><Link href="/wiki">Wiki</Link> — node and edge edits ride this transport; its multi-writer story is whatever we pick.</li>
            <li><Link href="/threads">Threads</Link> — inline-prompt threads and comments inherit the same attribution and offline behavior.</li>
            <li><Link href="/blueprint">Blueprint</Link> — collaborative annotation on blueprints becomes a consumer of the same plane.</li>
            <li><Link href="/state-planes">Workspace plane</Link> — the boundary between collab state and workspace state shifts depending on who owns convergence.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Today</p>
          <h2 className="panel__title">Smallest provable slice</h2>
          <p className="panel__lede">
            With Q2 still open, the only responsible slice is the degenerate one:
            a read-only projection of collab events out of <code>event_log</code>.
            No transport chosen, no convergence layer introduced. That projection
            is enough to render threads and comments that already exist without
            committing the plane to any of the five shapes above. Picking a
            transport is a separate decision, deferred until Q2 and Q8 are
            answered.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/state-planes">State planes</Link>
            <Link className="chip" href="/open-questions-map">Open questions map</Link>
            <Link className="chip" href="/wiki">Wiki</Link>
            <Link className="chip" href="/blueprint">Blueprint</Link>
            <Link className="chip" href="/questions">Questions</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
