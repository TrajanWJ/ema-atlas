import { useState } from "react";
import { blueprintProjection } from "../../app/mock-projections";
import { useProjection } from "../../lib/ipc";
import { AttachDialog } from "../git-ema/attach-to-object";

/**
 * Blueprint vApp page (wave 1 stub).
 *
 * Renders the current project's section tree from the `blueprint.sections`
 * projection. Each section has an "Attach…" button that opens git-ema's
 * shared attach dialog targeting that section.
 *
 * No prose editing. No Yjs. That's a later wave.
 */
export function BlueprintPage() {
  const sections = useProjection("blueprint.sections");
  const isMock = sections == null;
  const documents: BlueprintDoc[] =
    sections?.documents ?? blueprintProjection.documents;
  const sectionCount = documents.reduce(
    (total, doc) => total + countSections(doc.sections),
    0,
  );
  const rootCount = documents.reduce(
    (total, doc) => total + doc.sections.length,
    0,
  );

  const [attachTarget, setAttachTarget] = useState<
    { sectionId: string } | null
  >(null);

  if (documents.length === 0) {
    return (
      <section className="ema-vapp ema-vapp--blueprint">
        <h1>Blueprint</h1>
        <p>No documents in this project yet.</p>
      </section>
    );
  }

  return (
    <section className="ema-vapp ema-vapp--blueprint">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">project map</p>
          <h1>Blueprint</h1>
          <p className="ema-vapp__tagline">
            The living map of intent, proposals, plans, specs, execution, and
            canon for the operational shell.
          </p>
        </div>
        {isMock && <span className="ema-pill ema-pill--hot">staged</span>}
      </header>

      <section className="ema-bp-command-strip" aria-label="Blueprint status">
        <span>
          <strong>{documents.length}</strong>
          <small>document</small>
        </span>
        <span>
          <strong>{rootCount}</strong>
          <small>root sections</small>
        </span>
        <span>
          <strong>{sectionCount}</strong>
          <small>attach targets</small>
        </span>
        <span>
          <strong>canon</strong>
          <small>daemon gated</small>
        </span>
      </section>

      {documents.map((doc) => (
        <section key={doc.id} className="ema-bp-workbench" aria-label={doc.title}>
          <aside className="ema-bp-spine" aria-label="Blueprint pipeline">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.label} data-state={step.state}>
                <span>{step.step}</span>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </div>
            ))}
          </aside>

          <article className="ema-bp-doc">
            <div className="ema-bp-doc__heading">
              <div>
                <p className="ema-kicker">source document</p>
                <h2>{doc.title}</h2>
              </div>
              <span className="ema-pill">{doc.sections.length} pillars</span>
            </div>
            <SectionTree
              sections={doc.sections}
              onAttach={(sectionId) => setAttachTarget({ sectionId })}
            />
          </article>
        </section>
      ))}

      {attachTarget && (
        <AttachDialog
          object={{
            object_kind: "blueprint_section",
            object_id: attachTarget.sectionId,
          }}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </section>
  );
}

const PIPELINE_STEPS = [
  { step: "01", label: "intent", state: "live", detail: "capture" },
  { step: "02", label: "proposal", state: "staged", detail: "shape" },
  { step: "03", label: "plan", state: "staged", detail: "sequence" },
  { step: "04", label: "spec", state: "active", detail: "blueprint" },
  { step: "05", label: "execution", state: "queued", detail: "agents" },
  { step: "06", label: "canon", state: "gated", detail: "daemon" },
];

function countSections(sections: BlueprintSection[]): number {
  return sections.reduce(
    (total, section) => total + 1 + countSections(section.children ?? []),
    0,
  );
}

function SectionTree({
  sections,
  onAttach,
  depth = 0,
}: {
  sections: BlueprintSection[];
  onAttach: (id: string) => void;
  depth?: number;
}) {
  return (
    <ul className="ema-bp-section-tree">
      {sections.map((s, index) => {
        const state = s.state ?? "draft";
        return (
          <li key={s.id} data-depth={depth}>
            <span className="ema-bp-section__title">
              <em>{String(index + 1).padStart(2, "0")}</em>
              {s.title}
            </span>
            <span className="ema-pill" data-state={state}>
              {state}
            </span>
            <button
              className="ema-bp-section__attach"
              onClick={() => onAttach(s.id)}
            >
              Attach…
            </button>
            <p className="ema-bp-section__prose">
              {s.prose ?? sectionBrief(s.title)}
            </p>
            {s.children && s.children.length > 0 && (
              <SectionTree
                sections={s.children}
                onAttach={onAttach}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function sectionBrief(title: string): string {
  const briefs: Record<string, string> = {
    "Executive Management Assistant":
      "The north-star surface: HQ directs the day, Blueprint carries the shape of the system, and every local affordance names its promotion path.",
    "HQ pulse and staged controls":
      "A command-room readout for org, space, project, lane health, and gated actions that need daemon-owned writers before canon changes.",
    "See Agent Work lane visibility":
      "Agent work becomes inspectable through missions, actors, lanes, handoffs, logs, and vCalendar time instead of disappearing into terminal scrollback.",
    "Runtime source and git-ema evidence":
      "Source files, docs, connector state, and attachments become evidence objects that can be pinned directly to Blueprint sections.",
    "Org / space / project spine":
      "Every surface keeps the operator inside a sovereign org, selected workspace, and exact project so context never floats loose.",
    "Event trail projection":
      "The local shell exposes the sequence of projections, commands, and review gates before any action is promoted to durable canon.",
    "Doctrine and staged surfaces":
      "Doctrine nodes, future wiki cards, and threads orbit Blueprint as references, not substitutes for source-of-truth daemon events.",
    "Wiki / Doctrine foundation":
      "Long-lived notes and doctrine references can attach to sections while remaining visibly separate from canon until reviewed.",
    "Chat / Threads foundation":
      "Coordination threads are positioned as project evidence: decisions, questions, and handoffs that cite Blueprint targets.",
  };

  return briefs[title] ??
    "Blueprint holds this section as a navigable target with reviewable attachments and an explicit path from proposal into canon.";
}

type BlueprintDoc = {
  id: string;
  title: string;
  sections: BlueprintSection[];
};

type BlueprintSection = {
  id: string;
  title: string;
  children?: BlueprintSection[];
  state?: "draft" | "projection" | "attached";
  prose?: string;
};
