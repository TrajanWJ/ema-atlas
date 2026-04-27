// Build-time parser for autharis/_shared/lanes.md.
// Returns a map of lane id -> status, e.g. { F1: 'held', F2: 'in-review', ... }.
// Read-only: this file NEVER writes to lanes.md.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export type LaneStatus = 'open' | 'held' | 'in-review' | 'landed' | 'blocked';

const KNOWN: readonly LaneStatus[] = [
  'open',
  'held',
  'in-review',
  'landed',
  'blocked',
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
// apps/hub/src/lib -> ../../../autharis/_shared/lanes.md
const LANES_PATH = resolve(HERE, '../../../../autharis/_shared/lanes.md');

function normalizeStatus(raw: string): LaneStatus {
  const trimmed = raw.trim().toLowerCase().replace(/[`*_]/g, '');
  return (KNOWN as readonly string[]).includes(trimmed)
    ? (trimmed as LaneStatus)
    : 'open';
}

/**
 * Parse lanes.md for `### Lane <ID> — <title>` headings followed by a
 * `- **Status:** <status>` line. Returns the first status match per lane.
 */
export function parseLaneStatuses(): Record<string, LaneStatus> {
  let md: string;
  try {
    md = readFileSync(LANES_PATH, 'utf8');
  } catch {
    return {};
  }

  const out: Record<string, LaneStatus> = {};
  // Match lane heading + subsequent status line. Non-greedy across a few lines.
  const re =
    /###\s+Lane\s+([A-Z0-9]+)\s+[—\-][\s\S]*?\*\*Status:\*\*\s*([^\n·]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const lane = m[1];
    const status = normalizeStatus(m[2]);
    if (lane && !(lane in out)) {
      out[lane] = status;
    }
  }
  return out;
}

/**
 * Resolve a deliverable's `lane` field (which may be a composite like
 * "B1/B2/B3/B4/C1") to a representative status. Uses the first lane id found.
 */
export function statusForLaneField(
  laneField: string,
  statuses: Record<string, LaneStatus>,
): LaneStatus {
  const first = laneField.split('/')[0]?.trim();
  if (!first) return 'open';
  return statuses[first] ?? 'open';
}
