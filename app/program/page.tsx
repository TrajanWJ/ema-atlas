import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";
import { parts } from "@/lib/ema-atlas";

type Track = "brief" | "slides" | "canvas" | "diagrams" | "gleam" | "buildStep";

type PartStatus = {
  slug: string;
  brief: boolean;
  slides: boolean;
  canvas: boolean;
  diagrams: { now: boolean; threeFutures: boolean; decisions: boolean };
  gleam: boolean;
  buildStep: boolean;
};

const TRACK_LABEL: Record<Track, string> = {
  brief: "Brief",
  slides: "Slides",
  canvas: "Canvas",
  diagrams: "Diagrams (3)",
  gleam: "Gleam mapping",
  buildStep: "Build step",
};

async function fileExists(rel: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(process.cwd(), rel));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function checkPart(slug: string): Promise<PartStatus> {
  const [brief, gleam, dNow, dThree, dDecisions] = await Promise.all([
    fileExists(`content/briefs/${slug}.md`),
    fileExists(`research/parts/${slug}.md`),
    fileExists(`content/diagrams/${slug}/now.svg`),
    fileExists(`content/diagrams/${slug}/three-futures.svg`),
    fileExists(`content/diagrams/${slug}/decisions.svg`),
  ]);
  return {
    slug,
    brief,
    // /slides/[slug] and /canvas/[slug] are dynamic templates — they exist for every part.
    slides: true,
    canvas: true,
    diagrams: { now: dNow, threeFutures: dThree, decisions: dDecisions },
    gleam,
    // Build steps are not per-part — they're 6 cross-cutting docs. Mark true if ANY exists.
    buildStep: false,
  };
}

async function countBuildSteps(): Promise<number> {
  try {
    const dir = path.join(process.cwd(), "research", "build-steps");
    const entries = await fs.readdir(dir);
    return entries.filter((e) => e.toLowerCase().endsWith(".md")).length;
  } catch {
    return 0;
  }
}

// Pull the v0.0.3 build-readiness gates from EMA_V0_0_3_PREP.md.
function extractReadinessHeader(md: string): { gates: string[]; required: string[] } {
  const lines = md.split(/\r?\n/);
  const gates: string[] = [];
  const required: string[] = [];
  let inGates = false;
  let inRequired = false;
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      const heading = h[1].toLowerCase();
      inGates = heading.includes("verification gate");
      inRequired = heading.includes("required pre-build decisions");
      continue;
    }
    if (inGates) {
      const m = line.match(/^\s*\d+\.\s+(.+)$/);
      if (m) gates.push(m[1].trim());
    }
    if (inRequired) {
      const m = line.match(/^- \*\*(Q\d+)[^*]*\*\*\s*(.*)$/);
      if (m) required.push(`${m[1]} — ${m[2].trim().replace(/\.$/, "")}`);
    }
  }
  return { gates: gates.slice(0, 6), required: required.slice(0, 6) };
}

function statusPill(ok: boolean, labelOk = "shipped", labelNo = "planned") {
  return (
    <span
      className={`vapp-card__status vapp-card__status--${ok ? "shipped" : "planned"}`}
    >
      {ok ? labelOk : labelNo}
    </span>
  );
}

function diagramPill(d: PartStatus["diagrams"]) {
  const count = [d.now, d.threeFutures, d.decisions].filter(Boolean).length;
  const all = count === 3;
  const some = count > 0 && count < 3;
  const cls = all
    ? "vapp-card__status--shipped"
    : some
      ? "vapp-card__status--partial"
      : "vapp-card__status--planned";
  return <span className={`vapp-card__status ${cls}`}>{count}/3</span>;
}

export default async function ProgramPage() {
  const partStatuses = await Promise.all(parts.map((p) => checkPart(p.slug)));
  const buildStepCount = await countBuildSteps();
  const prepMd = await loadMarkdown("EMA_V0_0_3_PREP.md");
  const { gates, required } = extractReadinessHeader(prepMd);

  const partWithMeta = parts.map((p, i) => ({ part: p, status: partStatuses[i] }));

  // Track summary across all 8 parts.
  const trackSummary: Array<{ key: Track; label: string; ready: number; total: number }> = [
    { key: "brief", label: TRACK_LABEL.brief, ready: partStatuses.filter((s) => s.brief).length, total: parts.length },
    { key: "slides", label: TRACK_LABEL.slides, ready: partStatuses.filter((s) => s.slides).length, total: parts.length },
    { key: "canvas", label: TRACK_LABEL.canvas, ready: partStatuses.filter((s) => s.canvas).length, total: parts.length },
    {
      key: "diagrams",
      label: TRACK_LABEL.diagrams,
      ready: partStatuses.filter(
        (s) => s.diagrams.now && s.diagrams.threeFutures && s.diagrams.decisions
      ).length,
      total: parts.length,
    },
    { key: "gleam", label: TRACK_LABEL.gleam, ready: partStatuses.filter((s) => s.gleam).length, total: parts.length },
    { key: "buildStep", label: TRACK_LABEL.buildStep, ready: buildStepCount, total: 6 },
  ];

  return (
    <SiteShell
      eyebrow="Cross-Part Program"
      title="Program map"
      intro="One row per EMA part, one column per deliverable track. Statuses checked at build time by reading the file system. The header surfaces the v0.0.3 build-readiness pressure from EMA_V0_0_3_PREP.md."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Stage / v0.0.3 Build Readiness</p>
          <h2 className="panel__title">Pre-build decisions and verification gates from EMA_V0_0_3_PREP.md.</h2>
          <p className="panel__lede">
            v0.0.3 lands in TrajanWJ/ema (Gleam/BEAM). These priorities pin what must be true before the build starts —
            the program rows below show how the atlas-side pressure is tracking.
          </p>

          <div className="status-grid">
            <div>
              <p className="panel__label">Required pre-build decisions</p>
              <ul className="program-readiness">
                {required.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="panel__label">First verification gates</p>
              <ul className="program-readiness">
                {gates.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stat-ribbon">
            {trackSummary.map((t) => (
              <div className="stat" key={t.key}>
                <span className="stat__value">
                  {t.ready}/{t.total}
                </span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          <div className="panel__actions">
            <Link className="chip" href="/artifacts">Artifacts</Link>
            <Link className="chip" href="/showroom">Showroom</Link>
            <Link className="chip" href="/research">Research</Link>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="panel__tag">Per-part Program</p>
        <h2 className="panel__title">Eight parts × six tracks</h2>
        <p className="panel__lede">
          Each row checks file existence under <code>content/briefs/</code>, <code>content/diagrams/&lt;slug&gt;/</code>,
          and <code>research/parts/</code>. Slides and canvas use dynamic templates so they render for every part.
          Build-step coverage is shared across all parts — {buildStepCount} of 6 step specs landed.
        </p>

        <div className="program-rows">
          {partWithMeta.map(({ part, status }) => (
            <article className="program-row" key={part.slug}>
              <div className="program-row__head">
                <p className="list__eyebrow">{part.strapline}</p>
                <h3 className="list__title">
                  <Link href={`/parts/${part.slug}`}>{part.title}</Link>
                </h3>
              </div>

              <div className="program-row__tracks">
                <div className="program-row__track">
                  <span className="panel__label">Brief</span>
                  {statusPill(status.brief)}
                </div>
                <div className="program-row__track">
                  <span className="panel__label">Slides</span>
                  {statusPill(status.slides, "sketched", "planned")}
                </div>
                <div className="program-row__track">
                  <span className="panel__label">Canvas</span>
                  {statusPill(status.canvas, "sketched", "planned")}
                </div>
                <div className="program-row__track">
                  <span className="panel__label">Diagrams</span>
                  {diagramPill(status.diagrams)}
                </div>
                <div className="program-row__track">
                  <span className="panel__label">Gleam mapping</span>
                  {statusPill(status.gleam)}
                </div>
                <div className="program-row__track">
                  <span className="panel__label">Build step</span>
                  <span
                    className={`vapp-card__status vapp-card__status--${
                      buildStepCount >= 6 ? "shipped" : buildStepCount > 0 ? "partial" : "planned"
                    }`}
                  >
                    {buildStepCount}/6 (shared)
                  </span>
                </div>
              </div>

              <div className="route-links">
                <Link className="chip" href={`/parts/${part.slug}`}>Atlas</Link>
                <Link className="chip" href={`/briefs/${part.slug}`}>Brief</Link>
                <Link className="chip" href={`/slides/${part.slug}`}>Slides</Link>
                <Link className="chip" href={`/canvas/${part.slug}`}>Canvas</Link>
                {status.gleam ? (
                  <Link className="chip" href={`/research/parts--${part.slug}`}>Gleam</Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
