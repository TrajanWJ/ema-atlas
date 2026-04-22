import { promises as fs } from "node:fs";
import path from "node:path";

import { loadMarkdown } from "@/lib/markdown";

export type DocFile = {
  /** path relative to repo root, e.g. "howto/add-a-branch.md" */
  rel: string;
  /** flattened slug, e.g. "howto--add-a-branch" */
  slug: string;
  /** display name (basename minus .md) */
  name: string;
  /** first non-heading paragraph (<=180 chars) */
  summary: string;
};

export type Tier = {
  key: "tier1" | "tier2" | "tier3" | "tier4" | "tier5";
  label: string;
  title: string;
  blurb: string;
  files: DocFile[];
};

const TIER1 = [
  "README.md",
  "MACBOOK_AGENT_HANDOFF_MASTER.md",
  "AGENT_QUICKREF.md",
  "VISION.md",
  "FAQ.md",
  "ROADMAP.md",
];

const TIER2 = [
  "DESIGN_PRINCIPLES.md",
  "ARCHITECTURE.md",
  "EMA_V0_0_3_PREP.md",
  "GLEAM_NOTES.md",
  "OPEN_QUESTIONS.md",
  "GLOSSARY.md",
  "TIMELINE.md",
];

const TIER3 = [
  "INDEX.md",
  "SYSTEM_GRAPH.md",
  "ATLAS_NOTES.md",
  "LIB_DATA_CONTRACT.md",
  "CONTRIBUTING_TO_GRAPH.md",
  "CONTRIBUTORS.md",
  "CHANGELOG.md",
  "DELIVERABLES_INDEX.md",
  "BRANCH_MAP.md",
  "BRANCH_MAP_EXPANDED.md",
];

const TIER4 = [
  "01-best-prompt-and-answer.md",
  "02-project-transfer-brief.md",
  "03-architectural-evolution-and-major-decisions.md",
  "04-agent-orchestration-and-shared-workspace-briefing.md",
  "05-fresh-context-project-app-model.md",
];

export function relToSlug(rel: string): string {
  return rel.replace(/\.md$/i, "").split("/").join("--");
}

function extractSummary(md: string): string {
  const lines = md.split(/\r?\n/);
  const buf: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (buf.length > 0) break;
      continue;
    }
    if (line.startsWith("#")) continue;
    if (line.startsWith(">")) continue;
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\./.test(line)) continue;
    if (line.startsWith("|")) continue;
    if (line.startsWith("```")) continue;
    if (line.startsWith("<!--")) continue;
    buf.push(line);
  }
  const para = buf.join(" ").replace(/\s+/g, " ").trim();
  if (!para) return "(no summary available yet)";
  return para.length > 180 ? para.slice(0, 177).trimEnd() + "..." : para;
}

async function loadDocFile(rel: string): Promise<DocFile | null> {
  const abs = path.join(process.cwd(), rel);
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return null;
    const md = await loadMarkdown(rel);
    const name = path.basename(rel).replace(/\.md$/i, "");
    return {
      rel,
      slug: relToSlug(rel),
      name,
      summary: extractSummary(md),
    };
  } catch {
    return null;
  }
}

async function loadTierFiles(rels: string[]): Promise<DocFile[]> {
  const out: DocFile[] = [];
  for (const rel of rels) {
    const f = await loadDocFile(rel);
    if (f) out.push(f);
  }
  return out;
}

async function loadHowtoFiles(): Promise<DocFile[]> {
  const root = path.join(process.cwd(), "howto");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }
  const files: DocFile[] = [];
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith(".md")) continue;
    const f = await loadDocFile(path.join("howto", entry));
    if (f) files.push(f);
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadTiers(): Promise<Tier[]> {
  const [t1, t2, t3, t4, t5] = await Promise.all([
    loadTierFiles(TIER1),
    loadTierFiles(TIER2),
    loadTierFiles(TIER3),
    loadTierFiles(TIER4),
    loadHowtoFiles(),
  ]);

  return [
    {
      key: "tier1",
      label: "Tier 1",
      title: "Must read",
      blurb:
        "Start here. The orientation set: vision, FAQ, roadmap, and the agent handoff master that gets a fresh context up to speed.",
      files: t1,
    },
    {
      key: "tier2",
      label: "Tier 2",
      title: "Design + decisions",
      blurb:
        "Doctrine and architecture. How EMA is shaped, why those choices were made, and where the open questions still live.",
      files: t2,
    },
    {
      key: "tier3",
      label: "Tier 3",
      title: "Process + maps",
      blurb:
        "Indexes, branch maps, the system graph, and the contracts that keep the atlas, swarm, and contributor flow coherent.",
      files: t3,
    },
    {
      key: "tier4",
      label: "Tier 4",
      title: "Long-form handoff series",
      blurb:
        "Five sequential briefs: the best prompt + answer, the transfer brief, architectural evolution, swarm orchestration, and the fresh-context app model.",
      files: t4,
    },
    {
      key: "tier5",
      label: "Tier 5",
      title: "How-to playbooks",
      blurb:
        "Operational recipes auto-discovered from howto/. Pick a verb, follow the steps, ship the change.",
      files: t5,
    },
  ];
}
