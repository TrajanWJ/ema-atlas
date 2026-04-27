import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function OnboardingScenarioPage() {
  return (
    <SiteShell
      eyebrow="Scenario"
      title="First 30 minutes — joining ema-0.0.3"
      intro="A new teammate, @riley, accepts an invite to acme-labs / ema-0.0.3 / core and spends thirty minutes getting oriented. Every stop below is an observable row on event_log — reads leave chronicle.read trails, the first write is a deliberate comment, and the session ends with a handoff queued for review. Surfaces only render what the log has already recorded."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">t+0m</p>
          <h2 className="panel__title">Invite accepted, space joined</h2>
          <p className="panel__lede">
            <span className="chip"><code>space.joined</code></span>{" "}
            <span className="chip">user <code>@riley</code></span>{" "}
            <span className="chip">space <code>core</code></span>
          </p>
          <p className="list__copy">
            @riley clicks the invite link for <code>acme-labs / ema-0.0.3 / core</code>.
            A <code>space.joined</code> row is appended carrying actor{" "}
            <code>@riley</code> and space <code>core</code>. The personal HQ and
            the project-space roster both recompute membership from that row —
            neither surface stored the fact locally.
          </p>
          <div className="route-links">
            <Link className="chip" href="/project-space">/project-space</Link>
            <Link className="chip" href="/hq/personal">/hq/personal</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+2m</p>
          <h2 className="panel__title">Launchpad opens on ema-0.0.3</h2>
          <p className="panel__lede">
            <span className="chip"><code>launchpad.project.switched</code></span>{" "}
            <span className="chip">subject <code>ema-0.0.3</code></span>
          </p>
          <p className="list__copy">
            From personal HQ, @riley switches context into the project. A{" "}
            <code>launchpad.project.switched</code> row names{" "}
            <code>ema-0.0.3</code> as subject. The Launchpad tiles render from
            the log — recent chronicle, open incidents, pending proposals — so
            the first screen is already a projection, not a dashboard write.
          </p>
          <div className="route-links">
            <Link className="chip" href="/launchpad">/launchpad</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+4m</p>
          <h2 className="panel__title">Glossary read</h2>
          <p className="panel__lede">
            <span className="chip"><code>chronicle.read</code></span>{" "}
            <span className="chip">scope <code>glossary</code></span>{" "}
            <span className="chip">actor <code>@riley</code></span>
          </p>
          <p className="list__copy">
            @riley opens the glossary to anchor vocabulary before touching
            anything live. Each term view appends a <code>chronicle.read</code>{" "}
            row scoped to <code>glossary</code>. The reads are observable — a
            later review can see exactly which terms the new user checked first.
          </p>
          <div className="route-links">
            <Link className="chip" href="/glossary-app">/glossary-app</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+7m</p>
          <h2 className="panel__title">Canonical rule opened</h2>
          <p className="panel__lede">
            <span className="chip"><code>chronicle.read</code></span>{" "}
            <span className="chip">scope <code>canonical-rule</code></span>
          </p>
          <p className="list__copy">
            @riley reads the canonical rule — EMA owns truth, Hermes owns
            execution, surfaces render only. The read is appended as a{" "}
            <code>chronicle.read</code> row against the{" "}
            <code>canonical-rule</code> scope. The rule is not a setting; it is
            a log-backed document the onboarding surface can replay.
          </p>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">/canonical-rule</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+12m</p>
          <h2 className="panel__title">Chat example, read-only</h2>
          <p className="panel__lede">
            <span className="chip"><code>session.started</code></span>{" "}
            <span className="chip">mode read-only</span>{" "}
            <span className="chip">actor <code>@riley</code></span>
          </p>
          <p className="list__copy">
            @riley opens a prior chat session to see how an agent-assisted
            triage actually reads. A <code>session.started</code> row is
            appended with mode read-only and actor <code>@riley</code>; no
            <code>tool.called</code> rows follow because the session is scoped
            to observation. The transcript is a projection of the original log.
          </p>
          <div className="route-links">
            <Link className="chip" href="/chat">/chat</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+18m</p>
          <h2 className="panel__title">HQ project view, pending incident</h2>
          <p className="panel__lede">
            <span className="chip">render-only</span>{" "}
            <span className="chip"><code>chronicle.read</code></span>{" "}
            <span className="chip">subject <code>ema-0.0.3</code></span>
          </p>
          <p className="list__copy">
            @riley opens the project HQ and sees one open incident card
            projected from <code>event_log</code>. The visit appends a{" "}
            <code>chronicle.read</code> row against the project subject. @riley
            has no ack permission yet — the card is visible but not actionable,
            which is itself an observable constraint.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq/project">/hq/project</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+23m</p>
          <h2 className="panel__title">First write — comment on a Q2 wiki node</h2>
          <p className="panel__lede">
            <span className="chip"><code>wiki.node.commented</code></span>{" "}
            <span className="chip">node <code>Q2-open</code></span>{" "}
            <span className="chip">actor <code>@riley</code></span>
          </p>
          <p className="list__copy">
            @riley leaves a question on the wiki node tracking{" "}
            <code>Q2-open</code>. The <code>wiki.node.commented</code> row is
            the first write @riley has produced in this project. It lands on an
            open question deliberately — the onboarding path routes the first
            contribution toward an unresolved thread, not a closed one.
          </p>
          <div className="route-links">
            <Link className="chip" href="/wiki/node/example">/wiki/node/example</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">t+30m</p>
          <h2 className="panel__title">First handoff queued</h2>
          <p className="panel__lede">
            <span className="chip"><code>handoff.proposed</code></span>{" "}
            <span className="chip">actor <code>@riley</code></span>
          </p>
          <p className="list__copy">
            To close the session, @riley proposes a handoff summarizing what
            was read and the Q2 comment that was left. A{" "}
            <code>handoff.proposed</code> row appends with @riley as actor. The
            handoff is not applied — it queues against the canonical review
            path so a maintainer can decide before anything downstream moves.
          </p>
          <div className="route-links">
            <Link className="chip" href="/handoff">/handoff</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Observations</p>
          <h2 className="panel__title">What the scenario proves</h2>
          <ul className="inline-list">
            <li>
              Onboarding is a sequence of reads — five of the eight stops are
              <code>chronicle.read</code> or read-only projections before any
              write lands.
            </li>
            <li>
              The first write is a <code>wiki.node.commented</code> row on{" "}
              <code>Q2-open</code> — the path deliberately points a new user at
              an unresolved question, not a closed one.
            </li>
            <li>
              Permission scope from Q10 is exactly what just worked (read on
              glossary, canonical-rule, chat, HQ; comment on wiki) or didn't
              (no ack on the open incident) — visible in the log.
            </li>
          </ul>
          <div className="route-links">
            <Link className="chip" href="/scenarios/incident-response">/scenarios/incident-response</Link>
            <Link className="chip" href="/tour/for-skeptic">/tour/for-skeptic</Link>
            <Link className="chip" href="/hq/personal">/hq/personal</Link>
            <Link className="chip" href="/canonical-rule">/canonical-rule</Link>
            <Link className="chip" href="/questions">/questions</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
