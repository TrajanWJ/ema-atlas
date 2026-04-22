import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Threads / Server — Discord-migration wedge mockup.
 *
 * Smallest provable slice: a read-only mirror of a single Discord channel
 * rendered in the EMA shell with stable thread ids. Discord is the mirror
 * during this wedge; EMA owns truth. Bridge direction is Q6-open — this
 * page does not pretend otherwise.
 */

type ThreadRow = {
  id: string;
  title: string;
  lastMessage: string;
  replies: number;
  source: "discord:bridged" | "ema:native";
};

const channels = [
  { name: "#coordination", open: true, threadCount: 4 },
  { name: "#harness-drivers", open: false, threadCount: 7 },
  { name: "#wiki-review", open: false, threadCount: 2 },
];

const threads: ThreadRow[] = [
  {
    id: "thr_01H9Z2KQ3X7VME4TJWD0CRDN",
    title: "Harness vs driver naming — pick one for the brief",
    lastMessage: "2m ago",
    replies: 14,
    source: "discord:bridged",
  },
  {
    id: "thr_01H9Z2M4N1P8K5RBYA6TQV0E",
    title: "Who owns the launchpad dock copy this week?",
    lastMessage: "18m ago",
    replies: 6,
    source: "discord:bridged",
  },
  {
    id: "thr_01H9Z2NAYV9C0GSX3HUFMB4K",
    title: "EMA-native thread — atlas swarm standup notes",
    lastMessage: "1h ago",
    replies: 3,
    source: "ema:native",
  },
  {
    id: "thr_01H9Z2PQ8R2D6W1JZLK5EN7H",
    title: "Parity check: mention mapping for bridged replies",
    lastMessage: "3h ago",
    replies: 9,
    source: "discord:bridged",
  },
];

export default function ThreadsPage() {
  return (
    <SiteShell
      eyebrow="vApp"
      title="Threads / Server"
      intro="The EMA-native replacement for Discord channels-and-threads, shown here as a Discord-mirror wedge: one server, one channel, stable thread ids, read-only. Bridge direction is Q6-open — this page does not smooth that into 'we'll do both.'"
    >
      <section className="panel">
        <p className="panel__tag">Channel — mock thread list</p>
        <h2 className="panel__title">EMA · Dev / #coordination</h2>
        <p className="panel__lede">
          Single server, three channels, current one open. Thread rows carry a
          stable EMA id regardless of origin; the badge tells you whether the
          row was mirrored from Discord or authored natively in EMA.
        </p>

        <div>
          <span className="panel__label">Channels</span>
          <ul className="inline-list">
            {channels.map((c) => (
              <li key={c.name}>
                {c.open ? <strong>{c.name}</strong> : c.name} · {c.threadCount}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-grid">
          {threads.map((t) => (
            <article className="panel vapp-card" key={t.id}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">Thread</p>
                <span
                  className={`vapp-card__status vapp-card__status--${
                    t.source === "ema:native" ? "ready" : "planned"
                  }`}
                >
                  {t.source}
                </span>
              </div>
              <h3 className="list__title">{t.title}</h3>
              <p className="list__copy">
                <code>{t.id}</code>
              </p>
              <div>
                <span className="panel__label">Activity</span>
                <p className="list__copy">
                  Last message {t.lastMessage} · {t.replies} replies
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Bridge status</p>
        <h2 className="panel__title">Direction: read-only (Discord → EMA)</h2>
        <p className="panel__lede">
          The current wedge is one-way: Discord messages flow into EMA as
          mirrored threads with stable ids. Whether edits, replies, or
          moderation ever flow back the other way is <strong>Q6-open</strong>
          {" "}— we have not decided, and this page will not pretend we have.
        </p>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">Poll</p>
            <h3 className="list__title">Last mirror poll</h3>
            <p className="list__copy">12s ago</p>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Coverage</p>
            <h3 className="list__title">Bridged channels</h3>
            <p className="list__copy">3 / 18</p>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Open question</p>
            <h3 className="list__title">Q6 — bridge direction</h3>
            <p className="list__copy">
              Unresolved. Read-only today is a wedge, not a commitment to
              stay one-way.
            </p>
          </article>
        </div>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">1</span>
            <span>Direction today</span>
          </div>
          <div className="stat">
            <span className="stat__value">3</span>
            <span>Channels bridged</span>
          </div>
          <div className="stat">
            <span className="stat__value">Q6</span>
            <span>Bidirectional: open</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Discord parity notes</p>
        <h2 className="panel__title">What the wedge keeps legible — and what it does not yet own</h2>
        <ul className="inline-list">
          <li>
            Stable EMA thread ids on every row, whether the thread originated
            in Discord or EMA — so downstream links never break if the bridge
            flips direction.
          </li>
          <li>
            Attribution preserved: each mirrored message carries its Discord
            author and timestamp; EMA-native threads are labeled as such.
          </li>
          <li>
            Mention mapping: <code>@discord-user</code> resolves to the EMA
            identity where known, falls back to the raw handle otherwise.
          </li>
          <li>
            Explicitly <em>not</em> owned yet: edits written back to Discord,
            moderation actions, invite flows, voice/stage channels. Those sit
            behind Q6.
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps/threads-server">
            Threads / Server brief
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/parts/identity-project-space">
            Identity / Project Space
          </Link>
          <Link className="chip" href="/launchpad">
            Launchpad
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
