import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { vapps, statusLabel } from "../vapps/_data";
import { globalVisions, parts } from "@/lib/ema-atlas";

const Q2_QUESTION = "Where does collaboration state live?";
const Q2_ATTRIBUTION = "Q2 from OPEN_QUESTIONS";

const STANCE_COLOR: Record<string, "planned" | "sketched" | "partial"> = {
  "operator-cathedral": "planned",
  "living-workspace": "sketched",
  "mesh-commonwealth": "partial"
};

const Q2_SPIN: Record<string, string> = {
  "operator-cathedral":
    "Collab state lives inside the EMA control plane as append-only, lineage-bound records — no thread, doc, or cursor is real until it has a canonical id and an approved write.",
  "living-workspace":
    "Collab state lives in the shared workspace itself: threads, wiki nodes, and planner cards are the storage, and EMA merely indexes what humans and agents already co-inhabit.",
  "mesh-commonwealth":
    "Collab state lives on whichever peer is currently holding the lease — authority and presence replicate across devices and orgs, and no single host is the home of the truth."
};

const NODE_KINDS: Array<{ kind: string; semantics: string }> = [
  {
    kind: "question",
    semantics:
      "A bounded project-level prompt that earns multiple competing answers; the root of a blueprint subgraph."
  },
  {
    kind: "future",
    semantics:
      "One of exactly three stances proposed against a question — a claim, not a hedge, carrying its own bet and tension."
  },
  {
    kind: "evidence",
    semantics:
      "A pointer to a doc, run, branch, or artifact that raises or lowers the credibility of a future."
  },
  {
    kind: "decision",
    semantics:
      "A dated commitment that promotes one future (or a blend) into the canonical build path."
  },
  {
    kind: "follow-up",
    semantics:
      "A named open thread spawned by a decision — the seed of the next question node."
  }
];

export default function BlueprintPage() {
  const blueprintVApp = vapps.find((v) => v.slug === "blueprint");

  return (
    <SiteShell
      eyebrow="vApp"
      title="Blueprint"
      intro="Karpathy-style knowledge structuring: one question, three competing futures per question. This render is static today — a typed subgraph of the semantic layer that will become real once the collab plane lands and nodes carry identity, lineage, and edges."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Question</p>
          <h2 className="panel__title">{Q2_QUESTION}</h2>
          <p className="panel__lede">
            A single project-level blueprint question. Every future below is a
            concrete answer to this one prompt — not a mood, not a flavor.
          </p>
          <p className="panel__label">{Q2_ATTRIBUTION}</p>
          {blueprintVApp ? (
            <p className="list__copy">
              Surface status: {statusLabel(blueprintVApp.status)} — slice is
              &ldquo;{blueprintVApp.smallestSlice}&rdquo;
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Three futures</p>
          <h2 className="panel__title">Three futures on purpose.</h2>
          <p className="panel__lede">
            The three global stances — operator cathedral, living workspace,
            mesh commonwealth — each answer Q2 differently. The spins below
            map each global stance onto the collab-plane question.
          </p>
        </div>
        <div className="triptych card-grid">
          {globalVisions.map((vision) => {
            const statusKey = STANCE_COLOR[vision.id] ?? "planned";
            return (
              <article className="panel vapp-card" key={vision.id}>
                <div className="vapp-card__head">
                  <p className="list__eyebrow">Future</p>
                  <span
                    className={`vapp-card__status vapp-card__status--${statusKey}`}
                  >
                    {statusLabel(statusKey)}
                  </span>
                </div>
                <h3 className="list__title">{vision.title}</h3>
                <div>
                  <span className="panel__label">Global stance</span>
                  <p className="list__copy">{vision.stance}</p>
                </div>
                <div>
                  <span className="panel__label">Q2 spin — {Q2_QUESTION}</span>
                  <p className="list__copy">{Q2_SPIN[vision.id]}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Node kinds</p>
          <h2 className="panel__title">Five typed blueprint nodes.</h2>
          <p className="panel__lede">
            Today these are <code>.panel</code>s; tomorrow they are typed
            collab-plane nodes with stable ids, edges, and lineage.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{NODE_KINDS.length}</span>
              <span>Node kinds</span>
            </div>
            <div className="stat">
              <span className="stat__value">3</span>
              <span>Futures per question</span>
            </div>
            <div className="stat">
              <span className="stat__value">{parts.length}</span>
              <span>Parts in scope</span>
            </div>
          </div>
        </div>
        <div className="card-grid">
          {NODE_KINDS.map((node) => (
            <article className="panel" key={node.kind}>
              <p className="list__eyebrow">Node</p>
              <h3 className="list__title">{node.kind}</h3>
              <p className="list__copy">{node.semantics}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Where this sits.</h2>
          <p className="panel__lede">
            Blueprint is a typed subgraph of the semantic layer, seeded by
            OPEN_QUESTIONS and rendered through Launchpad.
          </p>
          <div className="route-links">
            <Link className="chip" href="/vapps/blueprint">
              vApp brief
            </Link>
            <Link className="chip" href="/futures-board">
              Futures board
            </Link>
            <Link className="chip" href="/parts/semantic-layer">
              Semantic layer
            </Link>
            <Link className="chip" href="/questions">
              Open questions
            </Link>
            <Link className="chip" href="/launchpad">
              Launchpad
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
