import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function ProposalFlowPage() {
  return (
    <SiteShell
      eyebrow="Control plane"
      title="Proposal flow"
      intro="Proposals are how consequential moves become authorized. An actor — agent or human — drafts a proposal; an authorized decider approves or rejects it; the decision lands as a control-plane event. Nothing consequential happens in EMA without a proposal and a recorded decision."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Proposal kinds</p>
          <h2 className="panel__title">Five kinds of proposal</h2>
          <p className="panel__lede">
            Each kind names a consequential move. The proposer and the decider
            are separate roles — proposing is cheap, deciding binds the
            control plane.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip">driver.enable</span>
            </div>
            <h3 className="list__title">driver.enable</h3>
            <p className="list__copy">
              Authorize a named driver (e.g. <code>claude-cli</code>) to run
              inside a space.
            </p>
            <div>
              <span className="panel__label">Who can propose</span>
              <p className="list__copy">either (agent or human)</p>
            </div>
            <div>
              <span className="panel__label">Who can decide</span>
              <p className="list__copy">human-only — <code>org-admin</code></p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip">feed.register</span>
            </div>
            <h3 className="list__title">feed.register</h3>
            <p className="list__copy">
              Register a new inbound feed (webhook, mailbox, source) against a
              space.
            </p>
            <div>
              <span className="panel__label">Who can propose</span>
              <p className="list__copy">either</p>
            </div>
            <div>
              <span className="panel__label">Who can decide</span>
              <p className="list__copy">
                control-plane-role — <code>space-steward</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip">handoff.promote</span>
            </div>
            <h3 className="list__title">handoff.promote</h3>
            <p className="list__copy">
              Promote a draft handoff from one actor to another as a committed
              transfer of work.
            </p>
            <div>
              <span className="panel__label">Who can propose</span>
              <p className="list__copy">agent</p>
            </div>
            <div>
              <span className="panel__label">Who can decide</span>
              <p className="list__copy">
                control-plane-role — receiving actor or{" "}
                <code>project-lead</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip">incident.escalate</span>
            </div>
            <h3 className="list__title">incident.escalate</h3>
            <p className="list__copy">
              Raise an open incident to a higher severity and page an on-call
              decider.
            </p>
            <div>
              <span className="panel__label">Who can propose</span>
              <p className="list__copy">either</p>
            </div>
            <div>
              <span className="panel__label">Who can decide</span>
              <p className="list__copy">
                human-only — <code>incident-commander</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip">space.join</span>
            </div>
            <h3 className="list__title">space.join</h3>
            <p className="list__copy">
              Admit a new actor (agent or human) as a member of a space.
            </p>
            <div>
              <span className="panel__label">Who can propose</span>
              <p className="list__copy">either</p>
            </div>
            <div>
              <span className="panel__label">Who can decide</span>
              <p className="list__copy">
                control-plane-role — <code>space-steward</code>
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Lifecycle</p>
          <h2 className="panel__title">Five states, four edges</h2>
          <p className="panel__lede">
            A proposal walks through five states. The edges between them are
            control-plane events written to <code>event_log</code> — the
            decision itself is an event, not a surface toggle.
          </p>
          <ul className="inline-list">
            <li>
              <strong>drafted</strong> — proposer is still composing{" "}
              <code>proposal_44</code>; no event yet.
            </li>
            <li>
              <strong>submitted</strong> — edge{" "}
              <code>proposal.submitted</code> writes{" "}
              <code>proposal_44</code> to <code>event_log</code>.
            </li>
            <li>
              <strong>pending</strong> — edge <code>proposal.pending</code>{" "}
              marks it awaiting a named decider (<code>org-admin</code>).
            </li>
            <li>
              <strong>decided (approved | rejected)</strong> — edge{" "}
              <code>proposal.decided</code> carries the decider, the outcome,
              and the rationale.
            </li>
            <li>
              <strong>recorded</strong> — edge <code>proposal.recorded</code>{" "}
              stitches the decision into downstream planes (driver registry,
              feed registry, incident board).
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Mock proposal</p>
          <h2 className="panel__title">proposal_44 — driver.enable</h2>
          <p className="panel__lede">
            A concrete record as it would appear to any surface reading{" "}
            <code>event_log</code>. Status is not held by the surface; the
            surface renders what the log says.
          </p>
          <ul className="inline-list">
            <li>
              <strong>id</strong> — <code>proposal_44</code>
            </li>
            <li>
              <strong>kind</strong> — <code>driver.enable</code>
            </li>
            <li>
              <strong>subject</strong> — <code>driver=claude-cli</code>
            </li>
            <li>
              <strong>proposed-by</strong> — <code>@claude-a1</code>
            </li>
            <li>
              <strong>requires</strong> — role <code>org-admin</code>
            </li>
            <li>
              <strong>state</strong> — pending since{" "}
              <code>2026-04-22T09:14Z</code>
            </li>
            <li>
              <strong>rationale L1</strong> — project-space{" "}
              <code>atlas-stage</code> needs CLI driver to run the briefs lane
              this week.
            </li>
            <li>
              <strong>rationale L2</strong> — no existing driver covers the
              shell scope; fallback would block handoff{" "}
              <code>handoff_17</code>.
            </li>
            <li>
              <strong>chronicle</strong> —{" "}
              <code>chronicle://atlas-stage/briefs#2026-04-21</code>
            </li>
            <li>
              <strong>chronicle</strong> —{" "}
              <code>chronicle://atlas-stage/handoff_17</code>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Authority &amp; role mapping</p>
          <h2 className="panel__title">Who can decide what</h2>
          <p className="panel__lede">
            Decision authority is carried by org and space roles. The exact
            bridge from a role to the runtime scope it grants is still open —
            this is Q10.
          </p>
          <ul className="inline-list">
            <li>
              <code>driver.enable</code> → org role <code>org-admin</code>{" "}
              decides; space role <code>space-steward</code> may co-sign — the
              mapping is Q10-open.
            </li>
            <li>
              <code>feed.register</code> → space role{" "}
              <code>space-steward</code> decides inside the space — the
              mapping is Q10-open.
            </li>
            <li>
              <code>handoff.promote</code> → receiving actor plus{" "}
              <code>project-lead</code> on the target project — the mapping is
              Q10-open.
            </li>
            <li>
              <code>incident.escalate</code> → org role{" "}
              <code>incident-commander</code> decides regardless of space —
              the mapping is Q10-open.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Which surfaces show proposals</p>
          <h2 className="panel__title">Same record, many renders</h2>
          <p className="panel__lede">
            Proposals surface wherever decisions are made, but no surface
            holds the record. Each of these routes reads{" "}
            <code>proposal_44</code> from <code>event_log</code> and renders
            its current state.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq">
              /hq
            </Link>
            <Link className="chip" href="/hq/project">
              /hq/project
            </Link>
            <Link className="chip" href="/chat">
              /chat
            </Link>
            <Link className="chip" href="/threads">
              /threads
            </Link>
          </div>
          <p className="list__copy">
            All four render the same record. A decision made in any of them
            must land as a control-plane event — never as surface-local
            status.
          </p>
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
            <Link className="chip" href="/project-space">
              Project space
            </Link>
            <Link className="chip" href="/incidents">
              Incidents
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
