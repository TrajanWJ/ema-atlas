import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { WorkspaceScope } from "./workspace-scope.js";

export const DESKTOP_ROOT = "/Users/trajanm4air/Desktop";
// Retained for peer.ts and hermes orientation defaults; not used as a project_record fallback.
export const EMA_ACTIVE_BUILD = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.5");
export const AGENT_WORKSPACE_PROJECT = join(DESKTOP_ROOT, "Projects", "agent-workspace-vapp");
export const AGENTS_MD = join(DESKTOP_ROOT, "AGENTS.md");
export const CLAUDE_MD = join(DESKTOP_ROOT, "CLAUDE.md");

export type WorkspaceRecord = {
  id: string;
  title: string;
  type: string;
  status: string;
  path: string;
};

export type VcalendarTick = {
  now: string;
  iso_week: string;
  phase: string;
  mode: "planning" | "execution" | "review" | "handoff" | "maintenance";
  should_plan: boolean;
  should_checkup: boolean;
  should_handoff: boolean;
  next_tick: string;
  instructions: string[];
};

export type WorkspaceSummary = {
  source: "file_backed_projection" | "daemon_workspace_registry";
  daemon_authority: "pending_workspace_writer" | "canonical_events";
  root: string;
  active_build: string | null;
  project_record: string | null;
  workspace_scope: WorkspaceScope | null;
  orientation_docs: string[];
  counts: Record<string, number>;
  records: Record<string, WorkspaceRecord[]>;
  tick: VcalendarTick;
  enforcement: string[];
};

export interface WorkspaceSummaryOptions {
  readonly scope?: WorkspaceScope | null;
  readonly now?: Date;
}

export type DaemonWorkspaceOverlay = {
  lanes: WorkspaceRecord[];
  queue: WorkspaceRecord[];
};

const RECORD_DIRS = [
  "lanes",
  "queue",
  "handoffs",
  "executions",
  "responsibilities",
  "weekly",
  "checkups",
] as const;

export function workspaceSummary(opts: WorkspaceSummaryOptions = {}): WorkspaceSummary {
  const now = opts.now ?? new Date();
  const scope = opts.scope ?? null;
  const projectRecord = scope?.project_record ?? null;
  const activeBuild = scope?.active_build ?? null;

  const records = projectRecord
    ? (Object.fromEntries(
        RECORD_DIRS.map((dir) => [dir, readRecords(join(projectRecord, dir))]),
      ) as Record<string, WorkspaceRecord[]>)
    : (Object.fromEntries(RECORD_DIRS.map((dir) => [dir, []])) as Record<string, WorkspaceRecord[]>);

  return {
    source: "file_backed_projection",
    daemon_authority: "pending_workspace_writer",
    root: DESKTOP_ROOT,
    active_build: activeBuild,
    project_record: projectRecord,
    workspace_scope: scope,
    orientation_docs: orientationDocs(projectRecord, activeBuild),
    counts: Object.fromEntries(
      Object.entries(records).map(([key, value]) => [key, value.length]),
    ),
    records,
    tick: vcalendarTick(now),
    enforcement: [
      "Start every agent session with `ema tl about --json` or `ema agent orient --json`.",
      "Claim or open a lane before broad edits; keep work inside that scope.",
      "When later work appears, log it as a queue item with why, dependency, done-when, and source.",
      "When a blocker recurs, log a problem and candidate solution edge.",
      "Run `ema vcalendar tick --json` at phase boundaries and before handoff.",
      "Daemon owns canonical lane/queue writes when available; file-backed project records remain fallback context.",
    ],
  };
}

function orientationDocs(projectRecord: string | null, activeBuild: string | null): string[] {
  const docs: string[] = [AGENTS_MD, CLAUDE_MD];
  if (activeBuild) docs.push(join(activeBuild, "docs", "cli", "agent-workspace.md"));
  if (projectRecord) {
    docs.push(join(projectRecord, "blueprint", "02-agent-cli-operating-contract.md"));
    docs.push(join(projectRecord, "atlas", "dependency-graph.md"));
  }
  return docs;
}

export function withDaemonWorkspaceRecords(
  summary: WorkspaceSummary,
  overlay: DaemonWorkspaceOverlay | null,
): WorkspaceSummary {
  if (!overlay) return summary;

  const records = {
    ...summary.records,
    lanes: overlay.lanes,
    queue: overlay.queue,
  };

  return {
    ...summary,
    source: "daemon_workspace_registry",
    daemon_authority: "canonical_events",
    records,
    counts: Object.fromEntries(
      Object.entries(records).map(([key, value]) => [key, value.length]),
    ),
    enforcement: summary.enforcement.map((rule) =>
      rule.includes("file-backed project records remain fallback context")
        ? "Daemon owns canonical workspace lane/queue records; file-backed project records remain fallback context."
        : rule,
    ),
  };
}

export function vcalendarTick(now = new Date()): VcalendarTick {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const minutes = hour * 60 + minute;
  const phase = phaseFor(minutes);
  const next = nextBoundary(now, minutes);

  return {
    now: now.toISOString(),
    iso_week: isoWeek(now),
    phase: phase.label,
    mode: phase.mode,
    should_plan: phase.mode === "planning",
    should_checkup: phase.mode === "review" || phase.mode === "handoff",
    should_handoff: phase.mode === "handoff",
    next_tick: next.toISOString(),
    instructions: phase.instructions,
  };
}

function readRecords(dir: string): WorkspaceRecord[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => parseRecord(join(dir, name)))
    .filter((record): record is WorkspaceRecord => record != null);
}

function parseRecord(path: string): WorkspaceRecord | null {
  try {
    if (!statSync(path).isFile()) return null;
    const raw = readFileSync(path, "utf8");
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
    const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileTitle(path);
    const meta = frontmatter ? parseFrontmatter(frontmatter[1] ?? "") : {};
    return {
      id: meta.id ?? fileTitle(path),
      title,
      type: meta.type ?? "markdown_record",
      status: meta.status ?? "unknown",
      path: relative(DESKTOP_ROOT, path),
    };
  } catch {
    return null;
  }
}

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function fileTitle(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function phaseFor(minutes: number): {
  label: string;
  mode: VcalendarTick["mode"];
  instructions: string[];
} {
  if (minutes < 9 * 60) {
    return {
      label: "intake and orientation",
      mode: "planning",
      instructions: [
        "Read orientation docs.",
        "Run `ema status --json` and `ema agent orient --json`.",
        "Pick or open the lane before editing.",
      ],
    };
  }
  if (minutes < 11 * 60) {
    return {
      label: "planning and lane claim",
      mode: "planning",
      instructions: [
        "Clarify campaign, mission, lane, dependencies, and done-when.",
        "Log discovered later work to queue instead of expanding scope.",
        "Schedule checkups for risky or long-running lanes.",
      ],
    };
  }
  if (minutes < 16 * 60) {
    return {
      label: "execution block",
      mode: "execution",
      instructions: [
        "Work inside the claimed lane scope.",
        "Keep dependency discoveries in queue/problem graph.",
        "Run verification before crossing into review.",
      ],
    };
  }
  if (minutes < 18 * 60) {
    return {
      label: "review and checkup",
      mode: "review",
      instructions: [
        "Run verification and summarize changed files.",
        "Close or update queue items.",
        "Record blockers as problem/solution graph nodes.",
      ],
    };
  }
  return {
    label: "handoff and next-day queue",
    mode: "handoff",
    instructions: [
      "Request or complete handoff before leaving partial work.",
      "Move unfinished discoveries to queue with dependencies.",
      "Set next vCalendar block and checkup cadence.",
    ],
  };
}

function nextBoundary(now: Date, minutes: number): Date {
  const boundaries = [9 * 60, 11 * 60, 16 * 60, 18 * 60, 24 * 60];
  const boundary = boundaries.find((value) => value > minutes) ?? 24 * 60;
  const next = new Date(now);
  next.setHours(0, boundary, 0, 0);
  return next;
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}
