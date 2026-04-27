import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function TourForEngineerPage() {
  return (
    <SiteShell
      eyebrow="Tour"
      title="For the engineer"
      intro="You are going to touch code. This is where to start reading so your first change lands cleanly. Seven stops, roughly ten minutes, ending with three concrete PRs you can open this week."
    >
      <section className="panel">
        <p className="panel__tag">Stop 1</p>
        <h2>The rule, operationally</h2>
        <p>
          Start at the canonical rule. Every state transition in EMA is justified by an appended row in
          <code> event_log</code>, carrying an <code>ExecutionId</code> that ties cause to effect. If you cannot
          point to the event kind your code emits, you are not yet inside the system.
        </p>
        <div className="route-links">
          <Link className="chip" href="/canonical-rule">
            Open canonical rule
          </Link>
          <Link className="chip" href="/chronicle">
            Chronicle
          </Link>
          <Link className="chip" href="/event-kinds">
            Event kinds
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 2</p>
        <h2>Four state planes and their owners</h2>
        <p>
          EMA splits truth across four planes: Identity (<code>Actor</code>, <code>Principal</code>), Work
          (<code>Execution</code>, <code>Task</code>, <code>Decision</code>), Knowledge (<code>Artifact</code>,
          <code>Claim</code>), and Coordination (<code>Handoff</code>, <code>Proposal</code>, <code>Incident</code>).
          Each plane has one owner. Surfaces never own state; they render projections.
        </p>
        <div className="route-links">
          <Link className="chip" href="/state-planes">
            Open state planes
          </Link>
          <Link className="chip" href="/parts">
            Parts inventory
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 3</p>
        <h2>Event kinds you will be reading and writing</h2>
        <p>
          The event vocabulary groups into families: <code>execution.*</code>, <code>task.*</code>,
          <code> decision.*</code>, <code>artifact.*</code>, <code>handoff.*</code>, <code>proposal.*</code>,
          <code> incident.*</code>. When in doubt, extend an existing family before inventing a new kind.
        </p>
        <div className="route-links">
          <Link className="chip" href="/event-kinds">
            Open event kinds
          </Link>
          <Link className="chip" href="/chronicle">
            Chronicle
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 4</p>
        <h2>The chronicle is the evidence</h2>
        <p>
          The chronicle is the replay of <code>event_log</code> with causal links by <code>ExecutionId</code>.
          If your change does not leave a chronicle row, you wrote a surface-only side-effect, and an EMA auditor
          cannot reconstruct why your code ran. That is the single hardest line in the system.
        </p>
        <div className="route-links">
          <Link className="chip" href="/chronicle">
            Open chronicle
          </Link>
          <Link className="chip" href="/canonical-rule">
            Canonical rule
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 5</p>
        <h2>Drivers and the Hermes seam</h2>
        <p>
          EMA owns truth; Hermes owns execution. The boundary is the driver interface. The full contract surface
          (open question Q5) is still being negotiated, so most features today live behind a driver stub. When you
          add capability, you are almost always writing a driver adapter, not a new core service.
        </p>
        <div className="route-links">
          <Link className="chip" href="/driver-matrix">
            Open driver matrix
          </Link>
          <Link className="chip" href="/open-questions-map">
            Open questions
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 6</p>
        <h2>Handoffs, proposals, incidents</h2>
        <p>
          These are the coordination objects you will actually encounter in day-1 code. A <code>handoff</code> moves
          work between actors with a receipt; a <code>proposal</code> gates a decision before it commits; an
          <code> incident</code> opens when an invariant breaks. Most bugs I have seen are really missing handoff
          receipts.
        </p>
        <div className="route-links">
          <Link className="chip" href="/handoff">
            Open handoff
          </Link>
          <Link className="chip" href="/proposal-flow">
            Proposal flow
          </Link>
          <Link className="chip" href="/incidents">
            Incidents
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stop 7</p>
        <h2>Where work is claimed and wound down</h2>
        <p>
          An engineer's week is shaped by lane, phase, and cadence &mdash; not a Jira clone. The agent environment
          defines where work is claimed; the weekly cadence defines when it winds down. Read both together or the
          phase transitions will look arbitrary.
        </p>
        <div className="route-links">
          <Link className="chip" href="/agent-environment">
            Open agent environment
          </Link>
          <Link className="chip" href="/weekly-cadence">
            Weekly cadence
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">First PR suggestions</p>
        <h2>Three starter tasks</h2>
        <ul>
          <li>
            Read <code>codebase-ema/code/ema/workspace/shared/WORKSPACE_CONTRACT.md</code> and identify one
            undocumented status transition; open a PR that either documents it or removes it.
          </li>
          <li>
            Add a test for an existing <code>event_log</code> projection &mdash; pick the smallest one, assert it
            is a pure function of its input events, and make it fail if ordering is ignored.
          </li>
          <li>
            Pick one open Q from <code>/open-questions-map</code> and draft three counter-examples in a short
            memo. Counter-examples beat opinions when closing a Q.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/tour/for-skeptic">
            Tour: for the skeptic
          </Link>
          <Link className="chip" href="/demo/surface-tour">
            Surface tour
          </Link>
          <Link className="chip" href="/parts">
            Parts
          </Link>
          <Link className="chip" href="/questions">
            Questions
          </Link>
          <Link className="chip" href="/canonical-rule">
            Canonical rule
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
