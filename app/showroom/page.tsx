import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

type ShippedItem = {
  title: string;
  format: string;
  filePath?: string;
  route?: string;
  words?: number;
  diagramSlug?: string;
  diagramName?: string;
  svg?: string;
};

function stripMd(cell: string): string {
  return cell
    .trim()
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .trim();
}

function extractInline(cell: string, re: RegExp): string | undefined {
  const m = cell.match(re);
  return m ? m[1] : undefined;
}

type Section = {
  heading: string;
  headers: string[];
  rows: string[][];
};

function parseSections(md: string): Section[] {
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let currentHeading = "";
  let headers: string[] = [];
  let rows: string[][] = [];
  let inTable = false;

  const flush = () => {
    if (currentHeading && headers.length > 0) {
      sections.push({ heading: currentHeading, headers: [...headers], rows: [...rows] });
    }
    headers = [];
    rows = [];
    inTable = false;
  };

  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      flush();
      currentHeading = h[1].trim();
      continue;
    }
    const trimmed = line.trim();
    const isTable = /^\|/.test(trimmed);
    const isSep = /^\|[\s\-:|]+\|$/.test(trimmed);
    if (isTable) {
      const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      if (!inTable) {
        headers = cells;
        inTable = true;
      } else if (!isSep) {
        rows.push(cells);
      }
    } else if (inTable && !trimmed) {
      // table ended; keep section heading + collected rows
    }
  }
  flush();
  return sections;
}

async function readSvgSafe(slug: string, name: string): Promise<string | undefined> {
  const abs = path.join(process.cwd(), "content", "diagrams", slug, `${name}.svg`);
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return undefined;
    let svg = await fs.readFile(abs, "utf8");
    // Strip XML prolog so it inlines cleanly inside HTML.
    svg = svg.replace(/^<\?xml[^?]*\?>\s*/i, "").replace(/^<!DOCTYPE[^>]*>\s*/i, "");
    return svg;
  } catch {
    return undefined;
  }
}

async function collectShipped(md: string): Promise<ShippedItem[]> {
  const sections = parseSections(md);
  const items: ShippedItem[] = [];

  for (const section of sections) {
    const lower = section.headers.map((h) => h.toLowerCase());
    const idx = (name: string) => lower.indexOf(name);
    const statusIdx = idx("status");
    const slugIdx = idx("slug") >= 0 ? idx("slug") : idx("id");
    const titleIdx = idx("title");
    const partIdx = idx("part");
    const fileIdxAll = idx("file path") >= 0 ? idx("file path") : idx("file");
    const routeIdx = idx("route");
    const wordsIdx = idx("words");

    // Special handling for the diagrams table: status lives across multiple cols.
    const isDiagramSection = /diagram/i.test(section.heading);

    for (const row of section.rows) {
      if (isDiagramSection) {
        const slug = stripMd(row[partIdx >= 0 ? partIdx : 0] ?? "");
        if (!slug) continue;
        for (let c = 0; c < section.headers.length; c++) {
          if (c === partIdx) continue;
          const header = section.headers[c];
          const cell = row[c] ?? "";
          if (!/shipped|rendered/i.test(cell)) continue;
          // header looks like "now (mmd / svg)" — extract the bare diagram name
          const nameMatch = header.match(/^([\w-]+)/);
          const diagramName = nameMatch ? nameMatch[1] : header.trim();
          const svg = await readSvgSafe(slug, diagramName);
          items.push({
            title: `${slug} · ${diagramName}`,
            format: "Mermaid diagram",
            filePath: `content/diagrams/${slug}/${diagramName}.svg`,
            route: `/canvas/${slug}`,
            diagramSlug: slug,
            diagramName,
            svg,
          });
        }
        continue;
      }

      const statusRaw = statusIdx >= 0 ? stripMd(row[statusIdx] ?? "") : "";
      if (!/shipped/i.test(statusRaw)) continue;

      const titleRaw =
        (titleIdx >= 0 ? row[titleIdx] : undefined) ??
        (slugIdx >= 0 ? row[slugIdx] : undefined) ??
        row[0] ??
        "";
      const slugTitle = slugIdx >= 0 ? stripMd(row[slugIdx] ?? "") : "";
      const title = stripMd(titleRaw) || slugTitle;
      if (!title) continue;

      const filePath =
        fileIdxAll >= 0 ? extractInline(row[fileIdxAll] ?? "", /`([^`]+)`/) : undefined;
      const route =
        routeIdx >= 0 ? extractInline(row[routeIdx] ?? "", /`(\/[^`]+)`/) : undefined;
      const wordsCell = wordsIdx >= 0 ? stripMd(row[wordsIdx] ?? "") : "";
      const wordsNum = wordsCell ? Number(wordsCell.replace(/[^\d]/g, "")) : NaN;

      items.push({
        title,
        format: section.heading,
        filePath,
        route,
        words: Number.isFinite(wordsNum) && wordsNum > 0 ? wordsNum : undefined,
      });
    }
  }

  return items;
}

export default async function ShowroomPage() {
  const md = await loadMarkdown("content/artifacts/inventory.md");
  const shipped = await collectShipped(md);

  const formats = Array.from(new Set(shipped.map((i) => i.format)));
  const diagramCount = shipped.filter((i) => i.svg).length;

  return (
    <SiteShell
      eyebrow="Wall of Deliverables"
      title="Showroom"
      intro="A gallery wall of every shipped artifact in the EMA Atlas: briefs, diagrams, futures, decisions, and the routes that render them. Diagrams render their inline SVG previews at build time."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / Showroom</p>
          <h2 className="panel__title">{shipped.length} shipped artifacts. {diagramCount} diagrams previewed inline.</h2>
          <p className="panel__lede">
            Filtered from <code>content/artifacts/inventory.md</code> — only entries marked <code>shipped</code> (or
            <code> rendered</code> for SVG diagrams) appear here. Use this route to walk EMA as a finished thing, even
            while the rest of the system is still in motion.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{shipped.length}</span>
              <span>Shipped items</span>
            </div>
            <div className="stat">
              <span className="stat__value">{formats.length}</span>
              <span>Formats represented</span>
            </div>
            <div className="stat">
              <span className="stat__value">{diagramCount}</span>
              <span>Inline SVGs</span>
            </div>
          </div>
          <div className="panel__actions">
            <Link className="chip" href="/artifacts">Full inventory</Link>
            <Link className="chip" href="/program">Program</Link>
            <Link className="chip" href="/parts">Parts</Link>
          </div>
        </article>
      </section>

      <section className="showroom-grid">
        {shipped.map((item, idx) => (
          <article className="panel showroom-card" key={`${item.format}-${idx}-${item.title}`}>
            <div className="showroom-card__head">
              <span className="vapp-card__status vapp-card__status--shipped">{item.format}</span>
            </div>
            <h3 className="list__title showroom-card__title">{item.title}</h3>
            {item.svg ? (
              <div
                className="showroom-card__svg"
                dangerouslySetInnerHTML={{ __html: item.svg }}
              />
            ) : null}
            {item.filePath ? (
              <p className="showroom-card__path"><code>{item.filePath}</code></p>
            ) : null}
            {typeof item.words === "number" ? (
              <p className="showroom-card__meta">{item.words.toLocaleString()} words</p>
            ) : null}
            {item.route ? (
              <div className="route-links">
                <Link className="chip" href={item.route}>Open route</Link>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
