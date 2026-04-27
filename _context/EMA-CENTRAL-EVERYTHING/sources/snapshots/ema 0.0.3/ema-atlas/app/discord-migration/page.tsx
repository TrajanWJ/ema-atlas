import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /discord-migration — staged sequence for moving coordination off Discord
 * and into EMA Threads. The wedge is /threads; the Q6 decision page is
 * /threads/bridge. This route is the longer arc: seven stages by which
 * Discord starts as source and ends as mirror-or-retired. Q6 is not
 * assumed here — it is resolved at a specific stage.
 */

export default function DiscordMigrationPage() {
  return (
    <SiteShell
      eyebrow="Migration plan"
      title="Discord → EMA Threads"
      intro="Coordination currently lives on Discord. The goal is to move it into EMA Threads so EMA owns truth and Discord becomes an advisory mirror or is retired. Q6 — the bridge-direction question — is a mid-migration decision here, not a precondition and not something the migration silently closes on its own."
    >
      <section className="panel">
        <p className="panel__tag">Goals and non-goals</p>
        <h2 className="panel__title">What this migration is trying to do, and what it is not</h2>
        <p className="panel__lede">
          Two columns. The left is what we are paying to move; the right
          is what we are refusing to chase. Parity with Discord is not on
          the left column and will not be smuggled in later.
        </p>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Goals</p>
              <span className="vapp-card__status vapp-card__status--ready">in scope</span>
            </div>
            <ul className="inline-list">
              <li>
                <strong>Stable ids</strong> — every thread and message
                carries an EMA id that outlives the bridge.
              </li>
              <li>
                <strong>Attribution</strong> — origin author and timestamp
                survive the move, never laundered by EMA.
              </li>
              <li>
                <strong>Continuity of coordination</strong> — live channels
                keep working while they migrate; no dark-hour cutovers.
              </li>
              <li>
                <strong>Typed threads</strong> — threads in EMA have a kind
                (decision, incident, review, chat) that Discord never had.
              </li>
            </ul>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Non-goals</p>
              <span className="vapp-card__status vapp-card__status--planned">explicitly refused</span>
            </div>
            <ul className="inline-list">
              <li>
                <strong>Discord feature parity</strong> — voice, stickers,
                bots, stage channels, custom emoji. Not chasing any of it.
              </li>
              <li>
                <strong>Replacing Discord as a social club</strong> — casual
                off-topic rooms are not the wedge and probably never move.
              </li>
              <li>
                <strong>Real-time typing parity</strong> — typing
                indicators, presence pips, and sub-second delivery are not
                a shipping requirement for coordination.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Stages (7)</p>
        <h2 className="panel__title">The sequence, with entry and exit criteria</h2>
        <p className="panel__lede">
          Seven stages, strictly ordered. Each stage names what lets you
          enter it, what lets you leave it, which open question it
          touches, and what breaks if you skip it. Skipping is the main
          failure mode.
        </p>
        <ol className="inline-list">
          <li>
            <strong>Stage 1 — Read-only mirror (current wedge).</strong>
            <br />
            <em>Entry:</em> one Discord channel picked; EMA shell exists.
            <br />
            <em>Exit:</em> messages from that channel visible in EMA with
            origin attribution intact.
            <br />
            <em>Touches:</em> nothing canonical yet; sets up Q6 pressure.
            <br />
            <em>Skipped =</em> you are writing a second coordination surface
            with no baseline of what is being said on the first.
          </li>
          <li>
            <strong>Stage 2 — Stable id mapping (thread + message id).</strong>
            <br />
            <em>Entry:</em> mirror is running for at least one channel.
            <br />
            <em>Exit:</em> every mirrored thread and message has a stable
            EMA id that survives a bridge restart or server re-point.
            <br />
            <em>Touches:</em> Q6 (ids are the substrate it decides over).
            <br />
            <em>Skipped =</em> every later stage has to retroactively
            invent identity; cutover becomes a re-import.
          </li>
          <li>
            <strong>Stage 3 — EMA-native threads alongside Discord threads.</strong>
            <br />
            <em>Entry:</em> stable ids from Stage 2.
            <br />
            <em>Exit:</em> new coordination can start in EMA directly,
            typed, and still appear as a mirrored thread on Discord.
            <br />
            <em>Touches:</em> Q2 (collab plane), Q6 (write-side pressure
            now visible).
            <br />
            <em>Skipped =</em> EMA is forever a read replica; no one ever
            starts a thread in the system that is supposed to own truth.
          </li>
          <li>
            <strong>Stage 4 — Write-path chosen (Q6 decides: direction).</strong>
            <br />
            <em>Entry:</em> native threads are being created in EMA.
            <br />
            <em>Exit:</em> Q6 closed — one of read-only, Discord-authority,
            or EMA-authority-with-Discord-mirror is committed.
            <br />
            <em>Touches:</em> Q6 (this is where it closes), Q10
            (permissions follow the direction).
            <br />
            <em>Skipped =</em> you drift into "both ways, sometimes,"
            which is the ambiguity bug Q6 exists to prevent.
          </li>
          <li>
            <strong>Stage 5 — Cutover per channel (one at a time).</strong>
            <br />
            <em>Entry:</em> Stage 4 direction committed.
            <br />
            <em>Exit:</em> one live channel has its authority on the EMA
            side, with its participants notified.
            <br />
            <em>Touches:</em> Q1 (identity has to hold before cutover),
            Q10 (mod actions must route to the new canonical side).
            <br />
            <em>Skipped =</em> big-bang flip with in-flight threads, split
            attribution, and users writing into the losing side.
          </li>
          <li>
            <strong>Stage 6 — Discord becomes advisory mirror.</strong>
            <br />
            <em>Entry:</em> majority of active channels through Stage 5.
            <br />
            <em>Exit:</em> Discord no longer originates canonical
            coordination state; it reflects EMA.
            <br />
            <em>Touches:</em> Q10 (mod-action mapping is now one-way),
            workspace attribution model.
            <br />
            <em>Skipped =</em> two canonical surfaces indefinitely; every
            incident review has to reconcile both.
          </li>
          <li>
            <strong>Stage 7 — Retire Discord when no active dependencies remain.</strong>
            <br />
            <em>Entry:</em> no channel still originates coordination on
            Discord.
            <br />
            <em>Exit:</em> bridge is turned off; retention archive is
            sealed with stable ids pointing into EMA.
            <br />
            <em>Touches:</em> retention policy, Q1 (shadow identities are
            frozen, not deleted).
            <br />
            <em>Skipped =</em> Discord lingers as a zombie surface and
            people quietly start coordinating there again.
          </li>
        </ol>
      </section>

      <section className="panel">
        <p className="panel__tag">Mock migration dashboard</p>
        <h2 className="panel__title">Per-channel status (illustrative)</h2>
        <p className="panel__lede">
          Three channels, three stages, three different bridge sources.
          The badge is honest: it says where canonical state for that
          channel currently lives.
        </p>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">#coordination</p>
              <span className="vapp-card__status vapp-card__status--ready">stage 3 — native alongside</span>
            </div>
            <h3 className="list__title">EMA-native threads are running next to Discord threads</h3>
            <p className="list__copy">
              Active coordination can start in either surface. Ids are
              stable on both sides. Direction is not yet chosen — Stage 4
              pressure is visible here first.
            </p>
            <p className="list__copy">
              <strong>Bridge source:</strong> <span className="chip">split</span>
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">#harness-drivers</p>
              <span className="vapp-card__status vapp-card__status--planned">stage 2 — id mapping</span>
            </div>
            <h3 className="list__title">Stable ids landing; no native EMA threads yet</h3>
            <p className="list__copy">
              Threads and messages now carry EMA ids. Discord is still
              where everything originates. Watch for duplicate-id races
              during burst traffic.
            </p>
            <p className="list__copy">
              <strong>Bridge source:</strong> <span className="chip">discord:bridged</span>
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">#wiki-review</p>
              <span className="vapp-card__status vapp-card__status--planned">stage 1 — read-only mirror</span>
            </div>
            <h3 className="list__title">Mirror only; no id layer, no native thread</h3>
            <p className="list__copy">
              Lowest-stakes channel, useful as a rehearsal for the id
              layer. EMA is a lens; Discord is the home. No write-back is
              even wired.
            </p>
            <p className="list__copy">
              <strong>Bridge source:</strong> <span className="chip">ema:native</span>
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Per-stage risk</p>
        <h2 className="panel__title">Where this actually breaks</h2>
        <ul className="inline-list">
          <li>
            <strong>Stage 2 — duplicate thread ids during races.</strong>
            Two pollers, or a poller plus a retry, mint two EMA ids for
            the same Discord thread. Downstream references silently fork.
          </li>
          <li>
            <strong>Stage 4 — attribution ambiguity.</strong> The moment
            write-path direction is chosen, existing messages have an
            origin side and new messages may have another. Mis-attributing
            who said what is the sharp-edge failure.
          </li>
          <li>
            <strong>Stage 5 — messages written to both sides.</strong>
            During per-channel cutover, a user with both surfaces open
            posts twice. Dedupe has to be explicit, not hopeful.
          </li>
          <li>
            <strong>Stage 7 — retention-policy gap.</strong> When Discord
            is retired, whose retention rules govern the sealed archive?
            If this is unanswered the archive is either over-kept or
            quietly truncated.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Decisions required along the way</p>
        <h2 className="panel__title">Four questions that must close on schedule</h2>
        <p className="panel__lede">
          These are not discoveries — they are scheduled closures. Each
          chip names the question and the stage boundary it blocks.
        </p>
        <div className="route-links">
          <Link className="chip" href="/questions">
            Q6 at stage 4 — bridge direction
          </Link>
          <Link className="chip" href="/questions">
            Q1 before stage 5 — identity resolution
          </Link>
          <Link className="chip" href="/questions">
            Q10 — mod-action mapping across surfaces
          </Link>
          <Link className="chip" href="/questions">
            Q2 — if thread cursor state lands in collab plane
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">What this migration is NOT</p>
        <h2 className="panel__title">Three things we are refusing to let this become</h2>
        <ul className="inline-list">
          <li>
            <strong>Not a rewrite-and-pray.</strong> No dark weekend where
            coordination goes silent and comes back somewhere else. Per
            channel, in stages, with the old surface live.
          </li>
          <li>
            <strong>Not a "we'll build parity later" exercise.</strong>
            Non-goals are load-bearing. Voice, stickers, presence pips,
            and bot ecosystems are not deferred work — they are refused.
          </li>
          <li>
            <strong>Not a reason to delay Q6.</strong> The existence of a
            staged plan does not push Q6 further out. Q6 closes at Stage
            4, on purpose, in the open.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/threads">
            Threads wedge
          </Link>
          <Link className="chip" href="/threads/bridge">
            Q6 — bridge direction
          </Link>
          <Link className="chip" href="/open-questions-map">
            Open Questions map
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
