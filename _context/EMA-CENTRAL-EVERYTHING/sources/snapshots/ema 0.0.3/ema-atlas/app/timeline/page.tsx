import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

type EraStatus =
  | "doctrine-only"
  | "canonical"
  | "strategic-future"
  | "inspiration"
  | "meta"
  | "snapshot";

type TimelineEntry = {
  date: string | null;
  body: string;
};

type TimelineEra = {
  title: string;
  status: EraStatus;
  statusLabel: string;
  intro: string;
  entries: TimelineEntry[];
};

// Pulled from SYSTEM_GRAPH.md "Era / Status in v1" table.
const ERA_STATUS: Array<{
  match: RegExp;
  status: EraStatus;
  label: string;
}> = [
  { match: /place\.org/i, status: "doctrine-only", label: "doctrine-only · UX donor" },
  { match: /openclaw/i, status: "doctrine-only", label: "doctrine-only · absorbed" },
  { match: /claudeforge/i, status: "doctrine-only", label: "doctrine-only · interface contract" },
  { match: /ema daemon|ema consolidation/i, status: "canonical", label: "canonical" },
  { match: /transfer pack/i, status: "snapshot", label: "snapshot" },
  { match: /strategic future/i, status: "strategic-future", label: "strategic future" },
];

function classifyEra(title: string): { status: EraStatus; label: string } {
  for (const rule of ERA_STATUS) {
    if (rule.match.test(title)) {
      return { status: rule.status, label: rule.label };
    }
  }
  return { status: "meta", label: "meta" };
}

function parseTimeline(md: string): TimelineEra[] {
  // Split the file into ## sections, skip preamble. Drop the trailing
  // "Reading the timeline" section since it's commentary, not eras.
  const sections = md.split(/^## /m).slice(1);
  const eras: TimelineEra[] = [];

  for (const section of sections) {
    const newlineIdx = section.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = section.slice(0, newlineIdx).trim();
    if (/^reading the timeline/i.test(title)) continue;
    const rest = section.slice(newlineIdx + 1).split(/\n---/)[0];

    // Lines starting with "- " are entries; intro is leading prose.
    const lines = rest.split("\n");
    const introLines: string[] = [];
    const entries: TimelineEntry[] = [];
    let current: TimelineEntry | null = null;
    let seenEntry = false;

    for (const line of lines) {
      if (/^\s*-\s+/.test(line)) {
        if (current) entries.push(current);
        const stripped = line.replace(/^\s*-\s+/, "");
        const dateMatch = stripped.match(
          /^\*\*(~?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:\s*[–-]\s*\d{4}-\d{2}-\d{2})?)\*\*\s*[—-]?\s*(.*)/
        );
        if (dateMatch) {
          current = { date: dateMatch[1], body: dateMatch[2] };
        } else {
          current = { date: null, body: stripped };
        }
        seenEntry = true;
      } else if (/^\s+/.test(line) && current) {
        // continuation of current entry
        current.body += " " + line.trim();
      } else if (!seenEntry) {
        if (line.trim()) introLines.push(line.trim());
      }
    }
    if (current) entries.push(current);

    const { status, label } = classifyEra(title);
    eras.push({
      title,
      status,
      statusLabel: label,
      intro: introLines.join(" ").trim(),
      entries,
    });
  }

  return eras;
}

export default async function TimelinePage() {
  const md = await loadMarkdown("TIMELINE.md");
  const eras = parseTimeline(md);

  return (
    <SiteShell
      eyebrow="Lineage Spine"
      title="EMA Timeline"
      intro="Reading aid only — authoritative provenance still lives in the lineage index. Each era is doctrine-bearing in its own way: surfaces and patterns flow forward even when the code does not."
    >
      <section className="timeline">
        {eras.map((era) => (
          <article className="panel timeline__era" key={era.title}>
            <div className="timeline__erahead">
              <p className="panel__tag">Era</p>
              <span className={`qcard__status qcard__status--${era.status}`}>
                {era.statusLabel}
              </span>
            </div>
            <h2 className="panel__title">{era.title}</h2>
            {era.intro ? <p className="panel__lede">{era.intro}</p> : null}
            {era.entries.length > 0 ? (
              <ol className="timeline__list">
                {era.entries.map((entry, idx) => (
                  <li className="timeline__node" key={idx}>
                    <div className="timeline__dot" aria-hidden />
                    <div className="timeline__entry">
                      {entry.date ? (
                        <span className="timeline__date">{entry.date}</span>
                      ) : null}
                      <p className="timeline__body">{entry.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
