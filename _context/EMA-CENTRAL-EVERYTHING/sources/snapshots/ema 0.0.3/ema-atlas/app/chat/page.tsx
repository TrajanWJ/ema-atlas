import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../vapps/_data";

/**
 * Chat vApp mockup — single-driver (hermes-native) slice.
 *
 * Projection-only: the conversation renders over the control-plane event log.
 * Chat does not own tool results, ExecutionIds, or provider traces — Hermes
 * owns execution, the event_log stores it, Chat just renders it.
 */

const chat = vapps.find((v) => v.slug === "chat");

const conversation = [
  {
    role: "user",
    speaker: "tawj",
    body:
      "Summarize content/briefs/05-fresh-context-project-app-model.md and open the two parts it names.",
  },
  {
    role: "assistant",
    speaker: "hermes-native / anthropic:claude-sonnet-4-6",
    body:
      "Planning two steps: (1) read the brief via fs.read, (2) resolve the named Part slugs. Dispatching tool call now.",
  },
  {
    role: "tool",
    speaker: "tool:fs.read",
    body:
      "driver=hermes-native · ExecutionId=exec_01HW9M2K7Q · event=tool.result · chronicle=evt_04412 · bytes=8_214",
  },
  {
    role: "assistant",
    speaker: "hermes-native / anthropic:claude-sonnet-4-6",
    body:
      "Brief names Harness/Execution Fabric and Authority/Control Plane. Provider token usage for this turn: 1_842 in / 612 out. Render links below.",
  },
  {
    role: "user",
    speaker: "tawj",
    body: "Re-run the same call against openai:gpt-5 and diff the two summaries.",
  },
  {
    role: "assistant",
    speaker: "hermes-native / openai:gpt-5",
    body:
      "Rejected at policy gate: provider=openai not yet enabled for this project tenancy. Incident opened — see chronicle evt_04418.",
  },
];

const chronicle = [
  {
    kind: "dispatch.created",
    id: "evt_04410",
    hint: "Chat renders the turn; Hermes owns the dispatch; event_log stores the row.",
  },
  {
    kind: "execution.started",
    id: "evt_04411",
    hint: "ExecutionId exec_01HW9M2K7Q minted by Hermes; Chat surfaces a spinner keyed off it.",
  },
  {
    kind: "tool.result",
    id: "evt_04412",
    hint: "fs.read returned 8_214 bytes; Chat renders the summary, log stores the payload hash.",
  },
  {
    kind: "execution.completed",
    id: "evt_04413",
    hint: "Turn closes; Chat flips the message state; Hermes records provider token usage.",
  },
  {
    kind: "incident.opened",
    id: "evt_04418",
    hint: "Provider gate denied openai:gpt-5; Chat shows a red row, policy engine owns the decision.",
  },
];

const drivers = [
  { id: "hermes-native", enabled: true, note: "Default. Broker + event log." },
  { id: "claude-cli", enabled: false, note: "Wrapped later; same event shape." },
  { id: "codex-cli", enabled: false, note: "Wrapped later; same event shape." },
];

const providers = [
  { id: "anthropic", enabled: true, note: "claude-sonnet-4-6 · hosted" },
  { id: "openai", enabled: false, note: "gpt-5 · hosted · policy-gated" },
  { id: "local-llamacpp", enabled: false, note: "on-device · no egress" },
];

export default function ChatPage() {
  return (
    <SiteShell
      eyebrow="vApp"
      title="Chat"
      intro={
        chat
          ? `EMA-native interface to local and hosted models. Canonical rule: EMA owns truth, Hermes owns execution, surfaces don't own state. Slice: ${chat.smallestSlice}`
          : "EMA-native interface to local and hosted models. Single-driver (hermes-native) slice projecting over the control-plane event log."
      }
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Smallest provable slice</p>
          <h2 className="panel__title">
            One driver, one tool, one provider, one chronicle.
          </h2>
          <p className="panel__lede">
            The conversation below is a projection. Every turn resolves to an{" "}
            <code>ExecutionId</code> Hermes minted and a row the event_log
            stored. Chat renders; it does not originate.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">1</span>
              <span>Driver enabled (hermes-native)</span>
            </div>
            <div className="stat">
              <span className="stat__value">1</span>
              <span>Provider enabled (anthropic)</span>
            </div>
            <div className="stat">
              <span className="stat__value">{chronicle.length}</span>
              <span>Chronicle rows projected</span>
            </div>
            <div className="stat">
              <span className="stat__value">{chat ? statusLabel(chat.status) : "Planned"}</span>
              <span>Surface status</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="panel__tag">Conversation</p>
        <h2 className="panel__title">Mock turn sequence</h2>
        <p className="panel__lede">
          Six turns against the <code>hermes-native</code> driver. One tool call
          exposes its ExecutionId and chronicle id; one provider-facing turn
          shows what a refusal looks like when the policy engine owns the
          decision.
        </p>
        <div className="card-grid">
          {conversation.map((turn, i) => (
            <article className={`panel vapp-card`} key={i}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{turn.role}</p>
                <span
                  className={`vapp-card__status vapp-card__status--${
                    turn.role === "tool"
                      ? "partial"
                      : turn.role === "assistant"
                      ? "sketched"
                      : "planned"
                  }`}
                >
                  {turn.speaker}
                </span>
              </div>
              <p className="list__copy">{turn.body}</p>
              {turn.role === "tool" ? (
                <div>
                  <span className="panel__label">Projected from</span>
                  <ul className="inline-list">
                    <li>driver: hermes-native</li>
                    <li>ExecutionId: exec_01HW9M2K7Q</li>
                    <li>
                      <Link href="/parts/authority-control-plane">
                        chronicle: evt_04412
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
        <p className="panel__tag">Chronicle pane</p>
        <h2 className="panel__title">Control-plane events the conversation projects over</h2>
        <p className="panel__lede">
          Each row is an event the control plane already emits. The Chat turns
          above are a view of these rows, not a second source of truth.
        </p>
        <div className="card-grid">
          {chronicle.map((e) => (
            <article className="panel vapp-card" key={e.id}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{e.kind}</p>
                <span className="vapp-card__status vapp-card__status--sketched">
                  {e.id}
                </span>
              </div>
              <p className="list__copy">{e.hint}</p>
              <div>
                <span className="panel__label">Ownership</span>
                <ul className="inline-list">
                  <li>Chat renders</li>
                  <li>Hermes owns</li>
                  <li>event_log stores</li>
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Driver &amp; provider selectors</p>
        <h2 className="panel__title">Read-only in the smallest slice</h2>
        <p className="panel__lede">
          Surface selects; Hermes brokers; EMA records. The selectors below are
          mock — only <code>hermes-native</code> + <code>anthropic</code> are
          wired in the first slice.
        </p>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Driver</p>
              <span className="vapp-card__status vapp-card__status--partial">
                hermes-native
              </span>
            </div>
            <p className="list__copy">
              Driver picks the execution substrate. Only one lights up today —
              the others share the same event shape so wrapping claude-cli and
              codex-cli later is additive.
            </p>
            <div>
              <span className="panel__label">Options</span>
              <ul className="inline-list">
                {drivers.map((d) => (
                  <li key={d.id}>
                    {d.id}
                    {d.enabled ? " · enabled" : " · disabled"} — {d.note}
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Provider</p>
              <span className="vapp-card__status vapp-card__status--partial">
                anthropic
              </span>
            </div>
            <p className="list__copy">
              Provider is the model endpoint Hermes brokers against. Tenancy +
              policy decide which ids a project can reach — Chat only displays
              the result.
            </p>
            <div>
              <span className="panel__label">Options</span>
              <ul className="inline-list">
                {providers.map((p) => (
                  <li key={p.id}>
                    {p.id}
                    {p.enabled ? " · enabled" : " · disabled"} — {p.note}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps/chat">
            Chat brief
          </Link>
          <Link className="chip" href="/parts/harness-execution">
            Harness / Execution
          </Link>
          <Link className="chip" href="/parts/authority-control-plane">
            Authority / Control Plane
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
