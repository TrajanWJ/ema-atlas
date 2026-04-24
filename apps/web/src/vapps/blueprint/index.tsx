import { useState } from "react";
import {
  MOCK_PROJECTION_LABEL,
  blueprintProjection,
} from "../../app/mock-projections";
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
            Project sections and attachment targets for the operational shell.
          </p>
        </div>
        {isMock && (
          <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
        )}
      </header>
      {documents.map((doc) => (
        <article key={doc.id} className="ema-bp-doc">
          <h2>{doc.title}</h2>
          <SectionTree
            sections={doc.sections}
            onAttach={(sectionId) => setAttachTarget({ sectionId })}
          />
        </article>
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

function SectionTree({
  sections,
  onAttach,
}: {
  sections: BlueprintSection[];
  onAttach: (id: string) => void;
}) {
  return (
    <ul className="ema-bp-section-tree">
      {sections.map((s) => (
        <li key={s.id}>
          <span className="ema-bp-section__title">{s.title}</span>
          <button
            className="ema-bp-section__attach"
            onClick={() => onAttach(s.id)}
          >
            Attach…
          </button>
          {s.children && s.children.length > 0 && (
            <SectionTree sections={s.children} onAttach={onAttach} />
          )}
        </li>
      ))}
    </ul>
  );
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
};
