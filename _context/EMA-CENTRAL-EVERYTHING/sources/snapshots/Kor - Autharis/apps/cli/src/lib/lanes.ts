// Parser for autharis/_shared/lanes.md. Lane G2.
import * as fs from 'node:fs';
import * as path from 'node:path';

export type LaneStatus = 'open' | 'held' | 'in-review' | 'landed' | 'blocked';

export interface LaneRow {
  readonly id: string;
  readonly shortName: string;
  readonly status: LaneStatus;
  readonly holder: string;
}

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
  'open',
  'held',
  'in-review',
  'landed',
  'blocked',
]);

/**
 * Resolve the repo-root-relative path to _shared/lanes.md from the CLI package.
 * Walks up from `startDir` looking for the monorepo root (contains pnpm-workspace.yaml).
 */
export function resolveLanesPath(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 8; i++) {
    const marker = path.join(dir, 'pnpm-workspace.yaml');
    if (fs.existsSync(marker)) {
      return path.join(dir, 'autharis', '_shared', 'lanes.md');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // fall back to CWD relative — caller can override via env
  return path.resolve(startDir, 'autharis', '_shared', 'lanes.md');
}

function normalizeStatus(raw: string): LaneStatus {
  const s = raw.trim().toLowerCase();
  if (KNOWN_STATUSES.has(s)) return s as LaneStatus;
  return 'open';
}

/** Strip markdown emphasis markers and surrounding backticks. */
function clean(token: string): string {
  return token
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

/**
 * Parse the lanes markdown into typed rows.
 *
 * Supports both layout variants present in lanes.md:
 *   1. Multi-line form:
 *        ### Lane X — Short name
 *        - **Status:** open
 *        - **Holder:** someone
 *   2. Inline form (Wave 5):
 *        ### Lane X — Short name
 *        - **Status:** open · **Holder:** open · ...
 */
export function parseLanes(markdown: string): LaneRow[] {
  const lines = markdown.split(/\r?\n/);
  const rows: LaneRow[] = [];
  let current: {
    id: string;
    shortName: string;
    status?: LaneStatus;
    holder?: string;
  } | null = null;

  const flush = () => {
    if (current && current.status && current.holder) {
      rows.push({
        id: current.id,
        shortName: current.shortName,
        status: current.status,
        holder: current.holder,
      });
    }
    current = null;
  };

  // Match `### Lane <ID> — <short name>` (em-dash or hyphen).
  const headingRe = /^###\s+Lane\s+([A-Za-z0-9]+)\s*[—–-]\s*(.+?)\s*$/;
  const statusRe = /\*\*Status:\*\*\s*([A-Za-z-]+)/;
  const holderRe = /\*\*Holder:\*\*\s*([^·\n]+?)(?:\s*·|$)/;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const head = headingRe.exec(line);
    if (head) {
      flush();
      current = { id: head[1]!.trim(), shortName: clean(head[2]!) };
      continue;
    }
    if (!current) continue;
    // stop collecting if we hit a new heading block at `##` or `---`
    if (/^##\s/.test(line) || line.trim() === '---') {
      flush();
      continue;
    }
    const s = statusRe.exec(line);
    if (s && !current.status) current.status = normalizeStatus(s[1]!);
    const h = holderRe.exec(line);
    if (h && !current.holder) current.holder = clean(h[1]!);
  }
  flush();
  return rows;
}

export function readLanes(filePath: string = resolveLanesPath()): LaneRow[] {
  const md = fs.readFileSync(filePath, 'utf8');
  return parseLanes(md);
}
