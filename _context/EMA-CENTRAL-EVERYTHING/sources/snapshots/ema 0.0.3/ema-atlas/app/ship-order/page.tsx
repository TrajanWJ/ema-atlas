import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { vapps } from "../vapps/_data";

const order = [
  "chat",
  "launchpad",
  "virtual-desktop",
  "agent-virtual-environment",
  "wiki",
  "threads-server",
  "hq",
  "blueprint",
];

const justifications: Record<string, { why: string; proves: string }> = {
  chat: {
    why: "Single-driver, hermes-native, one provider, one tool — the shortest path from a user action to an ExecutionId landing in event_log.",
    proves: "Proves the canonical rule end-to-end: surface renders, Hermes executes, EMA owns truth.",
  },
  launchpad: {
    why: "A shell is only useful the moment one real vApp exists. Chat is that vApp, so Launchpad becomes the honest entry point right after it.",
    proves: "Proves the shell/vApp split without inventing new state — the shell hosts, it does not own.",
  },
  "virtual-desktop": {
    why: "A costume around the same Chat content. Ships after Launchpad because the desktop metaphor only pays off when there is something to dock.",
    proves: "Proves that the metaphor layer is cosmetic — same truth, same execution, different chrome.",
  },
  "agent-virtual-environment": {
    why: "A read-only projection over the dispatch event log, scoped to one agent. Adds a new metaphor without adding a new owner.",
    proves: "Proves that new surfaces can be born purely as views — zero new state, zero new writes.",
  },
  wiki: {
    why: "First surface that introduces a collab plane. Shipping it early, on purpose, forces Q2 (collab-plane ownership) into daylight rather than letting it hide.",
    proves: "Proves — or honestly stresses — that shared editing can land without surfaces owning state.",
  },
  "threads-server": {
    why: "A read-only Discord mirror is a wedge that defers the hard Q6 (federation/mesh semantics) by exactly one slice. Useful, but commits us if it goes first.",
    proves: "Proves the mirror pattern: canonical threads in event_log, Discord as a subscriber, not a source.",
  },
  hq: {
    why: "A dashboard is only as interesting as the feeds behind it. HQ needs live Hermes sessions and real project traffic to render as anything but placeholder.",
    proves: "Proves aggregation across projects — but only after there is something to aggregate.",
  },
  blueprint: {
    why: "Depends on the collab plane Wiki introduces and on a typed subgraph story. Last because every other surface is a prerequisite.",
    proves: "Proves the knowledge-structuring layer once the semantic plane underneath it is real.",
  },
};

const bySlug = Object.fromEntries(vapps.map((v) => [v.slug, v]));

export default function ShipOrderPage() {
  return (
    <SiteShell
      eyebrow="Decision pressure"
      title="Ship order — which surface first"
      intro="This route argues a sequence, not a roadmap. The prioritization rule is simple and unfriendly: the first thing we ship must prove the canonical rule, not perform it. Impressive surfaces that assume the rule already holds come later; the slice that forces EMA-owns-truth, Hermes-owns-execution, surfaces-do-not-own-state to be real goes first."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Proposed order</p>
          <h2 className="panel__title">Eight surfaces, in the order that respects the rule</h2>
          <p className="panel__lede">
            Each slot names a surface, quotes its smallestSlice from the canonical
            vApp metadata, justifies why it lands here, and states what shipping
            it proves. Defend or reorder — but not without naming a concrete
            failure mode.
          </p>
        </div>
        <div className="card-grid">
          {order.map((slug, i) => {
            const v = bySlug[slug];
            const j = justifications[slug];
            return (
              <article key={slug} className="panel vapp-card">
                <div className="vapp-card__head">
                  <p className="list__eyebrow">Slot {i + 1}</p>
                  <span className="chip">{v.group === "shell" ? "Shell" : "vApp"}</span>
                </div>
                <h3 className="list__title">
                  <Link href={`/vapps/${v.slug}`}>{v.name}</Link>
                </h3>
                <div>
                  <span className="panel__label">Smallest slice</span>
                  <p className="list__copy">{v.smallestSlice}</p>
                </div>
                <div>
                  <span className="panel__label">Why this slot</span>
                  <p className="list__copy">{j.why}</p>
                </div>
                <div>
                  <span className="panel__label">What it proves</span>
                  <p className="list__copy">{j.proves}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Counter-arguments</p>
          <h2 className="panel__title">Why NOT ship X first</h2>
          <p className="panel__lede">
            Four tempting early picks, each rebutted with a concrete failure
            mode. These are the arguments the order has to win against.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Counter</p>
              <span className="chip">HQ</span>
            </div>
            <h3 className="list__title">Ship HQ first</h3>
            <p className="list__copy">
              Failure mode: HQ renders empty pre-traffic. With no running Hermes
              sessions and no PR feeds to aggregate, the dashboard becomes a
              shell of placeholder cards. Worse, it tempts someone to seed fake
              state into the surface to make it look alive — the exact rule
              violation we are trying to avoid.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Counter</p>
              <span className="chip">Wiki</span>
            </div>
            <h3 className="list__title">Ship Wiki first</h3>
            <p className="list__copy">
              Failure mode: forces Q2 (collab-plane ownership) and Q8
              (projection/reconciliation) before the rule has been proven on a
              single-driver slice. We would be debating multiplayer edit
              semantics while still unsure where an ExecutionId lands. Wiki
              belongs early — but not first.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Counter</p>
              <span className="chip">Threads</span>
            </div>
            <h3 className="list__title">Ship Threads / Server first</h3>
            <p className="list__copy">
              Failure mode: commits Q6 (mesh/federation) prematurely. A Discord
              mirror looks like a cheap wedge, but it drags channel semantics,
              webhook ordering, and identity across the boundary into the
              canonical record on day one — before we have decided what
              federation even means.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Counter</p>
              <span className="chip">Virtual Desktop</span>
            </div>
            <h3 className="list__title">Ship Virtual Desktop first</h3>
            <p className="list__copy">
              Failure mode: costume without content. A wallpaper and a dock
              around nothing is a demo, not a proof. The desktop metaphor is
              the right shape, but shipping it before Chat means selling a
              chrome that has no canonical truth behind its windows.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Decision tree</p>
          <h2 className="panel__title">One rule, one question</h2>
          <p className="panel__lede">
            Pick the slice that proves the canonical rule using the fewest open
            questions. Every other criterion — visual surface area, demo
            appeal, strategic story — is downstream of that one test. Chat is
            the only slice where a single driver, a single provider, and a
            single tool are enough to make EMA-owns-truth visible end-to-end.
            That is Chat today. Everything else either needs Chat to exist
            first, or drags an unresolved question into the very first ship.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">What would change the order</p>
          <h2 className="panel__title">Triggers that reshuffle the sequence</h2>
          <ul className="inline-list">
            <li>
              <strong>Q2 resolves</strong> — if collab-plane ownership gets a
              concrete answer, Wiki jumps. The reason it sits at slot 5 is
              entirely that Q2 is open; close Q2 and Wiki can ship right after
              Chat.
            </li>
            <li>
              <strong>A real project starts running Hermes sessions</strong> —
              HQ jumps. The only reason HQ is late is that it needs feeds; the
              moment there is live traffic across two projects, HQ stops being
              placeholder and starts being the most valuable surface in the
              set.
            </li>
            <li>
              <strong>Mesh gets decided</strong> — Virtual Desktop gains
              weight. The desktop metaphor leans on Mesh / Replication /
              Presence; once the mesh answer exists, the desktop is no longer a
              costume and can rise above the AVE slot.
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
            <Link className="chip" href="/vapps">
              vApps
            </Link>
            <Link className="chip" href="/open-questions-map">
              Open questions map
            </Link>
            <Link className="chip" href="/mesh">
              Mesh
            </Link>
            <Link className="chip" href="/questions">
              Questions
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
