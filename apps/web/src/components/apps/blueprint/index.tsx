"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { EMA_SCOPE, MOCK_PROJECTION_LABEL } from "@/src/app/mock-projections";
import { useProjection } from "@/src/lib/ipc";
import "./blueprint.css";

type BlueprintSectionRecord = {
  readonly id?: string;
  readonly section_id?: string;
  readonly document_id?: string;
  readonly parent_section_id?: string | null;
  readonly title?: string;
  readonly position?: number;
  readonly status?: string;
};

type BlueprintDocumentRecord = {
  readonly id?: string;
  readonly document_id?: string;
  readonly title?: string;
  readonly project_id?: string | null;
  readonly status?: string;
  readonly sections?: readonly BlueprintSectionRecord[];
};

type BlueprintProjection = {
  readonly source?: string;
  readonly documents?: readonly BlueprintDocumentRecord[];
  readonly sections?: readonly BlueprintSectionRecord[];
};

type BlueprintTab = {
  readonly id: string;
  readonly label: string;
  readonly record: BlueprintSectionRecord;
};

const FALLBACK_SECTIONS: readonly BlueprintSectionRecord[] = [
  { id: EMA_SCOPE.blueprintRootSectionId, title: "Intent", position: 0, status: "staged" },
  { id: "blueprint_sec:map", title: "Map", position: 1, status: "staged" },
  { id: "blueprint_sec:attachments", title: "Attachments", position: 2, status: "staged" },
  { id: "blueprint_sec:decisions", title: "Decisions", position: 3, status: "staged" },
  { id: "blueprint_sec:canon", title: "Canon", position: 4, status: "staged" },
];

const FALLBACK_PROJECTION: BlueprintProjection = {
  source: MOCK_PROJECTION_LABEL,
  documents: [
    {
      id: EMA_SCOPE.blueprintDocId,
      title: "EMA 0.0.5 Blueprint",
      project_id: EMA_SCOPE.projectId,
      status: "staged",
      sections: FALLBACK_SECTIONS,
    },
  ],
  sections: FALLBACK_SECTIONS,
};

const FADE_DURATION = 0.2;
const FADE_EASE = "var(--place-ease-smooth)";

export function BlueprintPage() {
  const liveProjection = useProjection<BlueprintProjection>("blueprint.sections");
  const projection = liveProjection ?? FALLBACK_PROJECTION;
  const isLive = Boolean(liveProjection);
  const documents = projection.documents ?? [];
  const document = documents[0] ?? FALLBACK_PROJECTION.documents?.[0];
  const sections = useMemo(
    () => normalizeSections(document, projection.sections),
    [document, projection.sections],
  );
  const tabs = useMemo(() => sections.map(sectionToTab), [sections]);
  const [active, setActive] = useState<string>(tabs[0]?.id ?? "intent");

  useEffect(() => {
    if (tabs.length === 0) return;
    const first = tabs[0];
    if (first && !tabs.some((tab) => tab.id === active)) setActive(first.id);
  }, [active, tabs]);

  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];
  const title = document?.title ?? EMA_SCOPE.projectName;
  const source = isLive ? projection.source ?? "daemon_events" : MOCK_PROJECTION_LABEL;

  return (
    <div data-app="blueprint">
      <header className="bp-header">
        <div className="bp-header__meta">
          <p className="bp-header__eyebrow">project blueprint</p>
          <span className="bp-pill" data-state={isLive ? "active" : "staged"}>
            {isLive ? "daemon projection" : MOCK_PROJECTION_LABEL}
          </span>
        </div>
        <h1 className="bp-header__title">{title}</h1>
        <p className="bp-header__intent">
          Structural truth flows from <code>blueprint.sections</code>. Prose collaboration remains the
          BEAM-owned document plane.
        </p>
      </header>

      <div className="bp-body">
        <nav className="bp-spine" aria-label="Blueprint sections">
          {tabs.map((section) => {
            const isActive = section.id === activeTab?.id;
            return (
              <button
                key={section.id}
                type="button"
                className="bp-spine__tab"
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActive(section.id)}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={activeTab?.id ?? "empty"}
            className="bp-section"
            aria-label={activeTab?.label ?? "Blueprint"}
            tabIndex={0}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: FADE_DURATION,
              ease: [0.65, 0.05, 0, 1],
            }}
            style={{ ["--bp-fade-ease" as string]: FADE_EASE }}
          >
            {activeTab ? (
              <BlueprintSection
                tab={activeTab}
                document={document}
                sections={sections}
                isLive={isLive}
              />
            ) : (
              <EmptyBlueprint />
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <footer className="bp-footer">
        {sections.length} section(s) · source: {source} · project: {document?.project_id ?? EMA_SCOPE.projectId}
      </footer>
    </div>
  );
}

function normalizeSections(
  document: BlueprintDocumentRecord | undefined,
  projectionSections: readonly BlueprintSectionRecord[] | undefined,
): readonly BlueprintSectionRecord[] {
  const fromDocument = document?.sections ?? [];
  const docId = document?.id ?? document?.document_id;
  const fromProjection = (projectionSections ?? []).filter((section) => {
    if (!docId) return true;
    return !section.document_id || section.document_id === docId;
  });
  const source = fromDocument.length > 0 ? fromDocument : fromProjection;
  const sorted = [...source].sort((a, b) => {
    const ap = typeof a.position === "number" ? a.position : 0;
    const bp = typeof b.position === "number" ? b.position : 0;
    return ap === bp ? sectionLabel(a).localeCompare(sectionLabel(b)) : ap - bp;
  });
  return sorted.length > 0 ? sorted : FALLBACK_SECTIONS;
}

function sectionToTab(record: BlueprintSectionRecord): BlueprintTab {
  const id = record.id ?? record.section_id ?? sectionLabel(record).toLowerCase();
  return { id, label: sectionLabel(record), record };
}

function sectionLabel(record: BlueprintSectionRecord): string {
  return record.title?.trim() || record.id || record.section_id || "Untitled section";
}

function BlueprintSection({
  tab,
  document,
  sections,
  isLive,
}: {
  readonly tab: BlueprintTab;
  readonly document: BlueprintDocumentRecord | undefined;
  readonly sections: readonly BlueprintSectionRecord[];
  readonly isLive: boolean;
}) {
  const normalized = tab.label.toLowerCase();

  if (normalized.includes("intent")) return <IntentSection tab={tab} document={document} isLive={isLive} />;
  if (normalized.includes("map")) return <MapSection document={document} sections={sections} />;
  if (normalized.includes("attachment")) return <AttachmentsSection />;
  if (normalized.includes("decision")) return <DecisionsSection />;
  if (normalized.includes("canon")) return <CanonSection document={document} sections={sections} />;
  return <StructuralSection tab={tab} document={document} />;
}

function EmptyBlueprint() {
  return (
    <>
      <h2 className="bp-section__title">No Blueprint document</h2>
      <p className="bp-section__lede">
        The daemon returned no structural Blueprint documents for this project.
      </p>
    </>
  );
}

function IntentSection({
  tab,
  document,
  isLive,
}: {
  readonly tab: BlueprintTab;
  readonly document: BlueprintDocumentRecord | undefined;
  readonly isLive: boolean;
}) {
  const body = [
    `${document?.title ?? EMA_SCOPE.projectName} is a daemon-owned project blueprint.`,
    `Current section: ${tab.label}.`,
    `Authority: ${isLive ? "canonical event projection" : "staged local fallback"}.`,
  ].join("\n\n");

  return (
    <>
      <h2 className="bp-section__title">{tab.label}</h2>
      <p className="bp-section__lede">
        One paragraph of project intent, backed by the structural section selected from daemon state.
      </p>
      <textarea className="bp-intent__field" readOnly value={body} spellCheck={false} />
    </>
  );
}

function MapSection({
  document,
  sections,
}: {
  readonly document: BlueprintDocumentRecord | undefined;
  readonly sections: readonly BlueprintSectionRecord[];
}) {
  return (
    <>
      <h2 className="bp-section__title">Map</h2>
      <p className="bp-section__lede">
        The structural tree replayed from <code>blueprint.*</code> events.
      </p>
      <div className="bp-map" role="list">
        <MapRow name={EMA_SCOPE.orgName} role="organization" depth={0} />
        <MapRow name={EMA_SCOPE.spaceName} role="space" depth={1} />
        <MapRow name={document?.title ?? EMA_SCOPE.projectName} role="blueprint document" depth={2} />
        {sections.map((section) => (
          <MapRow
            key={section.id ?? section.section_id ?? section.title}
            name={sectionLabel(section)}
            role={section.status ?? "section"}
            depth={section.parent_section_id ? 4 : 3}
          />
        ))}
      </div>
    </>
  );
}

function MapRow({
  name,
  role,
  depth,
}: {
  readonly name: string;
  readonly role: string;
  readonly depth: 0 | 1 | 2 | 3 | 4;
}) {
  return (
    <div role="listitem" className="bp-map__row" style={{ paddingLeft: `${depth * 16}px` }}>
      <span className="bp-map__dot" aria-hidden />
      <span className="bp-map__name">{name}</span>
      <span className="bp-map__role">{role}</span>
    </div>
  );
}

const ATTACHMENTS = [
  { id: "git-ema", name: "git-ema", status: "pending blueprint mirror events" },
  { id: "atlas", name: "EMA atlas", status: "project record reference" },
  { id: "contracts", name: "blueprint.md", status: "event contract" },
  { id: "collab", name: "collab.document", status: "BEAM prose plane" },
] as const;

function AttachmentsSection() {
  return (
    <>
      <h2 className="bp-section__title">Attachments</h2>
      <p className="bp-section__lede">
        Attachment links are not private surface state; they become canon through daemon events.
      </p>
      <div className="bp-attachments" role="list">
        {ATTACHMENTS.map((a) => (
          <div key={a.id} role="listitem" className="bp-attachments__row">
            <span className="bp-attachments__icon" aria-hidden />
            <span className="bp-attachments__name">{a.name}</span>
            <span className="bp-attachments__status">{a.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const DECISIONS = [
  {
    id: "d1",
    title: "Daemon owns truth",
    rationale: "Blueprint structure is replayed from canonical events, then rendered as a projection.",
    status: "active",
  },
  {
    id: "d2",
    title: "Structural and prose planes stay separate",
    rationale: "Section trees are event-sourced. Section prose belongs to BEAM-owned collab documents.",
    status: "active",
  },
  {
    id: "d3",
    title: "CLI and GUI must agree",
    rationale: "Every visible writer path needs a matching daemon command and CLI command.",
    status: "active",
  },
  {
    id: "d4",
    title: "Yjs sidecar authority",
    rationale: "Historical lineage only; Blueprint document authority is daemon/BEAM-owned.",
    status: "superseded",
  },
] as const;

function DecisionsSection() {
  return (
    <>
      <h2 className="bp-section__title">Decisions</h2>
      <p className="bp-section__lede">Decisions that constrain this vApp slice.</p>
      <div className="bp-decisions" role="list">
        {DECISIONS.map((d) => (
          <article key={d.id} role="listitem" className="bp-decision">
            <div className="bp-decision__head">
              <h3 className="bp-decision__title">{d.title}</h3>
              <span className="bp-pill" data-state={d.status}>
                {d.status}
              </span>
            </div>
            <p className="bp-decision__rationale">{d.rationale}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function CanonSection({
  document,
  sections,
}: {
  readonly document: BlueprintDocumentRecord | undefined;
  readonly sections: readonly BlueprintSectionRecord[];
}) {
  return (
    <>
      <h2 className="bp-section__title">Canon</h2>
      <p className="bp-section__lede">The promoted structural record visible to humans and agents.</p>
      <div className="bp-canon">
        <p className="bp-canon__para">
          {document?.title ?? "This Blueprint"} currently has {sections.length} structural section(s).
          The browser renders the projection and does not own the record.
        </p>
        <p className="bp-canon__para">
          The next proof point is parity: daemon commands, CLI verbs, direct panel routes, and this vApp
          should all describe the same section tree.
        </p>
      </div>
    </>
  );
}

function StructuralSection({
  tab,
  document,
}: {
  readonly tab: BlueprintTab;
  readonly document: BlueprintDocumentRecord | undefined;
}) {
  return (
    <>
      <h2 className="bp-section__title">{tab.label}</h2>
      <p className="bp-section__lede">Daemon structural section metadata.</p>
      <dl className="bp-structural">
        <div>
          <dt>section</dt>
          <dd>{tab.id}</dd>
        </div>
        <div>
          <dt>document</dt>
          <dd>{document?.id ?? document?.document_id ?? EMA_SCOPE.blueprintDocId}</dd>
        </div>
        <div>
          <dt>status</dt>
          <dd>{tab.record.status ?? "draft"}</dd>
        </div>
        <div>
          <dt>position</dt>
          <dd>{tab.record.position ?? 0}</dd>
        </div>
      </dl>
    </>
  );
}
