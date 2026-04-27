import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

type QuestionStatus = "open" | "parked" | "resolved";

type ParsedQuestion = {
  number: string;
  title: string;
  status: QuestionStatus;
  statusRaw: string;
  blastRadius: string;
  surfaces: string[];
  body: string;
};

const GH_BASE =
  "https://github.com/tawj/ema-atlas/blob/main/";

function parseStatus(raw: string): QuestionStatus {
  const lower = raw.toLowerCase();
  if (lower.includes("resolved")) return "resolved";
  if (lower.includes("parked")) return "parked";
  return "open";
}

function parseQuestions(md: string): ParsedQuestion[] {
  // Split on "## Q" headers (Q1-Q10 etc.). Operating-rule trailing section is
  // dropped by filtering on the Q-prefix.
  const sections = md.split(/^## /m).slice(1);
  const questions: ParsedQuestion[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^(Q\d+)\s*[—-]\s*(.+?)\n/);
    if (!headerMatch) continue;
    const number = headerMatch[1];
    const title = headerMatch[2].trim();
    const body = section.slice(headerMatch[0].length);

    const statusMatch = body.match(/\*\*Status:\*\*\s*([^\n]+)/);
    const statusRaw = statusMatch ? statusMatch[1].trim() : "open";

    const blastMatch = body.match(
      /\*\*Blast radius:\*\*\s*([\s\S]+?)(?=\n- \*\*|\n\n|$)/
    );
    const blastRadius = blastMatch
      ? blastMatch[1].replace(/\s+/g, " ").trim()
      : "";

    const surfacesMatch = body.match(
      /\*\*Where it surfaces:\*\*\s*\n([\s\S]+?)(?=\n- \*\*|\n## |\n---|$)/
    );
    const surfaces: string[] = [];
    if (surfacesMatch) {
      const lines = surfacesMatch[1].split("\n");
      for (const line of lines) {
        const m = line.match(/^\s*-\s*`?([^`\n]+?)`?\s*$/);
        if (m) surfaces.push(m[1].trim());
      }
    }

    questions.push({
      number,
      title,
      status: parseStatus(statusRaw),
      statusRaw,
      blastRadius,
      surfaces,
      body,
    });
  }

  return questions;
}

function surfaceHref(surface: string): string | null {
  const edgeMatch = surface.match(/^(graph\/edges\/[a-z0-9-_]+\.md)/i);
  if (edgeMatch) return GH_BASE + edgeMatch[1];
  return null;
}

export default async function QuestionsPage() {
  const md = await loadMarkdown("OPEN_QUESTIONS.md");
  const questions = parseQuestions(md);

  return (
    <SiteShell
      eyebrow="Open Decisions"
      title="10 open decisions, three futures each"
      intro="The single canonical list of unresolved EMA decisions. Each card carries its status, blast radius, and the docs where the question still surfaces. Decisions land elsewhere — this page tracks the pressure."
    >
      <section className="section-grid">
        <article className="panel panel--hero">
          <p className="panel__tag">Decision Field / Stage Now</p>
          <h2 className="panel__title">Hold the questions open until the answers earn their place.</h2>
          <p className="panel__lede">
            Every question below has a planned futures-board view: three
            competing answers staged side-by-side instead of pretending one
            already won. The board will live at <code>/futures-board</code>.
          </p>
          <div className="panel__actions">
            <span className="chip" aria-disabled>
              Futures Board (planned)
            </span>
            <Link className="chip" href="/parts">
              See Parts
            </Link>
            <Link className="chip" href="/timeline">
              Timeline
            </Link>
          </div>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">{questions.length}</span>
              <span>Open questions tracked</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                {questions.filter((q) => q.status === "open").length}
              </span>
              <span>Currently open</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                {questions.filter((q) => q.status === "parked").length}
              </span>
              <span>Parked</span>
            </div>
          </div>
        </article>
      </section>

      <section className="card-grid">
        {questions.map((q) => (
          <article className="panel qcard" key={q.number}>
            <div className="qcard__head">
              <span className="qcard__badge">{q.number}</span>
              <span className={`qcard__status qcard__status--${q.status}`}>
                {q.status}
              </span>
            </div>
            <h3 className="list__title">{q.title}</h3>
            {q.blastRadius ? (
              <div>
                <span className="panel__label">Blast Radius</span>
                <p className="list__copy">{q.blastRadius}</p>
              </div>
            ) : null}
            {q.surfaces.length > 0 ? (
              <div>
                <span className="panel__label">Where it surfaces</span>
                <ul className="inline-list">
                  {q.surfaces.map((surface) => {
                    const href = surfaceHref(surface);
                    return (
                      <li key={surface}>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {surface}
                          </a>
                        ) : (
                          surface
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
