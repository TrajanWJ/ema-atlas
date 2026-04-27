import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Hermes contract — the complementary deep dive to /driver-matrix. Names the
 * two-way seam between EMA (control plane, truth) and Hermes (harness,
 * execution): what each side gives, what each side must not hold, which event
 * kinds cross the seam, and the three candidate shapes for the wire itself.
 * Q5 (driver contract) and Q10 (permission scope) both stay open.
 */

const emaGives: { k: string; gives: string; notGiven: string }[] = [
  {
    k: "DispatchId",
    gives:
      "a freshly minted DispatchId that names one run and travels with every event Hermes emits.",
    notGiven:
      "does NOT hand Hermes write access to event_log — only EMA appends.",
  },
  {
    k: "permission scope",
    gives:
      "a scoped grant attached to the DispatchId — what this run may read, write, or call (Q10-open).",
    notGiven:
      "does NOT give Hermes the authority to broaden or rescope the grant mid-run.",
  },
  {
    k: "workspace read capability",
    gives:
      "a read handle to the workspace snapshot the dispatch is bound to, resolved at dispatch time.",
    notGiven:
      "does NOT give Hermes ownership of workspace lineage — lineage stays with EMA.",
  },
  {
    k: "provider credentials",
    gives:
      "provider creds scoped to the DispatchId, valid for the duration of the run, revocable by EMA.",
    notGiven:
      "does NOT give Hermes an identity claim — Hermes acts on behalf of the dispatch, not as the user.",
  },
];

const hermesGives: { k: string; gives: string; notHeld: string }[] = [
  {
    k: "normalized event stream",
    gives:
      "a uniform stream of events shaped the same regardless of which driver produced them.",
    notHeld:
      "does NOT hold canonicality — the stream is evidence, EMA decides what it means.",
  },
  {
    k: "ExecutionIds",
    gives:
      "one ExecutionId per tool invocation, stable enough to reference from later events.",
    notHeld:
      "does NOT hold cross-execution state — each ExecutionId is scoped to its dispatch.",
  },
  {
    k: "tool-call outputs",
    gives:
      "the raw outputs of each tool call, surfaced as tool.result events against the ExecutionId.",
    notHeld:
      "does NOT hold the decision about whether the output is accepted — that is EMA's.",
  },
  {
    k: "failure signals",
    gives:
      "explicit stall and failure events — execution.stalled, execution.finished with error — so EMA can act.",
    notHeld:
      "does NOT hold identity attribution for the failure — who owns it is an EMA-side question.",
  },
];

const forbidden: string[] = [
  "Hermes storing long-lived workspace state — workspaces belong to EMA, Hermes sees a snapshot per dispatch.",
  "EMA reaching into live runtime state — EMA observes the event stream, it does not read Hermes memory.",
  "a driver inventing its own DispatchId or ExecutionId scheme — ids come from the control plane contract.",
  "a surface bypassing Hermes to call a provider directly — every provider call rides a DispatchId.",
];

const crossings: { direction: string; kind: string; note: string }[] = [
  {
    direction: "outgoing",
    kind: "dispatch.created",
    note: "EMA → Hermes: a new DispatchId with scope and workspace handle attached.",
  },
  {
    direction: "outgoing",
    kind: "dispatch.claimed",
    note: "EMA → Hermes: a driver has accepted the dispatch and taken ownership of execution.",
  },
  {
    direction: "incoming",
    kind: "execution.started",
    note: "Hermes → EMA: the driver has begun the run, ExecutionId minted.",
  },
  {
    direction: "incoming",
    kind: "tool.called",
    note: "Hermes → EMA: a tool invocation was issued, arguments recorded.",
  },
  {
    direction: "incoming",
    kind: "tool.result",
    note: "Hermes → EMA: the tool returned, output carried on the ExecutionId.",
  },
  {
    direction: "incoming",
    kind: "execution.finished",
    note: "Hermes → EMA: the run is terminal — success or error, with reason.",
  },
  {
    direction: "incoming",
    kind: "execution.stalled",
    note: "Hermes → EMA: the run is not progressing — EMA decides whether to abort or wait.",
  },
];

const candidates: {
  shape: string;
  cost: string;
  tradeoff: string;
  forces: string;
}[] = [
  {
    shape: "opaque JSON stream",
    cost: "cheapest to stand up — no schema compiler, no codegen, just shaped objects.",
    tradeoff:
      "no compile-time guarantees; drift between drivers is caught only at runtime, if at all.",
    forces:
      "chosen if we need many drivers fast and are willing to police shape with tests instead of types.",
  },
  {
    shape: "typed IDL (protobuf / capnproto / gleam types)",
    cost: "heaviest — schema file, codegen step, versioning discipline for every change.",
    tradeoff:
      "strong cross-language guarantees; every driver and the control plane share one source of truth.",
    forces:
      "chosen if remote peers or non-BEAM drivers land and we need the seam to survive language boundaries.",
  },
  {
    shape: "hybrid IDL-over-JSON",
    cost: "medium — IDL defines the shape, wire stays JSON, validation runs at the seam.",
    tradeoff:
      "keeps tooling light while still anchoring the contract; validation cost sits on every event.",
    forces:
      "chosen if we want a single typed contract but are not ready to adopt a binary wire.",
  },
];

function directionClass(direction: string): string {
  return direction === "outgoing"
    ? "vapp-card__status vapp-card__status--partial"
    : "vapp-card__status vapp-card__status--planned";
}

export default function HermesContractPage() {
  return (
    <SiteShell
      eyebrow="Harness seam"
      title="The Hermes contract"
      intro="EMA and Hermes meet at a typed two-way seam: EMA hands down a DispatchId, a scope, a workspace handle, and provider credentials; Hermes returns a normalized event stream, ExecutionIds, tool outputs, and failure signals. The seam is a contract, not a shared mutable surface — and the exact shape of the wire (Q5, driver contract) stays open."
    >
      <section className="panel">
        <p className="panel__tag">What EMA gives Hermes</p>
        <h2 className="panel__title">Four things handed down the seam</h2>
        <p className="panel__lede">
          EMA hands Hermes what Hermes needs to execute — and nothing more.
          Each bullet names the one thing EMA keeps to itself.
        </p>
        <ul className="inline-list">
          {emaGives.map((g) => (
            <li key={g.k}>
              <span className="list__eyebrow">{g.k}</span>
              <span className="list__copy">{g.gives}</span>
              <span className="panel__label">{g.notGiven}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">What Hermes gives EMA</p>
        <h2 className="panel__title">Four things returned up the seam</h2>
        <p className="panel__lede">
          Hermes returns evidence — not decisions. Each bullet names the one
          thing Hermes must not hold.
        </p>
        <ul className="inline-list">
          {hermesGives.map((g) => (
            <li key={g.k}>
              <span className="list__eyebrow">{g.k}</span>
              <span className="list__copy">{g.gives}</span>
              <span className="panel__label">{g.notHeld}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Forbidden crossings</p>
        <h2 className="panel__title">Four violations of the seam</h2>
        <ul className="inline-list">
          {forbidden.map((f) => (
            <li key={f}>
              <span className="list__copy">{f}</span>
            </li>
          ))}
        </ul>
        <p className="panel__label">
          canonical rule — EMA owns truth, Hermes owns execution, surfaces do
          not own state.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Seam visibility</p>
        <h2 className="panel__title">Event kinds that cross the seam</h2>
        <p className="panel__lede">
          Two kinds go out from EMA to Hermes; five come back. Nothing else
          crosses — the seam does not speak in raw state reads, not in shared
          memory, not in side-channel calls.
        </p>
        <ul className="inline-list">
          {crossings.map((c) => (
            <li key={c.kind}>
              <div className="vapp-card__head">
                <span className="list__eyebrow">{c.kind}</span>
                <span className={directionClass(c.direction)}>
                  {c.direction}
                </span>
              </div>
              <span className="list__copy">{c.note}</span>
            </li>
          ))}
        </ul>
        <p className="panel__label">
          these are the only kinds the seam speaks.
        </p>
      </section>

      <section className="panel">
        <div className="vapp-card__head">
          <p className="panel__tag">Q5 pressure</p>
          <span className="vapp-card__status vapp-card__status--planned">
            Q5 open
          </span>
        </div>
        <h2 className="panel__title">Three candidate contract shapes</h2>
        <p className="panel__lede">
          The seam has a shape question: what is the wire made of? Three
          candidates, laid out by cost, tradeoff, and what would force the
          choice. We do not pick here.
        </p>
        <ul className="inline-list">
          {candidates.map((c) => (
            <li key={c.shape}>
              <span className="list__eyebrow">{c.shape}</span>
              <span className="list__title">cost — {c.cost}</span>
              <span className="list__copy">tradeoff — {c.tradeoff}</span>
              <span className="panel__label">
                what forces choice — {c.forces}
              </span>
            </li>
          ))}
        </ul>
        <p className="panel__label">
          Q5 (driver contract surface) stays open; Q10 (permission-scope
          mapping) stays open.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/driver-matrix">
            Driver matrix
          </Link>
          <Link className="chip" href="/canonical-rule">
            Canonical rule
          </Link>
          <Link className="chip" href="/state-planes">
            State planes
          </Link>
          <Link className="chip" href="/event-kinds">
            Event kinds
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
