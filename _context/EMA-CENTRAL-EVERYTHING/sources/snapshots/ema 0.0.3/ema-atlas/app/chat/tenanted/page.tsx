import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Chat variant — Tenanted.
 *
 * The same Chat surface, with tenancy made explicit. Every message is scoped
 * by the 5-tuple (org, project, space, user, agent). Attribution is Q1-open;
 * permission mapping is Q10-open. Chat is still a projection — EMA owns the
 * event_log, Hermes owns execution, this surface just renders what the
 * current tenant is allowed to see.
 */

const tenancy = {
  org: "acme-labs",
  project: "ema-0.0.3",
  space: "core",
  user: "tawj",
  agent: "claude-a1",
};

const turns = [
  {
    role: "user",
    speaker: "tawj @ acme-labs/ema-0.0.3/core",
    body:
      "Agent claude-a1: summarize the open tenancy questions before we rescope.",
    tag: "in-space",
  },
  {
    role: "assistant",
    speaker: "claude-a1 · hermes-native / anthropic:claude-sonnet-4-6",
    body:
      "Q1 (agent identity as a first-class principal) is still open — this reply is attributed to agent:claude-a1 by convention, not by signed identity.",
    tag: "in-space",
  },
  {
    role: "tool",
    speaker: "tool:fs.read · routed by hermes-native",
    body:
      "driver=hermes-native · ExecutionId=ex_01H9TQ2M7K · chronicle=evt_08821 · scope=acme-labs/ema-0.0.3/core · bytes=4_102",
    tag: "in-space",
  },
  {
    role: "assistant",
    speaker: "agent:rx-7 · space:research",
    body:
      "[foreign-space: dimmed preview] Cross-space excerpt from acme-labs/ema-0.0.3/research — surfaced only because tawj has read-through on research. Not projected as a turn in core.",
    tag: "foreign-space",
  },
];

const switcherTenants = [
  {
    id: "acme-labs / ema-0.0.3 / core",
    status: "active",
    note:
      "Current scope. Agent claude-a1 bound here. event_log projection filtered to org=acme-labs, project=ema-0.0.3, space=core.",
  },
  {
    id: "acme-labs / ema-0.0.3 / research",
    status: "read-through",
    note:
      "Sibling space under the same project. Messages appear dimmed as foreign-space previews unless the user switches into it.",
  },
  {
    id: "personal / scratch / default",
    status: "available",
    note:
      "Personal org. Distinct agent roster, distinct provider policy, distinct event_log projection. Switching rescopes everything.",
  },
];

const authorityNotes = [
  "Attribution — every message carries (org, project, space, user, agent). Whether `agent` is a signed first-class principal or a display string is Q1-open.",
  "Permission — mapping tenant roles to runtime capabilities and tool access is Q10-open; today the surface defers to whatever Hermes enforces.",
  "Broker — driver and provider selection is Hermes's job. Chat never calls a provider directly; it shows what the broker returned for this tenant.",
  "Source of truth — the event_log, scoped by tenant, is canonical. This pane is a projection. Switching tenants re-projects; it does not rewrite history.",
];

export default function TenantedChatPage() {
  return (
    <SiteShell
      eyebrow="Chat variant"
      title="Tenanted Chat"
      intro="Chat scoped across four tenancy axes at once — identity (user), project, space, agent — with org as the outer boundary. The same surface, re-projected per tenant. Q1 (agent identity as a first-class principal) remains open; this page names it rather than papering over it."
    >
      <section className="panel">
        <p className="panel__tag">Tenancy strip</p>
        <h2 className="panel__title">The 5-tuple stamped on every message</h2>
        <p className="panel__lede">
          Every turn below carries this header. Change any one axis and the
          projection changes — the underlying event_log does not.
        </p>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">{tenancy.org}</span>
            <span>org</span>
          </div>
          <div className="stat">
            <span className="stat__value">{tenancy.project}</span>
            <span>project</span>
          </div>
          <div className="stat">
            <span className="stat__value">{tenancy.space}</span>
            <span>space</span>
          </div>
          <div className="stat">
            <span className="stat__value">{tenancy.user}</span>
            <span>user</span>
          </div>
          <div className="stat">
            <span className="stat__value">{tenancy.agent}</span>
            <span>agent</span>
          </div>
        </div>
        <p className="list__copy">
          Every message carries this 5-tuple. Attribution — whether{" "}
          <code>agent:claude-a1</code> is a signed principal or a convention —
          is Q1-open.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Conversation</p>
        <h2 className="panel__title">Mock turns scoped to this tenant</h2>
        <p className="panel__lede">
          Four turns under acme-labs/ema-0.0.3/core. One is a cross-space
          preview from <code>space:research</code> and is rendered dimmed. One
          is a tool call routed through <code>hermes-native</code> with a real
          ExecutionId and chronicle pointer.
        </p>
        <div className="card-grid">
          {turns.map((t, i) => (
            <article className="panel vapp-card" key={i}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{t.role}</p>
                <span
                  className={`vapp-card__status vapp-card__status--${
                    t.tag === "foreign-space"
                      ? "planned"
                      : t.role === "tool"
                      ? "partial"
                      : "sketched"
                  }`}
                >
                  {t.speaker}
                </span>
              </div>
              <p className="list__copy">{t.body}</p>
              <div>
                <span className="panel__label">Tenancy</span>
                <ul className="inline-list">
                  <li>org: {tenancy.org}</li>
                  <li>project: {tenancy.project}</li>
                  <li>
                    space:{" "}
                    {t.tag === "foreign-space" ? "research (foreign)" : tenancy.space}
                  </li>
                  <li>user: {tenancy.user}</li>
                  <li>
                    agent:{" "}
                    {t.tag === "foreign-space" ? "rx-7" : tenancy.agent}
                  </li>
                </ul>
              </div>
              {t.role === "tool" ? (
                <div>
                  <span className="panel__label">Routed via</span>
                  <ul className="inline-list">
                    <li>driver: hermes-native</li>
                    <li>ExecutionId: ex_01H9TQ2M7K</li>
                    <li>
                      <Link href="/parts/authority-control-plane">
                        chronicle: evt_08821
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Tenant switcher (read-only)</p>
        <h2 className="panel__title">Three scopes the same surface can re-project into</h2>
        <p className="panel__lede">
          Surface switches tenant; Hermes rescopes the runtime (agents,
          providers, tool permissions); EMA re-projects the event_log. The
          conversation above is whatever falls out of that re-projection.
        </p>
        <div className="card-grid">
          {switcherTenants.map((s) => (
            <article className="panel vapp-card" key={s.id}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">tenant</p>
                <span
                  className={`vapp-card__status vapp-card__status--${
                    s.status === "active"
                      ? "partial"
                      : s.status === "read-through"
                      ? "sketched"
                      : "planned"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="list__copy">
                <strong>{s.id}</strong>
              </p>
              <p className="list__copy">{s.note}</p>
            </article>
          ))}
        </div>
        <p className="list__copy">
          Surface switches tenant; Hermes rescopes runtime; EMA re-projects
          event_log.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Authority &amp; routing notes</p>
        <h2 className="panel__title">What this pane is not allowed to own</h2>
        <ul className="inline-list">
          {authorityNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/chat">
            Chat
          </Link>
          <Link className="chip" href="/vapps/chat">
            Chat brief
          </Link>
          <Link className="chip" href="/parts/identity-project-space">
            Identity / Project / Space
          </Link>
          <Link className="chip" href="/parts/authority-control-plane">
            Authority / Control Plane
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
