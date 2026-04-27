import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

const GH_GLEAM_NOTES =
  "https://github.com/tawj/ema-atlas/blob/main/GLEAM_NOTES.md";

type ResearchFile = {
  /** path relative to the research/ root, e.g. "parts/authority-control-plane.md" */
  rel: string;
  /** flattened slug for the route, e.g. "parts--authority-control-plane" */
  slug: string;
  /** short display name (basename minus .md) */
  name: string;
  /** byte size from fs.stat */
  size: number;
  /** first non-heading paragraph, trimmed to one line */
  summary: string;
};

type Group = {
  key: "top" | "parts" | "raw";
  label: string;
  blurb: string;
  files: ResearchFile[];
};

function relToSlug(rel: string): string {
  return rel.replace(/\.md$/i, "").split("/").join("--");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extractSummary(md: string): string {
  // First non-blank, non-heading, non-blockquote, non-list paragraph line.
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
    if (line.startsWith("|")) continue; // table
    if (line.startsWith("```")) continue;
    buf.push(line);
    // first paragraph only — break on next blank
    // (handled by the early-break above)
  }
  const para = buf.join(" ").replace(/\s+/g, " ").trim();
  if (!para) return "(no summary available yet)";
  return para.length > 220 ? para.slice(0, 217).trimEnd() + "..." : para;
}

async function readDirSafe(abs: string): Promise<string[]> {
  try {
    return await fs.readdir(abs);
  } catch {
    return [];
  }
}

async function loadResearchFile(
  researchRoot: string,
  rel: string
): Promise<ResearchFile | null> {
  const abs = path.join(researchRoot, rel);
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return null;
    const md = await loadMarkdown(path.join("research", rel));
    const name = path.basename(rel).replace(/\.md$/i, "");
    return {
      rel,
      slug: relToSlug(rel),
      name,
      size: stat.size,
      summary: extractSummary(md),
    };
  } catch {
    return null;
  }
}

async function loadResearchTree(): Promise<{ groups: Group[]; total: number }> {
  const researchRoot = path.join(process.cwd(), "research");

  const top = await readDirSafe(researchRoot);
  const topFiles: ResearchFile[] = [];
  const partsFiles: ResearchFile[] = [];
  const rawFiles: ResearchFile[] = [];

  for (const entry of top) {
    if (entry.startsWith(".")) continue;
    const abs = path.join(researchRoot, entry);
    let stat;
    try {
      stat = await fs.stat(abs);
    } catch {
      continue;
    }
    if (stat.isFile() && entry.toLowerCase().endsWith(".md")) {
      const f = await loadResearchFile(researchRoot, entry);
      if (f) topFiles.push(f);
    }
  }

  const partsDir = await readDirSafe(path.join(researchRoot, "parts"));
  for (const entry of partsDir) {
    if (!entry.toLowerCase().endsWith(".md")) continue;
    const f = await loadResearchFile(researchRoot, path.join("parts", entry));
    if (f) partsFiles.push(f);
  }

  const rawDir = await readDirSafe(path.join(researchRoot, "raw"));
  for (const entry of rawDir) {
    if (!entry.toLowerCase().endsWith(".md")) continue;
    const f = await loadResearchFile(researchRoot, path.join("raw", entry));
    if (f) rawFiles.push(f);
  }

  const groups: Group[] = [
    {
      key: "top",
      label: "Top-level docs",
      blurb:
        "Cross-cutting research: language fit, collab-plane survey, and other system-wide notes that don't belong to a single Part.",
      files: topFiles.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      key: "parts",
      label: "Per-part mappings",
      blurb:
        "One Gleam mapping per EMA Part: type sketches, actor sketches, supervisor fragments. The bridge from doctrine to code.",
      files: partsFiles.sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      key: "raw",
      label: "Raw fetches",
      blurb:
        "Unedited web fetches and reference dumps the wave-3 subagents collected. Cited from the curated docs above.",
      files: rawFiles.sort((a, b) => a.name.localeCompare(b.name)),
    },
  ];

  const total = topFiles.length + partsFiles.length + rawFiles.length;
  return { groups, total };
}

export default async function ResearchPage() {
  const { groups, total } = await loadResearchTree();

  return (
    <SiteShell
      eyebrow="Wave-3 Research"
      title="Gleam / BEAM research field"
      intro="Research outputs for EMA v0.0.3: language fit, per-part Gleam mappings, collab-plane substrate options, and the raw fetches behind them. Wave-3 subagents may still be writing — check back as files land."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / Wave 3</p>
          <h2 className="panel__title">
            The research dir is where doctrine becomes type signatures.
          </h2>
          <p className="panel__lede">
            Three subagents are writing concurrently. This route reads the
            directory live at request time and surfaces a one-line summary
            per file. Framing lives in <code>GLEAM_NOTES.md</code>.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{total}</span>
              <span>Research files staged</span>
            </div>
            {groups.map((g) => (
              <div className="stat" key={g.key}>
                <span className="stat__value">{g.files.length}</span>
                <span>{g.label}</span>
              </div>
            ))}
          </div>
          <div className="panel__actions">
            <a className="chip" href={GH_GLEAM_NOTES} target="_blank" rel="noreferrer">
              GLEAM_NOTES
            </a>
            <Link className="chip" href="/parts">
              Parts
            </Link>
            <Link className="chip" href="/questions">
              Open Questions
            </Link>
          </div>
        </article>
      </section>

      {total === 0 ? (
        <section className="panel">
          <p className="panel__tag">Empty State</p>
          <h2 className="panel__title">No research has landed yet.</h2>
          <p className="panel__lede">
            The <code>research/</code> directory is either missing or empty.
            That&apos;s expected pre-wave-3. Read{" "}
            <a href={GH_GLEAM_NOTES} target="_blank" rel="noreferrer">
              GLEAM_NOTES.md
            </a>{" "}
            for the framing — what the directory will hold, what each
            subagent owns, and how landed files cross-reference back into
            the atlas.
          </p>
        </section>
      ) : (
        groups.map((group) =>
          group.files.length === 0 ? null : (
            <section className="panel" key={group.key}>
              <p className="panel__tag">{group.label}</p>
              <h2 className="panel__title">{group.files.length} file{group.files.length === 1 ? "" : "s"}</h2>
              <p className="panel__lede">{group.blurb}</p>
              <ul className="research-list">
                {group.files.map((file) => (
                  <li className="research-list__item" key={file.slug}>
                    <div>
                      <h3>
                        <Link href={`/research/${file.slug}`}>{file.name}</Link>
                      </h3>
                      <p>{file.summary}</p>
                    </div>
                    <span className="research-list__size">{formatSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        )
      )}
    </SiteShell>
  );
}
