import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

type Status = "shipped" | "sketched" | "planned" | "in flight" | "as-needed" | "open" | "other";

type Entry = {
  title: string;
  filePath?: string;
  route?: string;
  status: Status;
  words?: number;
  notes?: string;
  extras?: Record<string, string>;
};

type Section = {
  heading: string;
  blurb: string;
  summary: string;
  entries: Entry[];
};

function normalizeStatus(raw: string): Status {
  const s = raw.toLowerCase().trim();
  if (s.startsWith("shipped")) return "shipped";
  if (s.startsWith("sketched")) return "sketched";
  if (s.startsWith("planned")) return "planned";
  if (s.startsWith("in flight") || s.startsWith("in-flight")) return "in flight";
  if (s.startsWith("as-needed") || s.startsWith("as needed")) return "as-needed";
  if (s.startsWith("open")) return "open";
  return "other";
}

function statusPillClass(status: Status): string {
  const map: Record<Status, string> = {
    shipped: "shipped",
    sketched: "sketched",
    planned: "planned",
    "in flight": "partial",
    "as-needed": "planned",
    open: "partial",
    other: "planned",
  };
  return `vapp-card__status vapp-card__status--${map[status]}`;
}

function stripMd(cell: string): string {
  let out = cell.trim();
  out = out.replace(/`([^`]*)`/g, "$1");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  return out.trim();
}

function extractPath(cell: string): string | undefined {
  const m = cell.match(/`([^`]+)`/);
  if (m) return m[1];
  const m2 = cell.match(/(content\/[^\s|]+|research\/[^\s|]+|app\/[^\s|]+)/);
  if (m2) return m2[1];
  return undefined;
}

function extractRoute(cell: string): string | undefined {
  const m = cell.match(/`(\/[A-Za-z0-9_\-/[\]]+)`/);
  if (m) return m[1];
  return undefined;
}

function parseInventory(md: string): Section[] {
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let current: { heading: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      if (current) sections.push(buildSection(current));
      current = { heading: h[1].trim(), bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) sections.push(buildSection(current));
  return sections.filter((s) => s.entries.length > 0 || s.summary || s.blurb);
}

function buildSection(raw: { heading: string; bodyLines: string[] }): Section {
  const tableRows: string[][] = [];
  const tableHeaders: string[] = [];
  let inTable = false;
  let pastTable = false;
  let tableStarted = false;
  const blurbLines: string[] = [];
  const summaryLines: string[] = [];

  for (const line of raw.bodyLines) {
    const trimmed = line.trim();
    const isTableLine = /^\|/.test(trimmed);
    const isSeparator = /^\|[\s\-:|]+\|$/.test(trimmed);

    if (isTableLine) {
      if (!tableStarted) {
        tableStarted = true;
        inTable = true;
        const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
        tableHeaders.push(...cells);
        continue;
      }
      if (isSeparator) continue;
      if (inTable) {
        const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
        tableRows.push(cells);
        continue;
      }
    } else {
      if (inTable) {
        inTable = false;
        pastTable = true;
        if (trimmed) summaryLines.push(trimmed);
        continue;
      }
      if (pastTable) {
        if (trimmed) summaryLines.push(trimmed);
      } else {
        if (trimmed) blurbLines.push(trimmed);
      }
    }
  }

  const blurb = blurbLines.join(" ").replace(/\s+/g, " ").trim();
  const summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();

  const entries: Entry[] = tableRows
    .map((row) => rowToEntry(tableHeaders, row))
    .filter((e): e is Entry => e !== null);

  return { heading: raw.heading, blurb, summary, entries };
}

function rowToEntry(headers: string[], row: string[]): Entry | null {
  if (row.length === 0) return null;
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const get = (...names: string[]): string | undefined => {
    for (const n of names) {
      const idx = lowerHeaders.indexOf(n);
      if (idx >= 0 && row[idx] !== undefined) return row[idx];
    }
    return undefined;
  };

  const titleRaw = get("slug", "id", "file", "part", "route") ?? row[0] ?? "(untitled)";
  const title = stripMd(titleRaw);
  if (!title) return null;

  const statusRaw = get("status") ?? "";
  let status = normalizeStatus(stripMd(statusRaw));

  const wordsRaw = get("words");
  const words = wordsRaw ? Number(stripMd(wordsRaw).replace(/[^\d]/g, "")) : undefined;

  const fileCell = get("file path", "file") ?? "";
  const routeCell = get("route") ?? "";
  const filePath = extractPath(fileCell) ?? extractPath(titleRaw);
  const route = extractRoute(routeCell);
  const notesParts: string[] = [];
  for (const k of ["title", "notes", "fit topic", "layout", "template depth", "axis (left ↔ right)", "readiness", "question", "renders"]) {
    const v = get(k);
    if (v) notesParts.push(`${k}: ${stripMd(v)}`);
  }

  const extras: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const v = row[i];
    if (!h || v === undefined) continue;
    const lh = h.toLowerCase();
    if (["slug", "id", "file", "part", "route", "status", "words", "file path", "title", "notes", "fit topic", "layout", "template depth", "axis (left ↔ right)", "readiness", "question", "renders"].includes(lh)) continue;
    extras[h] = stripMd(v);
  }

  if (status === "other" && Object.values(extras).some((v) => /shipped/i.test(v))) {
    status = "shipped";
  }

  return {
    title,
    filePath,
    route,
    status,
    words: Number.isFinite(words) ? (words as number) : undefined,
    notes: notesParts.join(" · ") || undefined,
    extras: Object.keys(extras).length > 0 ? extras : undefined,
  };
}

export default async function ArtifactsPage() {
  const md = await loadMarkdown("content/artifacts/inventory.md");
  const sections = parseInventory(md);

  const totalEntries = sections.reduce((acc, s) => acc + s.entries.length, 0);
  const shippedCount = sections.reduce(
    (acc, s) => acc + s.entries.filter((e) => e.status === "shipped").length,
    0
  );

  return (
    <SiteShell
      eyebrow="Atlas Catalog"
      title="Artifacts inventory"
      intro="Every format and concrete instance the EMA Atlas exposes, grouped by media type. Sourced verbatim from content/artifacts/inventory.md — counts and statuses are honest."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / Catalog</p>
          <h2 className="panel__title">{totalEntries} catalogued artifacts across {sections.length} formats.</h2>
          <p className="panel__lede">
            The route reads <code>content/artifacts/inventory.md</code> at build time and groups the rows by section.
            Each entry shows its file path (linked when a route exists), word count where known, and a status pill.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{totalEntries}</span>
              <span>Total entries</span>
            </div>
            <div className="stat">
              <span className="stat__value">{shippedCount}</span>
              <span>Shipped</span>
            </div>
            <div className="stat">
              <span className="stat__value">{sections.length}</span>
              <span>Format sections</span>
            </div>
          </div>
          <div className="panel__actions">
            <Link className="chip" href="/showroom">Showroom</Link>
            <Link className="chip" href="/program">Program</Link>
            <Link className="chip" href="/parts">Parts</Link>
          </div>
        </article>
      </section>

      {sections.map((section) => (
        <section className="panel artifacts-section" key={section.heading}>
          <p className="panel__tag">Format</p>
          <h2 className="panel__title">{section.heading}</h2>
          {section.blurb ? <p className="panel__lede">{section.blurb}</p> : null}

          {section.entries.length > 0 ? (
            <ul className="research-list">
              {section.entries.map((entry, idx) => {
                const titleNode = entry.route ? (
                  <Link href={entry.route}>{entry.title}</Link>
                ) : (
                  <span>{entry.title}</span>
                );
                return (
                  <li className="research-list__item" key={`${section.heading}-${idx}-${entry.title}`}>
                    <div>
                      <h3>{titleNode}</h3>
                      {entry.filePath ? (
                        <p>
                          <code>{entry.filePath}</code>
                        </p>
                      ) : null}
                      {entry.notes ? <p>{entry.notes}</p> : null}
                      {entry.extras ? (
                        <p>
                          {Object.entries(entry.extras).map(([k, v], i, arr) => (
                            <span key={k}>
                              <strong>{k}:</strong> {v}
                              {i < arr.length - 1 ? " · " : ""}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                      <span className={statusPillClass(entry.status)}>{entry.status}</span>
                      {typeof entry.words === "number" && entry.words > 0 ? (
                        <span className="research-list__size">{entry.words.toLocaleString()} words</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {section.summary ? (
            <p className="panel__lede" style={{ marginTop: 14 }}>{section.summary}</p>
          ) : null}
        </section>
      ))}
    </SiteShell>
  );
}
