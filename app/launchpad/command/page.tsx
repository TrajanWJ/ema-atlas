import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../../vapps/_data";

/**
 * Launchpad — Command-bar variant.
 *
 * Counter-proposal to the Win8 tile-grid /launchpad shell. Same function
 * (entry point into work over the 8 named surfaces from app/vapps/_data.ts),
 * different posture: keyboard-first palette, ⌘K / Spotlight / Raycast feel.
 * Typed verbs — Open, Start, Jump, Resume, Approve — map to control-plane
 * actions, not to a dashboard. Read-only render; surfaces do not own state.
 */

const shortcutBySlug: Record<string, string> = {
  wiki: "W",
  chat: "C",
  "threads-server": "T",
  "agent-virtual-environment": "A",
  blueprint: "B",
  launchpad: "L",
  hq: "H",
  "virtual-desktop": "D",
};

type SuggestedCommand = {
  verb: string;
  target: string;
  shortcut: string;
  href?: string;
};

const suggested: SuggestedCommand[] = [
  { verb: "Open", target: "Wiki", shortcut: "W", href: "/vapps/wiki" },
  {
    verb: "Start",
    target: "Chat in ema-0.0.3/core",
    shortcut: "⌘↵",
    href: "/vapps/chat",
  },
  { verb: "Jump", target: "HQ (Personal)", shortcut: "H", href: "/hq" },
  { verb: "Resume", target: "sess_01H...", shortcut: "R" },
  { verb: "Approve", target: "proposal_44", shortcut: "A" },
];

const verbs = [
  "Open",
  "Start",
  "Jump",
  "Resume",
  "Approve",
  "Switch project",
  "Handoff",
];

export default function CommandLaunchpadPage() {
  return (
    <SiteShell
      eyebrow="Launchpad variant"
      title="Command Launchpad"
      intro="Keyboard-first palette over the same eight named surfaces. Not a dashboard, not AI Spotlight — a typed command bar where starting work is a verb, not a choose-your-tile. Read-only render over the vApp catalog; the shell owns no state."
    >
      <section className="panel">
        <p className="panel__tag">Palette</p>
        <h2 className="panel__title">⌘ K</h2>
        <p className="panel__lede">
          One bar, one caret, typed verbs. The palette is the shell.
        </p>
        <div className="route-links">
          <span className="chip">
            <kbd>⌘ K</kbd>
          </span>
          <span className="chip">Open, jump to, or start…</span>
        </div>
        <p className="panel__label">
          ↑ ↓ to move · ↵ to run · esc to cancel
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Suggested</p>
        <h2 className="panel__title">Top row</h2>
        <p className="panel__lede">
          What the palette offers before you type — five verbs ready to run.
        </p>
        <ul className="inline-list">
          {suggested.map((cmd) => {
            const body = (
              <>
                <span className="list__eyebrow">{cmd.verb}</span>
                <span className="list__title">{cmd.target}</span>
                <span className="list__copy">
                  <kbd>{cmd.shortcut}</kbd>
                </span>
              </>
            );
            return (
              <li key={`${cmd.verb}-${cmd.target}`}>
                {cmd.href ? (
                  <Link className="route-links" href={cmd.href}>
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">All surfaces</p>
        <h2 className="panel__title">Eight rows, one keystroke each</h2>
        <p className="panel__lede">
          The tile grid, linearised. Type the letter, hit ↵, land on the
          brief.
        </p>
        <ul className="inline-list">
          {vapps.map((v) => (
            <li key={v.slug}>
              <Link className="route-links" href={`/vapps/${v.slug}`}>
                <span className="chip">
                  <kbd>{shortcutBySlug[v.slug] ?? "·"}</kbd>
                </span>
                <span className="list__title">{v.name}</span>
                <span className="chip">
                  {v.group === "shell" ? "Shell" : "vApp"}
                </span>
                <span className="chip">{statusLabel(v.status)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Verbs (typed)</p>
        <h2 className="panel__title">The grammar</h2>
        <p className="panel__lede">
          verbs are typed commands, not free text — they map to control-plane
          actions when run.
        </p>
        <div className="card-grid">
          {verbs.map((verb) => (
            <div className="vapp-card" key={verb}>
              <p className="panel__label">Verb</p>
              <h3 className="list__title">{verb}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/launchpad">
            Tile-grid Launchpad
          </Link>
          <Link className="chip" href="/vapps">
            Surface catalog
          </Link>
          <Link className="chip" href="/parts/shells-surfaces">
            Shells / Surfaces brief
          </Link>
          <Link className="chip" href="/hq">
            HQ
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
