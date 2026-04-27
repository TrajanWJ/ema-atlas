import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * GET /api/graph
 *
 * Serves the contents of `graph.json` (the system graph manifest) as
 * application/json so external tools and future atlas pages can fetch the
 * graph without bundling it into their JS payload.
 *
 * The graph file is part of the repo and only changes between commits, so we
 * advertise a long browser cache and a long stale-while-revalidate window.
 */
// Read graph.json at request time so a regenerated graph is picked up
// without a rebuild. Cache-Control still lets browsers / CDNs reuse
// the response for several minutes.
export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), "graph.json");
  const raw = await fs.readFile(filePath, "utf8");

  // Parse + re-serialize so we fail fast if the file is malformed and so the
  // body is normalized JSON regardless of source whitespace.
  const data = JSON.parse(raw);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
