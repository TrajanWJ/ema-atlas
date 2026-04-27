import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function WorkspaceContractPage() {
  return (
    <SiteShell
      eyebrow="Workspace plane"
      title="Typed workspace contract"
      intro="The shared workspace is file-shaped today and database-shaped in parallel, and the typed contract is what forces that reconciliation to stay visible instead of drifting. Artifact kinds, required fields, and lifecycle events are named here so the two shapes can be held against each other. One decision stays open on purpose: whether the artifact set is closed or open."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Directories in scope</p>
          <h2 className="panel__title">Six directories, one index each</h2>
          <p className="panel__lede">
            The contract binds six directories under{" "}
            <code>workspace/shared/</code>. Each has a canonical index file that
            the control plane reads as the authoritative list for that kind.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">actors</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/actors/</code>
            </h3>
            <p className="list__copy">
              Actor cards — humans, agents, drivers — as canonical identities
              referenced by every other artifact.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>actors/INDEX.md</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">handoffs</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/handoffs/</code>
            </h3>
            <p className="list__copy">
              Work passed between actors — one file per handoff, stating source,
              target, payload, and expected next move.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>handoffs/INDEX.md</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">plans</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/plans/</code>
            </h3>
            <p className="list__copy">
              Plans-of-record — scoped intent with owners, checkpoints, and a
              status the workspace is allowed to show.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>plans/INDEX.md</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">swarm</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/swarm/</code>
            </h3>
            <p className="list__copy">
              Swarm claims — parallel workers checking out lanes without
              stepping on each other.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>swarm/INDEX.md</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">exports</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/exports/</code>
            </h3>
            <p className="list__copy">
              Export seeds — the handoff points out of the workspace into
              downstream surfaces and systems.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>exports/INDEX.md</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Directory</p>
              <span className="chip">inbox</span>
            </div>
            <h3 className="list__title">
              <code>workspace/shared/inbox/</code>
            </h3>
            <p className="list__copy">
              Inbox items — unclaimed work, external drops, anything that has
              not yet been promoted to a plan or handoff.
            </p>
            <div>
              <span className="panel__label">Index</span>
              <p className="list__copy">
                <code>inbox/INDEX.md</code>
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Typed artifact kinds</p>
          <h2 className="panel__title">Six kinds, each with a lifecycle</h2>
          <p className="panel__lede">
            Every artifact declares a <code>kind</code>. The contract fixes
            required fields, which status values are legal, and which event
            kinds fire when the status moves.
          </p>
          <ul className="inline-list">
            <li>
              <strong>
                <code>handoff</code>
              </strong>{" "}
              — required: <code>id</code>, <code>from_actor</code>,{" "}
              <code>to_actor</code>, <code>payload_ref</code>,{" "}
              <code>status</code>, <code>created_at</code>. Status:{" "}
              <code>proposed</code>, <code>active</code>, <code>stalled</code>,{" "}
              <code>completed</code>, <code>archived</code>. Events:{" "}
              <code>handoff.proposed</code>, <code>handoff.accepted</code>,{" "}
              <code>handoff.completed</code>.
            </li>
            <li>
              <strong>
                <code>plan</code>
              </strong>{" "}
              — required: <code>id</code>, <code>owner</code>, <code>scope</code>
              , <code>checkpoints</code>, <code>status</code>. Status:{" "}
              <code>proposed</code>, <code>active</code>, <code>stalled</code>,{" "}
              <code>completed</code>, <code>archived</code>. Events:{" "}
              <code>plan.opened</code>, <code>plan.checkpoint</code>,{" "}
              <code>plan.closed</code>.
            </li>
            <li>
              <strong>
                <code>actor-card</code>
              </strong>{" "}
              — required: <code>id</code>, <code>kind</code> (human / agent /
              driver), <code>display_name</code>, <code>capabilities</code>,{" "}
              <code>status</code>. Status: <code>active</code>,{" "}
              <code>stalled</code>, <code>archived</code>. Events:{" "}
              <code>actor.registered</code>, <code>actor.retired</code>.
            </li>
            <li>
              <strong>
                <code>swarm-claim</code>
              </strong>{" "}
              — required: <code>id</code>, <code>lane</code>,{" "}
              <code>worker</code>, <code>claimed_at</code>, <code>status</code>.
              Status: <code>proposed</code>, <code>active</code>,{" "}
              <code>stalled</code>, <code>completed</code>,{" "}
              <code>archived</code>. Events: <code>swarm.claimed</code>,{" "}
              <code>swarm.released</code>, <code>swarm.completed</code>.
            </li>
            <li>
              <strong>
                <code>export-seed</code>
              </strong>{" "}
              — required: <code>id</code>, <code>source_ref</code>,{" "}
              <code>target_surface</code>, <code>payload</code>,{" "}
              <code>status</code>. Status: <code>proposed</code>,{" "}
              <code>active</code>, <code>completed</code>,{" "}
              <code>archived</code>. Events: <code>export.seeded</code>,{" "}
              <code>export.shipped</code>.
            </li>
            <li>
              <strong>
                <code>inbox-item</code>
              </strong>{" "}
              — required: <code>id</code>, <code>source</code>,{" "}
              <code>received_at</code>, <code>status</code>. Status:{" "}
              <code>proposed</code>, <code>active</code>, <code>stalled</code>,{" "}
              <code>completed</code>, <code>archived</code>. Events:{" "}
              <code>inbox.received</code>, <code>inbox.promoted</code>,{" "}
              <code>inbox.dropped</code>.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Status vocabulary</p>
          <h2 className="panel__title">Five values, nothing else</h2>
          <p className="panel__lede">
            Drawn from <code>STATUS_VOCAB.md</code>. No artifact may invent a
            status outside this set. The whole point of the small vocabulary is
            to make cross-kind reporting cheap.
          </p>
          <ul className="inline-list">
            <li>
              <code>proposed</code> — declared but not yet acted on.
            </li>
            <li>
              <code>active</code> — currently being worked.
            </li>
            <li>
              <code>stalled</code> — blocked or idle past its expected window.
            </li>
            <li>
              <code>completed</code> — work is done and confirmed.
            </li>
            <li>
              <code>archived</code> — retired from live listings, still on
              disk.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Decision pressure</p>
          <h2 className="panel__title">Open vs closed artifact set</h2>
          <p className="panel__lede">
            The live open question: does the contract enumerate a fixed list of
            kinds, or allow new kinds to be registered by producers? Both
            candidates below are live; neither has been picked.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate A</p>
              <span className="chip">Closed set</span>
            </div>
            <h3 className="list__title">Six kinds, no more.</h3>
            <p className="list__copy">
              The contract freezes the artifact kinds. Anything new requires a
              contract revision and a migration.
            </p>
            <div>
              <span className="panel__label">Tradeoffs</span>
              <p className="list__copy">
                Cheap to validate, easy to index, predictable across surfaces.
                Pays for it by being hostile to experiments — every new kind of
                work must either squeeze into an existing shape or wait for the
                contract to move.
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Candidate B</p>
              <span className="chip">Open set</span>
            </div>
            <h3 className="list__title">Kinds registered by producers.</h3>
            <p className="list__copy">
              New kinds can be declared with a schema file; the contract polices
              the shape of the declaration, not the enumeration.
            </p>
            <div>
              <span className="panel__label">Tradeoffs</span>
              <p className="list__copy">
                Friendly to new workflows, lets the workspace grow without
                ceremony. Pays for it with a harder validator, messier
                cross-kind reporting, and a real risk that lookalike kinds
                proliferate instead of consolidating.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Source of truth</p>
          <h2 className="panel__title">Where the contract currently lives</h2>
          <p className="panel__lede">
            The real contract is not this page. It is a handful of files under{" "}
            <code>codebase-ema/code/ema/workspace/shared/</code>. The atlas
            surface is projection only.
          </p>
          <div className="route-links">
            <span className="chip">WORKSPACE_CONTRACT.md</span>
            <span className="chip">STATUS_VOCAB.md</span>
            <span className="chip">TIMESTAMP_RULES.md</span>
            <span className="chip">README.md</span>
          </div>
          <p className="list__copy">
            Atlas surface is projection only — if this page disagrees with the
            files, the files win.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/inbox">
              Inbox
            </Link>
            <Link className="chip" href="/handoff">
              Handoff
            </Link>
            <Link className="chip" href="/parts/shared-workspace">
              Shared workspace
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/questions">
              Open questions
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
