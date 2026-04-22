import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function EventKindsPage() {
  return (
    <SiteShell
      eyebrow="Control plane"
      title="Event kinds — the canonical catalog"
      intro="Event kinds are a versioned contract between the control plane and everything that emits into it. Adding a kind is a control-plane action, not a surface decision: drivers, surfaces, and cadence listeners may emit existing kinds but never invent new ones ad hoc. This page is the single catalog every other route links back to."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Families</p>
          <h2 className="panel__title">The fourteen families</h2>
          <p className="panel__lede">
            Each family groups kinds by the concern they describe. Within a
            family, a kind is a one-line fact the control plane will accept.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">dispatch.*</span>
            </div>
            <h3 className="list__title">Dispatch lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>dispatch.created</code> — a new dispatch has been entered
                into the control plane.
              </li>
              <li>
                <code>dispatch.claimed</code> — a driver has accepted
                responsibility for a dispatch.
              </li>
              <li>
                <code>dispatch.released</code> — a claim has been dropped and
                the dispatch is available again.
              </li>
              <li>
                <code>dispatch.stalled</code> — a dispatch has gone quiet past
                its expected window.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">execution.*</span>
            </div>
            <h3 className="list__title">Execution lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>execution.started</code> — a runtime execution has
                entered Hermes.
              </li>
              <li>
                <code>execution.finished</code> — an execution has returned a
                terminal result.
              </li>
              <li>
                <code>execution.stalled</code> — an execution has stopped
                emitting progress past its budget.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">tool.*</span>
            </div>
            <h3 className="list__title">Tool calls</h3>
            <ul className="inline-list">
              <li>
                <code>tool.called</code> — a driver has invoked a tool.
              </li>
              <li>
                <code>tool.result</code> — a tool has returned a value.
              </li>
              <li>
                <code>tool.failed</code> — a tool call has errored.
              </li>
              <li>
                <code>tool.timeout</code> — a tool call has exceeded its
                deadline.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">handoff.*</span>
            </div>
            <h3 className="list__title">Handoff lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>handoff.proposed</code> — a handoff has been offered.
              </li>
              <li>
                <code>handoff.acked</code> — the proposed handoff has been
                acknowledged by its target.
              </li>
              <li>
                <code>handoff.accepted</code> — the target has agreed to take
                the handoff.
              </li>
              <li>
                <code>handoff.activated</code> — the target is now the live
                owner.
              </li>
              <li>
                <code>handoff.completed</code> — the handoff has reached its
                terminal state.
              </li>
              <li>
                <code>handoff.archived</code> — the completed handoff has been
                filed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">proposal.*</span>
            </div>
            <h3 className="list__title">Proposal flow</h3>
            <ul className="inline-list">
              <li>
                <code>proposal.submitted</code> — a proposal has entered the
                control plane.
              </li>
              <li>
                <code>proposal.pending</code> — a proposal is awaiting a
                decision.
              </li>
              <li>
                <code>proposal.decided</code> — a proposal has been accepted or
                rejected.
              </li>
              <li>
                <code>proposal.recorded</code> — the decision has been written
                to durable state.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">incident.*</span>
            </div>
            <h3 className="list__title">Incident lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>incident.detected</code> — a new incident has been
                opened.
              </li>
              <li>
                <code>incident.acked</code> — a responder has taken the
                incident.
              </li>
              <li>
                <code>incident.triaged</code> — severity and owner have been
                assigned.
              </li>
              <li>
                <code>incident.mitigated</code> — the acute impact has been
                contained.
              </li>
              <li>
                <code>incident.resolved</code> — the incident has a final
                closure note.
              </li>
              <li>
                <code>incident.archived</code> — the resolved incident has
                been filed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">session.*</span>
            </div>
            <h3 className="list__title">Session lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>session.started</code> — a human or agent session has
                begun.
              </li>
              <li>
                <code>session.ended</code> — a session has closed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">wiki.*</span>
            </div>
            <h3 className="list__title">Wiki writes</h3>
            <ul className="inline-list">
              <li>
                <code>wiki.node.edited</code> — a wiki node has been modified.
              </li>
              <li>
                <code>wiki.node.created</code> — a new wiki node has been
                added.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">collab.*</span>
              <span className="chip">Q2-open</span>
            </div>
            <h3 className="list__title">Collaboration threads</h3>
            <ul className="inline-list">
              <li>
                <code>collab.thread.resolved</code> — a discussion thread has
                been marked resolved.
              </li>
              <li>
                <code>collab.comment.posted</code> — a comment has been added
                to a thread.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">inbox.*</span>
            </div>
            <h3 className="list__title">Inbox pipeline</h3>
            <ul className="inline-list">
              <li>
                <code>inbox.item.created</code> — a new inbox item has landed.
              </li>
              <li>
                <code>inbox.item.classified</code> — an inbox item has been
                tagged.
              </li>
              <li>
                <code>inbox.item.promoted</code> — an inbox item has been
                promoted out of the inbox.
              </li>
              <li>
                <code>inbox.item.archived</code> — an inbox item has been
                filed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">queue.*</span>
            </div>
            <h3 className="list__title">Queue operations</h3>
            <ul className="inline-list">
              <li>
                <code>queue.item.created</code> — an item has been enqueued.
              </li>
              <li>
                <code>queue.item.popped</code> — an item has been pulled from
                the queue.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">cadence:*</span>
            </div>
            <h3 className="list__title">Cadence ticks</h3>
            <ul className="inline-list">
              <li>
                <code>cadence:daily</code> — the daily cadence has fired.
              </li>
              <li>
                <code>cadence:weekly</code> — the weekly cadence has fired.
              </li>
              <li>
                <code>cadence:checkpoint</code> — an explicit checkpoint
                cadence has fired.
              </li>
              <li>
                <code>cadence:phase-boundary</code> — a phase boundary has
                been crossed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">evidence.*</span>
            </div>
            <h3 className="list__title">Evidence lifecycle</h3>
            <ul className="inline-list">
              <li>
                <code>evidence.spotted</code> — a candidate signal has been
                noted.
              </li>
              <li>
                <code>evidence.inferred</code> — evidence has been derived
                from other facts.
              </li>
              <li>
                <code>evidence.confirmed</code> — evidence has been upgraded
                to canonical.
              </li>
              <li>
                <code>evidence.archived</code> — evidence has been filed out
                of the live set.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">launchpad.*</span>
            </div>
            <h3 className="list__title">Launchpad</h3>
            <ul className="inline-list">
              <li>
                <code>launchpad.project.switched</code> — the active project
                context has changed.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Family</p>
              <span className="chip">chronicle.*</span>
            </div>
            <h3 className="list__title">Chronicle</h3>
            <ul className="inline-list">
              <li>
                <code>chronicle.read</code> — a chronicle view has been
                opened.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Flow</p>
          <h2 className="panel__title">Who emits / who consumes</h2>
          <p className="panel__lede">
            Kinds flow one way: many emitters, several consumers, one sink.
          </p>
          <ul className="inline-list">
            <li>
              <span className="panel__label">Emitters</span> — drivers,
              surfaces, cadence listeners, and humans acting through a UI
              action.
            </li>
            <li>
              <span className="panel__label">Consumers</span> — HQ, Chat,
              Wiki, Agent-Env, and Chronicle render projections off the log.
            </li>
            <li>
              <span className="panel__label">Sole sink</span> — the control
              plane is the only place a kind lands as canonical; every other
              store is a projection.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Forbidden</p>
          <h2 className="panel__title">What the catalog forbids</h2>
          <ul className="inline-list">
            <li>
              Inventing kinds ad hoc from a driver, surface, or cadence
              listener.
            </li>
            <li>
              Encoding structured data inside a kind string instead of the
              event body.
            </li>
            <li>
              Mutating the kind vocabulary in place — change means a new
              version, never a silent rewrite.
            </li>
            <li>
              Using a surface-only kind — there is no such thing; a kind that
              only one surface understands is not a kind.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Adding a kind</p>
          <h2 className="panel__title">Three-step flow</h2>
          <ul className="inline-list">
            <li>
              Propose the new kind via{" "}
              <Link className="chip" href="/proposal-flow">
                /proposal-flow
              </Link>{" "}
              with its family, purpose, and expected emitters.
            </li>
            <li>
              Decide — the control plane accepts, rejects, or requests a
              revision; the decision is recorded as a{" "}
              <code>proposal.decided</code> event.
            </li>
            <li>
              Version-bump the catalog so every consumer sees the new kind
              behind a known contract version.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/chronicle">
              Chronicle
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/proposal-flow">
              Proposal flow
            </Link>
            <Link className="chip" href="/state-planes">
              State planes
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
