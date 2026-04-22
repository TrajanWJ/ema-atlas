import { promises as fs } from "node:fs";
import path from "node:path";

export type DiagramName = "now" | "three-futures" | "decisions";

export type DiagramTrio = {
  now: string | null;
  threeFutures: string | null;
  decisions: string | null;
};

const DIAGRAM_NAMES: DiagramName[] = ["now", "three-futures", "decisions"];

async function tryRead(rel: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(process.cwd(), rel), "utf8");
  } catch {
    return null;
  }
}

/**
 * Reads `content/diagrams/<slug>/<name>.svg` at build time. Returns
 * `{ now, threeFutures, decisions }` for a given slug. Each entry is
 * the raw SVG markup as a string, or null if missing.
 */
export async function loadDiagrams(slug: string): Promise<DiagramTrio> {
  const [now, threeFutures, decisions] = await Promise.all(
    DIAGRAM_NAMES.map((name) =>
      tryRead(path.join("content", "diagrams", slug, `${name}.svg`))
    )
  );
  return { now, threeFutures, decisions };
}

/**
 * Counts how many of the three diagrams exist on disk for a given slug.
 * Used by /parts/[slug] to decide whether to surface a chip.
 */
export async function countDiagrams(slug: string): Promise<number> {
  const trio = await loadDiagrams(slug);
  return [trio.now, trio.threeFutures, trio.decisions].filter(
    (value): value is string => value !== null
  ).length;
}

/**
 * Hardcoded captions per (slug, diagram) pair. One per file, 24 total.
 */
export const DIAGRAM_CAPTIONS: Record<string, Record<DiagramName, string>> = {
  "authority-control-plane": {
    now: "Today's authority surface: scattered approvals, implicit lineage, no single court of record.",
    "three-futures": "Three stances on truth: citadel of approvals, woven authority inside the workspace, or lease-based across peers.",
    decisions: "Where authority must commit first: which actions become impossible without an EMA-owned record."
  },
  "harness-execution": {
    now: "Hermes today: provider sessions, ad-hoc tool calls, and runs that don't always come back to the record.",
    "three-futures": "Backstage engine, lived-in workspace surface, or portable peer execution fabric.",
    decisions: "Where the runtime line gets drawn: adopting sessions, normalizing events, exposing delegation."
  },
  "shared-workspace": {
    now: "Plans, threads, and files scattered across surfaces; little of it canonical to EMA yet.",
    "three-futures": "Curated command archive, lush living workspace, or replica-friendly portable substrate.",
    decisions: "First-class artifact set for v1 and where file-shape vs database-shape gets decided."
  },
  "coordination-environment": {
    now: "Planner, swarm, and calendar living as side rituals rather than first-class EMA objects.",
    "three-futures": "Air-traffic control, living studio, or mesh negotiation layer for responsibilities.",
    decisions: "Lane vs task, checkup ritual vs notification, and how much autonomy planner agents get."
  },
  "semantic-layer": {
    now: "Wiki, graph, and references exist in fragments; no single semantic layer accompanies the build.",
    "three-futures": "Disciplined reference system, living notebook-city, or federated memory substrate.",
    decisions: "Whether the semantic layer indexes execution reality or authors it, and how much graph users absorb."
  },
  "shells-surfaces": {
    now: "HQ, Launchpad, Threads, Chat, and Desktop coexist without a settled hierarchy.",
    "three-futures": "Operator shell hierarchy, Virtual Desktop as iconic center, or adaptive role-aware surfaces.",
    decisions: "Which shell defines the first mental model and how much place.org DNA survives."
  },
  "identity-project-space": {
    now: "Personal vs org projects, membership, and cross-project visibility all under-specified.",
    "three-futures": "Strict boundaries, fluid-but-bounded continuity, or network-native federated identity.",
    decisions: "Personal AI reach, whether spaces span projects, and the smallest trustworthy permission story."
  },
  "mesh-replication": {
    now: "Single-node EMA with no replication, no presence, no peer placement yet.",
    "three-futures": "Narrow authority leases, presence-led collaboration, or full peer commonwealth.",
    decisions: "Which objects converge vs arbitrate, the first replication slice, and presence exposure."
  }
};
