import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function CanonicalRulePage() {
  return (
    <SiteShell
      eyebrow="Canonical rule"
      title="EMA owns truth. Hermes owns execution. Surfaces do not own state."
      intro="This is the architectural commitment the whole atlas pressures against. Every surface, every subsystem, every open question in the program is ultimately a test of this one rule. State this bluntly, then read the rest of the atlas as proof, strain, or cost against it."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">The three clauses</p>
          <h2 className="panel__title">One sentence, three commitments</h2>
          <p className="panel__lede">
            The rule is a single sentence because each clause names a different
            owner of a different kind of state. Read one at a time, each clause
            points at concrete objects that belong to it and nothing else.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Clause 1</p>
              <span className="chip">Truth</span>
            </div>
            <h3 className="list__title">EMA owns truth.</h3>
            <p className="list__copy">
              The control plane is the one place durable facts land. If it is
              not in EMA, it is not canonical, even if a surface is rendering
              it.
            </p>
            <div>
              <span className="panel__label">Names</span>
              <p className="list__copy">
                <code>event_log</code>, <code>ExecutionId</code>
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Clause 2</p>
              <span className="chip">Execution</span>
            </div>
            <h3 className="list__title">Hermes owns execution.</h3>
            <p className="list__copy">
              Runtime — live sessions, tool calls, streamed tokens — lives and
              dies inside Hermes. Surfaces observe it; they never persist it.
            </p>
            <div>
              <span className="panel__label">Names</span>
              <p className="list__copy">
                Hermes dispatches, driver processes, <code>ExecutionId</code>{" "}
                handed back to the control plane
              </p>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Clause 3</p>
              <span className="chip">Rendering</span>
            </div>
            <h3 className="list__title">Surfaces do not own state.</h3>
            <p className="list__copy">
              Chat, Wiki, Blueprint, HQ, Threads — all render planes they do
              not own. If a surface disappears, no truth is lost.
            </p>
            <div>
              <span className="panel__label">Names</span>
              <p className="list__copy">
                Chat, HQ, Wiki, Threads, Blueprint, Launchpad, Virtual Desktop
              </p>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Allowed</p>
          <h2 className="panel__title">What the rule allows</h2>
          <p className="panel__lede">
            Everything below is explicitly permitted and expected. This is the
            shape of compliance, not a concession.
          </p>
          <ul className="inline-list">
            <li>
              A surface reads dispatch events from <code>event_log</code> and
              renders them — Chat, HQ, and Threads all do this.
            </li>
            <li>
              Hermes produces <code>ExecutionId</code>s and hands them back to
              the control plane, which writes them as canonical facts.
            </li>
            <li>
              A surface proposes a mutation by calling a control-plane action;
              EMA decides whether the write lands in <code>event_log</code>.
            </li>
            <li>
              Workspace files on disk (briefs, artifacts, repo content) are
              truth for their own kind; surfaces read and write them via the
              workspace contract, not via private state.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Forbidden</p>
          <h2 className="panel__title">What the rule forbids</h2>
          <p className="panel__lede">
            Each of these is a direct violation. If you catch one shipping, the
            rule has already been broken — roll it back, do not paper over it.
          </p>
          <ul className="inline-list">
            <li>
              A surface holding incident state in its own store — incidents
              belong on the control plane, inside <code>event_log</code>.
            </li>
            <li>
              A surface mutating <code>event_log</code> without going through a
              control-plane action — no direct writes, ever.
            </li>
            <li>
              Chat becoming the truth layer — messages rendered in Chat are
              projections of dispatches, not the canonical record themselves.
            </li>
            <li>
              Hermes deciding on its own whether a dispatch is canonical —
              Hermes executes and reports; EMA decides what counts.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Costs</p>
          <h2 className="panel__title">What the rule costs</h2>
          <p className="panel__lede">
            The rule is not free. These are the tradeoffs we accept in exchange
            for one owner per kind of state.
          </p>
          <ul className="inline-list">
            <li>
              More ceremony on capture. Every fact worth keeping has to travel
              through a control-plane action before it lands — no surface
              shortcut, no local stash.
            </li>
            <li>
              A harder-than-usual sync model between surfaces and{" "}
              <code>event_log</code>. Surfaces render projections that can lag,
              and the reconciliation story is still open — flags Q8.
            </li>
            <li>
              Real work to make attribution first-class. Every dispatch needs a
              clear actor, target, and <code>ExecutionId</code> stitched back
              into <code>event_log</code> — flags Q1.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Diagnostic</p>
          <h2 className="panel__title">How to tell if you&apos;re violating it</h2>
          <p className="panel__lede">
            Four questions to ask at your keyboard before you ship. If any
            answer points the wrong way, the surface is owning something it
            shouldn&apos;t.
          </p>
          <ul className="inline-list">
            <li>
              If this surface goes offline, is any real state lost? If yes, the
              surface owns too much — push it to <code>event_log</code>.
            </li>
            <li>
              Is this surface writing somewhere other than through a
              control-plane action? If yes, it is mutating truth directly and
              the rule is broken.
            </li>
            <li>
              Is Hermes making a canonicality decision about its own dispatch?
              If yes, execution is claiming truth — route that decision back
              into EMA.
            </li>
            <li>
              Can you point to a single <code>ExecutionId</code> that ties this
              runtime action back to <code>event_log</code>? If no, attribution
              is missing and Q1 is biting you.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/surfaces-map">
              Surfaces map
            </Link>
            <Link className="chip" href="/parts/authority-control-plane">
              Authority / control plane
            </Link>
            <Link className="chip" href="/parts/harness-execution">
              Harness / execution
            </Link>
            <Link className="chip" href="/parts/shells-surfaces">
              Shells / surfaces
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
