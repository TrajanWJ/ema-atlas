import { loadMarkdown } from "@/lib/markdown";

export type DecisionStatus = "open" | "parked" | "resolved";
export type DecisionReadiness = "red" | "amber" | "green";

export type DecisionAxis = {
  left: string;
  right: string;
};

export type Decision = {
  id: string; // e.g. "Q1"
  number: number;
  title: string; // text after the dash, e.g. "Are agent identities first-class members of Org/Space?"
  status: DecisionStatus;
  blastRadius: string;
  whereSurfaces: string[];
  variants: string[];
  notes: string[];
  axis: DecisionAxis;
  readiness: DecisionReadiness;
};

// Hardcoded axis labels per Q based on OPEN_QUESTIONS.md content.
const AXES: Record<string, DecisionAxis> = {
  Q1: { left: "agents as guests", right: "agents as full members" },
  Q2: { left: "single event log", right: "adjacent collab store" },
  Q3: { left: "strict scope", right: "fluid scope" },
  Q4: { left: "user-machine local", right: "remote daemon / per-call placement" },
  Q5: { left: "sync RPC", right: "streaming events" },
  Q6: { left: "read-only mirror", right: "EMA superset / bidirectional" },
  Q7: { left: "native-first", right: "web-first" },
  Q8: { left: "centralized event log", right: "CRDT (Yjs / Automerge / Elixir)" },
  Q9: { left: "open", right: "open" },
  Q10: { left: "simple inheritance", right: "explicit policy bundles" }
};

// Heuristic readiness mapping per the task spec.
const READINESS: Record<string, DecisionReadiness> = {
  Q1: "red",
  Q2: "red",
  Q3: "red",
  Q5: "red",
  Q4: "amber",
  Q6: "amber",
  Q7: "amber",
  Q8: "amber",
  Q9: "green",
  Q10: "green"
};

function parseStatus(raw: string): DecisionStatus {
  const lower = raw.toLowerCase();
  if (lower.startsWith("resolved")) return "resolved";
  if (lower.startsWith("parked")) return "parked";
  return "open";
}

function stripBullet(line: string): string {
  return line.replace(/^[\s\-*]+/, "").trim();
}

function fieldValue(line: string, label: string): string | null {
  const re = new RegExp(`^\\*\\*${label}:?\\*\\*\\s*(.*)$`, "i");
  const m = line.match(re);
  return m ? m[1].trim() : null;
}

export async function loadDecisions(): Promise<Decision[]> {
  const raw = await loadMarkdown("OPEN_QUESTIONS.md");
  const lines = raw.split(/\r?\n/);

  const decisions: Decision[] = [];
  let current: Partial<Decision> | null = null;
  let collecting: "where" | null = null;

  const finalize = () => {
    if (!current || !current.id) return;
    const id = current.id;
    decisions.push({
      id,
      number: current.number ?? 0,
      title: current.title ?? "",
      status: current.status ?? "open",
      blastRadius: current.blastRadius ?? "",
      whereSurfaces: current.whereSurfaces ?? [],
      variants: current.variants ?? [],
      notes: current.notes ?? [],
      axis: AXES[id] ?? { left: "open", right: "open" },
      readiness: READINESS[id] ?? "amber"
    });
    current = null;
    collecting = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^##\s+(Q(\d+))\s+[—-]\s+(.*)$/);
    if (heading) {
      finalize();
      current = {
        id: heading[1],
        number: Number(heading[2]),
        title: heading[3].trim(),
        whereSurfaces: [],
        variants: [],
        notes: []
      };
      collecting = null;
      continue;
    }
    if (!current) continue;

    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      const inner = trimmed.slice(2).trim();
      const status = fieldValue(inner, "Status");
      if (status !== null) {
        current.status = parseStatus(status);
        collecting = null;
        continue;
      }
      const blast = fieldValue(inner, "Blast radius");
      if (blast !== null) {
        current.blastRadius = blast;
        collecting = null;
        continue;
      }
      const where = fieldValue(inner, "Where it surfaces");
      if (where !== null) {
        collecting = "where";
        if (where) current.whereSurfaces!.push(where);
        continue;
      }
      const variants = fieldValue(inner, "Variants") ?? fieldValue(inner, "Variants in play");
      if (variants !== null) {
        current.variants = variants
          .split(/[·•]/)
          .map((s) => s.trim())
          .filter(Boolean);
        collecting = null;
        continue;
      }
      const why = fieldValue(inner, "Why it matters");
      if (why !== null) {
        current.notes!.push(why);
        collecting = null;
        continue;
      }
      const note = fieldValue(inner, "Note");
      if (note !== null) {
        current.notes!.push(note);
        collecting = null;
        continue;
      }
      const tension = fieldValue(inner, "Tension");
      if (tension !== null) {
        current.notes!.push(`Tension: ${tension}`);
        collecting = null;
        continue;
      }
      // continuation of where it surfaces
      if (collecting === "where") {
        current.whereSurfaces!.push(stripBullet(inner));
      }
    } else if (collecting === "where" && trimmed.startsWith("- ")) {
      current.whereSurfaces!.push(stripBullet(trimmed));
    }
  }
  finalize();

  decisions.sort((a, b) => a.number - b.number);
  return decisions;
}
