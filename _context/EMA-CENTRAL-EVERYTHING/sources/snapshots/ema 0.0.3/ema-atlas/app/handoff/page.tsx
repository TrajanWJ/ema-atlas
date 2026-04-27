import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function HandoffPage() {
  return (
    <SiteShell
      eyebrow="Coordination"
      title="Handoff — moving a lane, preserving the record"
      intro="A handoff is a typed workspace artifact with control-plane lineage — the object that moves ownership of a lane between actors while preserving a queryable record. EMA owns the truth of the handoff; Hermes executes against it; surfaces only render it. This route walks the mechanics end-to-end, from object model through lifecycle to the exact markdown file that lands under workspace/shared/handoffs/."
    >
      <section>
        <h2>Typed objects</h2>
        <p className="lede">
          Three adjacent objects in <code>content/swarm/object-model.md</code>. They are not interchangeable — a lane is a claim of territory, a handoff is a transfer of that claim, a queue_item is a pending unit of work.
        </p>
        <div className="card-grid">
          <article className="vapp-card">
            <h3>lane_claim</h3>
            <p>One actor asserts ownership of a lane (e.g. <code>atlas.surfaces</code>). Refs: 1 lane, 1 actor, 1 open interval. Only one active claim per lane.</p>
          </article>
          <article className="vapp-card">
            <h3>handoff</h3>
            <p>Typed transfer artifact. Refs: 1 lane, 2 actors (from/to), N linked executions + wiki nodes + chronicle entries. Lives as a file in <code>workspace/shared/handoffs/</code>.</p>
          </article>
          <article className="vapp-card">
            <h3>queue_item</h3>
            <p>A unit pending acceptance on <code>/hq/project</code>. Refs: 0–1 handoff, 1 owner, 1 status. Many queue_items per handoff is allowed; a handoff is not itself a queue_item.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>Lifecycle (7 steps)</h2>
        <p className="lede">Seven states, six control-plane events. Every transition is an append to the chronicle; no state is inferred from a surface.</p>
        <ol>
          <li><strong>draft</strong> — author composes the markdown file locally; no event emitted yet.</li>
          <li><strong>proposed</strong> — file committed to <code>workspace/shared/handoffs/</code>. Event: <code>handoff.proposed</code>.</li>
          <li><strong>acknowledged</strong> — receiver has seen the proposal on <code>/threads</code> or <code>/hq/project</code>. Event: <code>handoff.acked</code>.</li>
          <li><strong>accepted</strong> — receiver commits to the scope + done-when. Event: <code>handoff.accepted</code>.</li>
          <li><strong>active</strong> — lane_claim is rewritten to the new actor; work begins. Event: <code>handoff.activated</code>.</li>
          <li><strong>completed</strong> — done-when satisfied, executions linked back. Event: <code>handoff.completed</code>.</li>
          <li><strong>archived</strong> — artifact moves to the dated archive partition. Event: <code>handoff.archived</code>.</li>
        </ol>
      </section>

      <section>
        <h2>Mock handoff — concrete example</h2>
        <p className="lede">This is what a single artifact looks like on disk. One markdown file plus a handful of control-plane events — nothing more.</p>
        <article className="vapp-card">
          <h3>handoff_01H9V7K3Q2M8X4N6R0Z2A5B1C7</h3>
          <p><strong>from:</strong> <code>@claude-a1</code> &nbsp; <strong>to:</strong> <code>@tawj</code> &nbsp; <strong>lane:</strong> <code>atlas.surfaces</code></p>
          <p><strong>scope (files touched):</strong> <code>app/handoff/page.tsx</code>, <code>content/swarm/object-model.md</code> (read-only reference), workboard entry for handoff semantics.</p>
          <p><strong>done-when:</strong> route renders end-to-end; six section titles match brief; nav chips link cleanly; no new CSS or components introduced.</p>
          <p><strong>open questions:</strong> attribution for multi-actor authorship (Q1); whether cursor state belongs on the collab plane rather than the handoff (Q2); calendar semantics for archived handoffs (workboard unknown).</p>
          <p><strong>links:</strong> executions <code>exec_01H9V7…</code>; wiki node <code>/wiki/node/example</code>; chronicle entries <code>handoff.proposed</code> → <code>handoff.accepted</code>.</p>
        </article>
        <p className="lede"><em>Caption:</em> this is one markdown file under <code>workspace/shared/handoffs/</code> plus its control-plane events. Nothing else holds the truth.</p>
      </section>

      <section>
        <h2>Which surfaces render it</h2>
        <p className="lede">Surfaces project the handoff — they do not own it. Same artifact, four views.</p>
        <ul>
          <li><Link href="/threads">/threads</Link> — announcement chip: <code>handoff.proposed @tawj ← @claude-a1 · atlas.surfaces</code>.</li>
          <li><Link href="/hq/project">/hq/project</Link> — pending queue row: handoff waiting on <code>acknowledged → accepted</code>.</li>
          <li><Link href="/agent-environment">/agent-environment</Link> — timeline entry threaded under the executing agent's tape.</li>
          <li><Link href="/wiki/node/example">/wiki/node/example</Link> — optional linked note if the handoff touches a wiki-tracked concept.</li>
        </ul>
      </section>

      <section>
        <h2>Anti-patterns</h2>
        <p className="lede">A handoff is a workspace artifact. It is specifically not:</p>
        <ul>
          <li><strong>Not a chat message</strong> — saying "can you take this" in <code>/threads</code> without a file under <code>workspace/shared/handoffs/</code> leaves no queryable record.</li>
          <li><strong>Not a private note</strong> — a TODO in one agent's scratch directory cannot be acknowledged by another actor; there is no lineage to link executions against.</li>
          <li><strong>Not a surface-owned status field</strong> — flipping a column on <code>/hq/project</code> without emitting <code>handoff.accepted</code> desyncs the surface from EMA's truth.</li>
        </ul>
      </section>

      <section>
        <h2>Open questions it touches</h2>
        <ul>
          <li><strong>Q1 — attribution:</strong> when a handoff is co-authored (pair of agents drafting together), which actor ID lands in the <code>from</code> field, and how is the second recorded?</li>
          <li><strong>Q2 — collab plane boundary:</strong> if live cursor state lives on the collab plane, it explicitly does not belong in the handoff artifact; the handoff is durable, the cursor is ephemeral.</li>
          <li><strong>Workboard unknowns:</strong> calendar semantics for <code>archived</code> handoffs — do they expire, compact, or persist indefinitely under the dated partition?</li>
        </ul>
      </section>

      <nav className="chips">
        <Link href="/agent-environment">/agent-environment</Link>
        <Link href="/threads">/threads</Link>
        <Link href="/hq/project">/hq/project</Link>
        <Link href="/parts/shared-workspace">/parts/shared-workspace</Link>
        <Link href="/questions">/questions</Link>
      </nav>
    </SiteShell>
  );
}
