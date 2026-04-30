#!/usr/bin/env node
// Seed the canonical Blueprint event log with the EMA "Question Based
// Construction" 4-document / 20-section tree.
//
// Idempotent: scans the `blueprint.sections` projection first; for each
// document it only creates the document and sections that don't already
// exist by title. Re-runs are safe and additive.
//
// Usage:  node tooling/seed-blueprint.mjs
//   env:  EMA_IPC_PORT=49555  EMA_PROJECT_ID=project:01J00000000000000000000006

import { execFileSync } from "node:child_process";

const PROJECT = process.env.EMA_PROJECT_ID ?? "project:01J00000000000000000000006";
const ORG = process.env.EMA_ORG_ID ?? "org:01J00000000000000000000001";
const ACTOR = process.env.EMA_ACTOR_ID ?? "actor:dev-console";

const TREE = [
  {
    title: "Master EMA Design Doc",
    sections: [
      "1. Executive Summary",
      "2. Core Thesis",
      "3. Problem EMA Solves",
      "4. Design Principles",
      "5. EMA Ontology",
      "6. Canonical Workflow",
      "7. Product Model",
      "8. Core Product Surfaces",
      "9. Agent Model",
      "10. Soul Model",
      "11. Memory and Context Model",
      "12. Temporal System",
      "13. Project / Org / Space Structure",
      "14. Debate / Simulation / Stress Testing",
      "15. Harness / Control Plane / Runtime",
      "16. Governance and Trust",
      "17. MVP Definition",
      "18. Risks and Failure Modes",
      "19. Validation Plan",
      "20. Open Questions",
    ],
  },
  {
    title: "Project Overview Document",
    sections: [
      "Cover Statement",
      "What EMA Is",
      "What EMA Is Not",
      "Why Now",
      "Core North Star",
      "Product Ambition",
      "System Doctrine",
      "Main Surfaces",
      "Current Reality",
      "What Exists Today",
      "What Still Needs Resolution",
      "Who EMA Is For First",
      "Example Use Cases",
      "Success Criteria",
      "Linked Docs",
    ],
  },
  {
    title: "Technical & Backend Document",
    sections: [
      "System Doctrine",
      "Top-Level Architecture",
      "Core Objects / Schema",
      "State Ownership Rules",
      "Workflow State Machine",
      "Agent Runtime Model",
      "Soul Representation Model",
      "Memory Architecture",
      "Retrieval / Context Assembly",
      "Permissions / Approval Model",
      "Project / Org / Space Scoping",
      "Run / Session / Task Separation",
      "Event / Audit Model",
      "Sync / Collaboration / P2P Model",
      "Integrations / Adapters",
      "Deployment / Hosting Model",
      "Technical Risks",
      "Migration Notes",
    ],
  },
  {
    title: "Styling, Frontend, UX, Mentality Document",
    sections: [
      "Product Feel",
      "Core Interface Mentality",
      "Anti-Slop Rules",
      "Surface Personalities",
      "Visual Language",
      "Layout Grammar",
      "Typography",
      "Color System",
      "Motion Principles",
      "Iconography",
      "Component Style",
      "Interaction Rules",
      "Agent/Human Co-Work UX Patterns",
      "Empty States / Loading / Review States",
      "Design Tokens",
      "Copy Tone / Voice",
      "Examples of Good EMA UI",
      "Examples of Bad EMA UI",
    ],
  },
];

function cli(args) {
  const out = execFileSync("node", ["apps/cli/dist/bin.js", "blueprint", ...args], {
    encoding: "utf8",
  });
  return JSON.parse(out);
}

function listDocuments() {
  const result = cli(["list", "--json"]);
  return Array.isArray(result.documents) ? result.documents : [];
}

function ensureDocument(title) {
  const docs = listDocuments();
  const existing = docs.find((d) => d.title === title);
  if (existing) {
    const id = existing.id ?? existing.document_id;
    console.log(`= document exists: ${id}  "${title}"`);
    return { id, sections: Array.isArray(existing.sections) ? existing.sections : [] };
  }
  const created = cli([
    "document",
    "create",
    "--org",
    ORG,
    "--actor",
    ACTOR,
    "--project",
    PROJECT,
    "--title",
    title,
    "--json",
  ]);
  if (created.ok !== true) {
    throw new Error(`document create failed for "${title}": ${JSON.stringify(created)}`);
  }
  console.log(`+ document created: ${created.resource}  "${title}"`);
  return { id: created.resource, sections: [] };
}

function ensureSection(documentId, existingSections, title, position) {
  const found = existingSections.find((s) => s.title === title);
  if (found) {
    const id = found.id ?? found.section_id;
    console.log(`  = section exists at pos ${found.position}: ${id}  "${title}"`);
    return id;
  }
  const created = cli([
    "section",
    "add",
    "--org",
    ORG,
    "--actor",
    ACTOR,
    "--document",
    documentId,
    "--title",
    title,
    "--position",
    String(position),
    "--json",
  ]);
  if (created.ok !== true) {
    throw new Error(
      `section add failed for "${title}" in ${documentId}: ${JSON.stringify(created)}`,
    );
  }
  console.log(`  + section added at pos ${position}: ${created.resource}  "${title}"`);
  return created.resource;
}

async function main() {
  let docsCreated = 0;
  let sectionsAdded = 0;
  for (const doc of TREE) {
    const before = listDocuments();
    const { id, sections } = ensureDocument(doc.title);
    if (!before.find((d) => d.title === doc.title)) docsCreated += 1;
    for (let i = 0; i < doc.sections.length; i += 1) {
      const title = doc.sections[i];
      const beforeIds = sections.map((s) => s.id ?? s.section_id);
      ensureSection(id, sections, title, i);
      const after = listDocuments().find((d) => (d.id ?? d.document_id) === id);
      const afterSecs = Array.isArray(after?.sections) ? after.sections : [];
      if (afterSecs.length > beforeIds.length) sectionsAdded += 1;
      sections.splice(0, sections.length, ...afterSecs);
    }
  }
  const final = listDocuments();
  const totalSections = final.reduce(
    (n, d) => n + (Array.isArray(d.sections) ? d.sections.length : 0),
    0,
  );
  console.log("");
  console.log(
    `seed-blueprint: ${docsCreated} new doc(s), ${sectionsAdded} new section(s) — `
      + `now ${final.length} doc(s) / ${totalSections} section(s) total`,
  );
}

main().catch((err) => {
  console.error("seed-blueprint failed:", err.message ?? err);
  process.exit(1);
});
