import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function EvidenceTiersPage() {
  return (
    <SiteShell
      eyebrow="Evidence"
      title="Confirmed · Inferred · Speculative"
      intro="The three tiers are a live contract with the reader, not a style choice. Keeping them visible is Rule #1 of the workboard because EMA owns truth and surfaces do not — so every claim has to carry, on its face, how far it has travelled toward being canonical. Smoothing the tiers into one confident voice is how an atlas quietly starts lying."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Tiers</p>
          <h2 className="panel__title">Three tiers, three contracts</h2>
          <p className="panel__lede">
            Each tier names a different relationship between a claim and its
            source. A tier is admitted by evidence, not by tone. Promotion
            across tiers is the only way a claim moves — it never drifts up by
            repetition.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Tier 1</p>
              <span className="chip">Confirmed</span>
            </div>
            <h3 className="list__title">Backed by code or a logged event.</h3>
            <p className="list__copy">
              A claim whose source you can point at — a file in the repo, a
              commit, or a dispatch already written to <code>event_log</code>.
            </p>
            <div>
              <span className="panel__label">Admission</span>
              <p className="list__copy">
                Requires a concrete artifact path, commit SHA, or{" "}
                <code>ExecutionId</code>.
              </p>
            </div>
            <div>
              <span className="panel__label">Shows up as</span>
              <p className="list__copy">
                Inline references like <code>codebase-ema/app/api/…</code> or{" "}
                <code>codebase-hermes/driver/…</code>, cited decisions, logged
                dispatches.
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Tier 2</p>
              <span className="chip">Inferred</span>
            </div>
            <h3 className="list__title">Reasoned from visible pieces.</h3>
            <p className="list__copy">
              A claim the code does not state directly but that follows from
              what is Confirmed. It names its basis in prose — &quot;likely&quot;,
              &quot;implied by&quot;, &quot;reads as&quot;.
            </p>
            <div>
              <span className="panel__label">Admission</span>
              <p className="list__copy">
                Requires a source lineage: which Confirmed pieces the inference
                rests on, stated in the same paragraph.
              </p>
            </div>
            <div>
              <span className="panel__label">Shows up as</span>
              <p className="list__copy">
                Brief prose naming a likely shape — &quot;the dispatcher
                <em> likely</em> fans out per driver&quot; — with the Confirmed
                pieces it leans on.
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Tier 3</p>
              <span className="chip">Speculative</span>
            </div>
            <h3 className="list__title">Named as a possible future.</h3>
            <p className="list__copy">
              A claim that has no source yet — a direction, a three-futures
              sketch, an option still under pressure. It is marked so the reader
              never mistakes it for observation.
            </p>
            <div>
              <span className="panel__label">Admission</span>
              <p className="list__copy">
                Requires the speculative frame to be explicit — &quot;one
                future&quot;, &quot;could become&quot;, &quot;if we chose&quot;.
              </p>
            </div>
            <div>
              <span className="panel__label">Shows up as</span>
              <p className="list__copy">
                Three-futures copy on route briefs, open-question branches,
                &quot;if this lands&quot; sketches on the futures board.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Promotion</p>
          <h2 className="panel__title">How a claim moves up</h2>
          <p className="panel__lede">
            Promotion is a four-step flow with a named event at each edge. A
            claim can also be archived if the pressure behind it dissolves.
            Inferred → Confirmed <strong>requires source</strong> — a file
            path, a commit, or an execution event. Consensus is not source.
          </p>
          <ol className="inline-list">
            <li>
              <strong>Spotted.</strong> Someone names a claim worth tracking.
              Event: <code>evidence.spotted</code>. Tier: none yet — the claim
              is a candidate.
            </li>
            <li>
              <strong>Spotted → Speculative.</strong> The claim is framed as a
              possible future and admitted into the atlas as such. Event:{" "}
              <code>evidence.speculative</code> (on entry). It travels under a
              <code>[Speculative]</code> chip.
            </li>
            <li>
              <strong>Speculative → Inferred.</strong> Enough Confirmed pieces
              accumulate that the claim follows by reasoning. Event:{" "}
              <code>evidence.inferred</code>, carrying the source lineage it
              leans on.
            </li>
            <li>
              <strong>Inferred → Confirmed.</strong> A file, commit, or{" "}
              <code>ExecutionId</code> pins the claim to reality. Event:{" "}
              <code>evidence.confirmed</code>, carrying the artifact reference.
              If the claim is later retracted, event:{" "}
              <code>evidence.archived</code>.
            </li>
          </ol>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Forbidden promotions</p>
          <h2 className="panel__title">Four ways the tiers get laundered</h2>
          <p className="panel__lede">
            Each of these moves a claim up a tier without evidence. They are
            all ways the atlas quietly becomes fiction. If you catch one,
            demote the claim back — do not rewrite the definition of the tier.
          </p>
          <ul className="inline-list">
            <li>
              <strong>Promoting by consensus.</strong> Several readers agree,
              so the claim gets rewritten as Confirmed. Agreement is not a
              source.
            </li>
            <li>
              <strong>Promoting without source lineage.</strong> An Inferred
              claim is restated as Confirmed with no file, commit, or event
              attached. The lineage gap is the violation.
            </li>
            <li>
              <strong>Promoting because it looks cleaner.</strong> The tier
              chip is dropped so the paragraph reads more confidently.
              Smoothing the voice smoothes away the contract.
            </li>
            <li>
              <strong>Promoting because it unblocks a deliverable.</strong> A
              Speculative direction is treated as settled so a brief can ship.
              Deadline pressure is not evidence.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Mock tiered snippet</p>
          <h2 className="panel__title">How the chips read in a brief</h2>
          <p className="panel__lede">
            A short rendered mock of three paragraphs at three tiers, each
            carrying a chip and an inline source hint. The point is that the
            chips are not decoration — drop them and the paragraphs become
            indistinguishable.
          </p>
          <ul className="inline-list">
            <li>
              <span className="chip">Confirmed</span> The control plane writes
              dispatches through a single action handler —{" "}
              <code>codebase-ema/app/api/dispatch/route.ts</code>. All incident
              state lands in <code>event_log</code> from there.
            </li>
            <li>
              <span className="chip">Inferred</span> The driver pool{" "}
              <em>likely</em> fans out per-provider rather than per-request,
              based on the handler shape above and the driver registry in{" "}
              <code>codebase-hermes/driver/registry.ts</code>. Not stated
              directly; follows from both pieces.
            </li>
            <li>
              <span className="chip">Speculative</span> One future has Hermes
              handing back a streaming <code>ExecutionId</code> before the
              dispatch is canonical, so surfaces can render in-flight state
              without owning it. No source yet — a direction under pressure.
            </li>
          </ul>
          <p className="list__copy">
            Caption: smoothing the tiers away is the anti-pattern this page
            names. A brief that reads all three paragraphs in the same
            confident voice has broken Rule #1 even if every sentence is true.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Where the rule lives</p>
          <h2 className="panel__title">Source documents for this contract</h2>
          <p className="panel__lede">
            These are repo-root files, not routes. They are where the tier
            discipline is written down and argued, and where a challenge to it
            belongs.
          </p>
          <div className="route-links">
            <span className="chip">ema-003-workboard.md</span>
            <span className="chip">CONTRIBUTING_TO_GRAPH.md</span>
            <span className="chip">OPEN_QUESTIONS.md</span>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/anti-patterns">
              Anti-patterns
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/open-questions-map">
              Open questions map
            </Link>
            <Link className="chip" href="/questions">
              Questions
            </Link>
            <Link className="chip" href="/parts">
              Parts
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
