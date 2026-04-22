import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * GET /api/graph/[topic]
 *
 * Returns a single topic's slice of the system graph by parsing the matching
 * `graph/edges/<topic>.md` file at request time. The `topic` path segment must
 * match a markdown filename in `graph/edges/` (without the `.md` extension).
 *
 * Response shape:
 *   {
 *     topic: string,
 *     rule: string | null,
 *     primary_nodes: string[],
 *     secondary_nodes: string[],
 *     cross_references: string[],
 *   }
 */

// Read filesystem at request time so edits to `graph/edges/*.md` show up
// without a rebuild. The Cache-Control header lets edge/CDN caches
// short-circuit repeat hits.
export const dynamic = "force-dynamic";

const TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

type TopicSlice = {
  topic: string;
  rule: string | null;
  primary_nodes: string[];
  secondary_nodes: string[];
  cross_references: string[];
};

/**
 * Parse the edge markdown into a structured slice. Edge files follow a
 * stable shape: a `**Rule:**` paragraph followed by `## Primary`,
 * `## Secondary`, and `## Cross-references` sections of bulleted list items.
 * Any section may be absent; we default to empty arrays / null.
 */
function parseEdgeMarkdown(topic: string, md: string): TopicSlice {
  const lines = md.split(/\r?\n/);

  let rule: string | null = null;
  const sections: Record<string, string[]> = {
    primary: [],
    secondary: [],
    "cross-references": [],
  };

  let currentSection: keyof typeof sections | null = null;
  const ruleParts: string[] = [];
  let inRule = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Section header.
    const headerMatch = /^##\s+(.+?)\s*$/.exec(line);
    if (headerMatch) {
      const name = headerMatch[1].toLowerCase();
      if (name in sections) {
        currentSection = name as keyof typeof sections;
      } else {
        currentSection = null;
      }
      inRule = false;
      continue;
    }

    // Rule paragraph: starts with `**Rule:**` and continues until a blank
    // line or the next header.
    const ruleStart = /^\*\*Rule:\*\*\s*(.*)$/.exec(line);
    if (ruleStart) {
      inRule = true;
      ruleParts.length = 0;
      if (ruleStart[1]) ruleParts.push(ruleStart[1]);
      continue;
    }
    if (inRule) {
      if (line.trim() === "") {
        inRule = false;
        rule = ruleParts.join(" ").replace(/\s+/g, " ").trim() || null;
        continue;
      }
      ruleParts.push(line.trim());
      continue;
    }

    // Bulleted list item inside a tracked section.
    if (currentSection) {
      const bullet = /^[-*]\s+(.+)$/.exec(line);
      if (bullet) {
        sections[currentSection].push(bullet[1].trim());
        continue;
      }
      // Continuation line for the previous bullet (indented). Append to last.
      const cont = /^\s{2,}(.+)$/.exec(raw);
      if (cont && sections[currentSection].length > 0) {
        const arr = sections[currentSection];
        arr[arr.length - 1] = `${arr[arr.length - 1]} ${cont[1].trim()}`;
      }
    }
  }

  // Flush a trailing rule with no blank-line terminator.
  if (inRule && ruleParts.length > 0 && rule === null) {
    rule = ruleParts.join(" ").replace(/\s+/g, " ").trim() || null;
  }

  return {
    topic,
    rule,
    primary_nodes: sections.primary,
    secondary_nodes: sections.secondary,
    cross_references: sections["cross-references"],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;

  // Defensive validation: reject anything that isn't a plain slug. This
  // prevents path traversal regardless of platform path semantics.
  if (!TOPIC_PATTERN.test(topic)) {
    return NextResponse.json(
      { error: "invalid_topic", topic },
      { status: 400 },
    );
  }

  const filePath = path.join(process.cwd(), "graph", "edges", `${topic}.md`);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return NextResponse.json(
      { error: "topic_not_found", topic },
      { status: 404 },
    );
  }

  const slice = parseEdgeMarkdown(topic, raw);

  return NextResponse.json(slice, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
