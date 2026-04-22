import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function AntiPatternsPage() {
  return (
    <SiteShell
      eyebrow="Catalog"
      title="Anti-patterns — things we will regret"
      intro="These are failure modes you can catch by reading a diff, not by squinting at a rendering. Each card names the signal, the breakage, and the correction — the goal is a URL you can point at during review instead of re-arguing the rule. If a pattern here ships, the canonical rule has already slipped."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Architecture (the big three)</p>
          <h2 className="panel__title">The mistakes AGENT_QUICKREF flags</h2>
          <p className="panel__lede">
            Three structural errors that re-collapse the work we just split
            apart. Each one looks innocent inside a single PR and only reveals
            its cost once the plane it blurred has to be untangled again.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Architecture 1</p>
              <span className="chip">Surfaces</span>
            </div>
            <h3 className="list__title">Surface becomes the workspace</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — the diff adds a
              durable store, queue, or cache inside Chat, HQ, Wiki, or
              Launchpad; data flows in but never back through a control-plane
              action.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — deleting the
              surface loses truth. Projections and canonical facts fuse, so
              every other renderer has to ask this surface instead of{" "}
              <code>event_log</code>.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — push the write
              back to a control-plane action; let the surface render the same
              record as everyone else from <code>event_log</code>.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Architecture 2</p>
              <span className="chip">Abstraction</span>
            </div>
            <h3 className="list__title">
              Providers, runtimes, agents collapsed into one abstraction
            </h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a single interface
              named <code>Agent</code> or <code>LLM</code> covers provider API,
              driver process, and identity-bearing agent at once.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — permissions,
              billing, and attribution all route through the same seam; you
              can&apos;t say which OpenAI call belonged to which agent acting in
              which space.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — keep the three
              layers named separately: provider (API), runtime (driver +{" "}
              <code>ExecutionId</code>), agent (identity in Org/Space).
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Architecture 3</p>
              <span className="chip">Order</span>
            </div>
            <h3 className="list__title">
              Distributed sync/orchestration before local/shared-state semantics
            </h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — the diff reaches
              for CRDTs, gossip, or peer replication while single-node
              read/write semantics for <code>event_log</code> and{" "}
              <code>workspace/shared/</code> are still open.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — you end up
              replicating an undefined object; reconciliation work hides the
              fact that nobody decided what the canonical shape was.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — finish
              local/shared semantics first, then layer replication over a shape
              that already survives single-node review.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Surface-level</p>
          <h2 className="panel__title">Specific surface regressions</h2>
          <p className="panel__lede">
            Named surfaces from the PRD each have a characteristic way of
            over-reaching. These are the shapes we have watched drift in draft
            PRs and sketches.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Chat</p>
              <span className="chip">Truth leak</span>
            </div>
            <h3 className="list__title">Chat becomes the truth layer</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — messages written
              to Chat&apos;s own store first, dispatches derived from them after
              the fact.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the canonical
              record of what happened lives in a renderer; closing Chat means
              losing history.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — dispatches
              land in <code>event_log</code>; Chat projects them. If Chat
              disappears, nothing is lost.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">HQ</p>
              <span className="chip">Secret sprawl</span>
            </div>
            <h3 className="list__title">HQ stores feed credentials</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — provider tokens,
              webhook secrets, or API keys are persisted in HQ&apos;s user
              config blob.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — HQ becomes a
              credential vault with surface-grade access control; rotating a
              token has to chase per-user surface state.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — credentials
              belong to the control plane&apos;s identity/permission model; HQ
              reads a rendered view keyed by the current actor.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Wiki</p>
              <span className="chip">Bypass</span>
            </div>
            <h3 className="list__title">Wiki edit bypasses event_log</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — Wiki writes go
              straight to a doc store without a control-plane proposal; no
              dispatch, no <code>ExecutionId</code>.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — semantic layer
              mutations are invisible to incidents, audit, and other surfaces;
              lineage of a page is lost.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — route edits
              through a control-plane action (pending Q8); the doc store is
              the projection, not the source of truth.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Launchpad</p>
              <span className="chip">Session drift</span>
            </div>
            <h3 className="list__title">Launchpad owns session state</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — Launchpad
              persists active project, agent, or driver selection as its own
              durable record.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — a second surface
              (HQ, Desktop) disagrees with Launchpad about what&apos;s
              &quot;current&quot;; resuming a crashed session needs Launchpad.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — session
              pointer lives on the control plane keyed by actor; Launchpad
              reads and proposes, nothing more.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Coordination / swarm</p>
          <h2 className="panel__title">Multi-agent workspace drift</h2>
          <p className="panel__lede">
            When parallel agents share a workspace, the pressure is always
            toward fast coordination at the expense of a single legible record.
            The swarm protocol is the counterweight.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Orchestrator</p>
              <span className="chip">Fork</span>
            </div>
            <h3 className="list__title">Orchestrator forks the record</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a second active
              wave or status file appears alongside the canonical one; the
              orchestrator writes into its private copy.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — workers read one
              record, reviewers read another; alignment drifts silently until
              merge.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — one active
              wave, one status file; updates land there or they don&apos;t
              count.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Handoff</p>
              <span className="chip">DM leak</span>
            </div>
            <h3 className="list__title">Handoff via DM instead of artifact</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — lane context is
              passed in a private message or commit body instead of landing in
              the shared workspace.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the next worker
              can&apos;t reconstruct the decision; the continuous-progress
              record has a hole where the handoff should be.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — every handoff
              is an artifact in the shared workspace; DMs point at it, not
              substitute for it.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Status</p>
              <span className="chip">Smoothing</span>
            </div>
            <h3 className="list__title">Status flattened to avoid conflict</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a worker edits
              another lane&apos;s status to &quot;green&quot; to resolve a
              reported blocker without re-running it.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the orchestrator
              loses its only honest signal; alignment becomes aesthetic
              instead of real.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — status is
              owned by the lane that produced it; conflicts escalate as their
              own artifact, not by overwriting.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Workspace</p>
              <span className="chip">No claim</span>
            </div>
            <h3 className="list__title">
              Workspace edits without claim or lane
            </h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a diff touches
              shared files with no lane header, no claim file, no link back to
              the active wave.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the continuous
              progress protocol breaks: two agents collide on the same file,
              and neither edit has provenance.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — claim first,
              edit second; the lane is part of the diff&apos;s identity, not a
              comment.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Doc / evidence</p>
          <h2 className="panel__title">Writing regressions</h2>
          <p className="panel__lede">
            The atlas is only useful if readers can tell confirmed facts from
            inferred ones. These are the ways that distinction erodes during
            ordinary editing.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Evidence</p>
              <span className="chip">Promotion</span>
            </div>
            <h3 className="list__title">
              Inferred promoted to Confirmed without evidence
            </h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — an{" "}
              <code>Inferred</code> label is dropped or re-tagged{" "}
              <code>Confirmed</code> without a new citation in the diff.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — downstream
              readers trust a claim the archive never actually supported.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — promotions
              require a linked source; if there isn&apos;t one, keep the
              label.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Question</p>
              <span className="chip">Smoothing</span>
            </div>
            <h3 className="list__title">Open question smoothed into prose</h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a Q-numbered open
              question is rewritten as declarative prose, the Q-marker
              removed.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the
              unresolved-ness disappears from the reader&apos;s model; the
              decision looks made when it isn&apos;t.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — keep the
              Q-marker and link back to <code>OPEN_QUESTIONS.md</code> until
              the question is actually closed.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Lineage</p>
              <span className="chip">Attribution</span>
            </div>
            <h3 className="list__title">
              Lineage attribution dropped during refactor
            </h3>
            <p className="list__copy">
              <span className="panel__label">Signal</span> — a node loses its{" "}
              <code>preserves_from</code> / <code>inspires</code> edge while
              text is reorganised; the content survives, the provenance
              doesn&apos;t.
            </p>
            <p className="list__copy">
              <span className="panel__label">Failure</span> — the graph gets
              thinner every refactor; we can no longer trace why a doctrine
              exists.
            </p>
            <p className="list__copy">
              <span className="panel__label">Correction</span> — refactors
              carry edges forward; if a source genuinely no longer applies,
              that&apos;s its own commit with a note.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Detection checklist</p>
          <h2 className="panel__title">Five diff-level questions</h2>
          <p className="panel__lede">
            Ask these at review time. A &quot;yes&quot; to any of them means
            the pattern above is probably in the diff — name it before the
            merge.
          </p>
          <ul className="inline-list">
            <li>
              Does this diff make a surface load-bearing for state — would
              deleting the surface lose truth that lives nowhere else?
            </li>
            <li>
              Does this driver produce ids (sessions, tool calls, provider
              handles) that the control plane never sees as an{" "}
              <code>ExecutionId</code>?
            </li>
            <li>
              Does this change reach for replication or cross-node sync before
              the single-node read/write contract it depends on is written
              down?
            </li>
            <li>
              Does this workspace edit land without a lane claim, an active
              wave reference, or a visible handoff artifact?
            </li>
            <li>
              Does this doc change promote, soften, or strip an evidence
              label, open-question marker, or lineage edge without a new
              citation to back the move?
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/surfaces-map">
              Surfaces map
            </Link>
            <Link className="chip" href="/open-questions-map">
              Open questions map
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
