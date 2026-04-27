import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /threads/bridge — Q6 decision-pressure surface.
 *
 * Q6 asks whether the Discord bridge is read-only or bidirectional. This
 * page lays the candidate directions side by side without smoothing them
 * into "we'll do both." EMA owns truth; Hermes owns execution; surfaces
 * do not own state. Discord is a mirror, not a source of truth — so the
 * decision is one of direction and write-back semantics, not parity.
 */

export default function ThreadsBridgePage() {
  return (
    <SiteShell
      eyebrow="Q6 — bridge direction"
      title="Discord ↔ EMA: which way does the bridge write?"
      intro="Q6 from the open-questions list: is the Discord bridge read-only, or bidirectional — and if bidirectional, who is the authority? This page is decision pressure, not resolution. Q6 is not closed here; it is made visible."
    >
      <section className="panel">
        <p className="panel__tag">Question framing</p>
        <h2 className="panel__title">Q6 — Discord mirror direction: read-only vs bidirectional</h2>
        <p className="panel__lede">
          The bridge has to commit to a direction. "Both ways, eventually"
          is not a direction — it is a deferral dressed up as an answer.
          Three forcing constraints sit under Q6 and none of them go away
          by picking the middle.
        </p>
        <ul className="inline-list">
          <li>
            <strong>Stable ids</strong> — every thread and message needs an
            EMA-side id that survives the bridge flipping, being paused, or
            being pointed at a different Discord server entirely.
          </li>
          <li>
            <strong>Attribution</strong> — a mirrored message must carry its
            origin author and timestamp intact; a write-back must not launder
            an EMA action into a Discord user's name.
          </li>
          <li>
            <strong>Authority delegation</strong> — exactly one side owns
            canonical state per object. Edits, deletes, and moderation all
            route to that side. Ambiguity here is the bug.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Three candidate directions</p>
        <h2 className="panel__title">Pick one honestly — each gives something up</h2>
        <p className="panel__lede">
          Three directions, three different things you have to build first,
          three different things you have to live without. No card here
          pretends its tradeoffs are free.
        </p>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Direction A</p>
              <span className="vapp-card__status vapp-card__status--ready">current wedge</span>
            </div>
            <h3 className="list__title">Read-only Discord → EMA (current wedge)</h3>
            <p className="list__copy">
              <strong>Bet:</strong> Discord stays the live surface; EMA
              becomes the durable, queryable reflection. One-way poll,
              stable EMA ids, no write-back.
            </p>
            <p className="list__copy">
              <strong>Tensions:</strong> every action a user takes inside
              the EMA shell on a bridged thread is either fake or a no-op
              — reply, react, edit all have to round-trip somewhere or be
              hidden. EMA starts looking like a read replica, not a home.
            </p>
            <p className="list__copy">
              <strong>Smallest slice:</strong> single channel, poll-based
              mirror, EMA id per thread and message.
            </p>
            <p className="list__copy">
              <strong>Would force you to build first:</strong> a reliable
              id map and a visible "this thread is mirrored, not owned"
              affordance on every bridged row.
            </p>
            <p className="list__copy">
              <strong>Gives up:</strong> the ability to ever call EMA the
              primary surface for conversation while Discord is still live.
            </p>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Direction B</p>
              <span className="vapp-card__status vapp-card__status--planned">contested</span>
            </div>
            <h3 className="list__title">Bidirectional with Discord-as-authority</h3>
            <p className="list__copy">
              <strong>Bet:</strong> Discord is canonical. EMA can write,
              but every write is a proxied action against Discord's API and
              Discord's state is the truth we re-read.
            </p>
            <p className="list__copy">
              <strong>Tensions:</strong> this directly breaks EMA's
              canonical rule. Identity, permissions, and thread lifecycle
              now live outside EMA; Q1, Q10, and the authority control plane
              all bend around Discord's model instead of ours.
            </p>
            <p className="list__copy">
              <strong>What breaks EMA's canonical rule:</strong> "EMA owns
              truth" becomes "EMA owns truth, except for conversations,
              which are Discord's." That exception metastasizes.
            </p>
            <p className="list__copy">
              <strong>Would force you to build first:</strong> a Discord
              OAuth + action-proxy layer, plus a conflict policy for when
              Discord state diverges between polls.
            </p>
            <p className="list__copy">
              <strong>Gives up:</strong> EMA's claim to be the source of
              truth for collaboration. You are now a nice client on top of
              Discord.
            </p>
          </article>

          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Direction C</p>
              <span className="vapp-card__status vapp-card__status--planned">ambitious</span>
            </div>
            <h3 className="list__title">Bidirectional with EMA-as-authority, Discord mirror</h3>
            <p className="list__copy">
              <strong>Bet:</strong> EMA is canonical. Threads, messages,
              edits, and moderation all originate or land in EMA; Discord
              becomes the mirror, driven by a Hermes driver that pushes
              state outward.
            </p>
            <p className="list__copy">
              <strong>Tensions:</strong> Discord users don't know they are
              talking to an EMA-backed shadow. Attribution, mentions, and
              permissions all have to round-trip through an EMA identity
              that Discord has no concept of.
            </p>
            <p className="list__copy">
              <strong>What this forces in identity + ids:</strong> every
              Discord user needs a resolvable EMA identity (or a stable
              shadow identity) before their first message can be written
              back — Q1 has to be answered to ship this.
            </p>
            <p className="list__copy">
              <strong>Would force you to build first:</strong> the identity
              resolution layer and a Hermes driver contract for outbound
              Discord writes with idempotency and retry.
            </p>
            <p className="list__copy">
              <strong>Gives up:</strong> speed. This is the slowest of the
              three to ship and the one most likely to stall on Q1.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Blast radius</p>
        <h2 className="panel__title">What Q6 actually touches</h2>
        <p className="panel__lede">
          Picking a direction here is not a local decision. Five other
          pieces of the atlas move depending on the answer.
        </p>
        <ul className="inline-list">
          <li>
            <strong>Q1 — identity.</strong> Direction C cannot ship until
            every Discord user has a resolvable EMA identity. A and B can
            defer Q1; C cannot.
          </li>
          <li>
            <strong>Q2 — collaboration plane.</strong> If Discord is the
            authority (B), the collab plane is effectively Discord's model.
            If EMA is (C), the collab plane has to be rich enough to drive
            Discord as a dumb mirror.
          </li>
          <li>
            <strong>Q10 — permissions.</strong> Who can edit, delete, or
            moderate a bridged message depends on which side is canonical.
            Read-only (A) sidesteps this; B and C force it immediately.
          </li>
          <li>
            <strong>Harness / driver contract.</strong> B needs a Discord
            action-proxy driver; C needs an outbound Discord-write driver
            with idempotency. A needs neither — just a poller.
          </li>
          <li>
            <strong>Shared workspace attribution.</strong> Any write-back
            path has to carry EMA authorship without laundering it into a
            Discord identity — the workspace attribution model has to
            survive the bridge.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Smallest provable slice (today)</p>
        <h2 className="panel__title">Single-channel read-only mirror with stable thread ids</h2>
        <p className="panel__lede">
          The current wedge is Direction A at its smallest: one Discord
          channel, polled one way into EMA, every thread and message
          assigned a stable EMA id. Nothing writes back. Nothing is
          edited. The bridge is a lens, not a hand.
        </p>
        <ul className="inline-list">
          <li>
            One server, one channel, read-only poll. No reactions, no
            edits, no moderation round-trips.
          </li>
          <li>
            Stable EMA ids on threads and messages from day one, so the
            downstream cost of flipping direction later is bounded.
          </li>
          <li>
            Attribution preserved verbatim from Discord — no EMA-side
            rewriting of authors or timestamps.
          </li>
          <li>
            <strong>Explicit:</strong> shipping this slice does not close
            Q6. It defers the decision by exactly one slice. The next slice
            — any write-back at all — forces B or C.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/threads">
            Threads / Server wedge
          </Link>
          <Link className="chip" href="/vapps/threads-server">
            Threads / Server brief
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/parts/authority-control-plane">
            Authority Control Plane
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
