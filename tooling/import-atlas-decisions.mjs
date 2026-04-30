#!/usr/bin/env node
// Import durable atlas decisions into canonical `blueprint.decision.locked`
// events. One-way: atlas markdown is the human-edit surface; this script
// reads it and emits idempotent events keyed by node_id.
//
// Idempotency: scans the existing `blueprint.planner` projection's
// decisions[] for any matching `source_node` and skips if found.
//
// Usage:  node tooling/import-atlas-decisions.mjs
// Source dir: Projects/EMA/atlas/intent/decisions/*.md

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const ATLAS_DIR =
  process.env.EMA_ATLAS_DECISIONS ??
  "/Users/trajanm4air/Desktop/Projects/EMA/atlas/intent/decisions";
const ORG = process.env.EMA_ORG_ID ?? "org:01J00000000000000000000001";
const ACTOR = process.env.EMA_ACTOR_ID ?? "actor:atlas-importer";

function cli(args) {
  const out = execFileSync("node", ["apps/cli/dist/bin.js", "blueprint", ...args], {
    encoding: "utf8",
  });
  return JSON.parse(out);
}

function listExistingDecisions() {
  const result = cli(["decision", "list", "--json"]);
  return Array.isArray(result.decisions) ? result.decisions : [];
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { frontmatter: {}, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: {}, body: text };
  const fmText = text.slice(4, end);
  const body = text.slice(end + 5);
  const frontmatter = {};
  for (const line of fmText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("-")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function extractTitle(body) {
  const headingMatch = body.match(/^\s*#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return null;
}

function extractSummary(body) {
  // First non-empty paragraph after any markdown heading.
  const lines = body.split("\n");
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (line.startsWith("## Decision") || line.startsWith("## Resolution")) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.startsWith("##")) break;
      if (line.trim() || out.length > 0) out.push(line);
    }
  }
  if (out.length > 0) return out.join("\n").trim();
  // Fallback: first meaningful body paragraph.
  for (const block of body.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return body.trim();
}

function lockDecision({ nodeId, title, body }) {
  const result = cli([
    "decision",
    "lock",
    "--org",
    ORG,
    "--actor",
    ACTOR,
    "--title",
    title,
    "--body",
    body,
    "--source-node",
    nodeId,
    "--json",
  ]);
  if (result.ok !== true) {
    throw new Error(`decision lock failed for "${title}": ${JSON.stringify(result)}`);
  }
  return result.resource;
}

async function main() {
  const existing = listExistingDecisions();
  const knownSourceNodes = new Set(
    existing
      .map((d) => (d.source_node || "").toString())
      .filter((s) => s.length > 0),
  );
  console.log(`atlas-import: ${existing.length} existing decisions, ${knownSourceNodes.size} with source_node`);

  const files = readdirSync(ATLAS_DIR).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_"),
  );
  let imported = 0;
  let skipped = 0;
  for (const file of files) {
    const path = join(ATLAS_DIR, file);
    const raw = readFileSync(path, "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);
    const nodeId = frontmatter.node_id ?? `ema.intent.decision.${basename(file, ".md")}`;
    if (knownSourceNodes.has(nodeId)) {
      skipped += 1;
      console.log(`= skip (already imported): ${nodeId}`);
      continue;
    }
    const title = extractTitle(body) ?? basename(file, ".md");
    const summary = extractSummary(body) || `Imported from ${file}`;
    const id = lockDecision({ nodeId, title, body: summary });
    imported += 1;
    console.log(`+ import: ${id}  ${nodeId}  "${title}"`);
  }

  console.log("");
  console.log(
    `import-atlas-decisions: ${imported} new, ${skipped} already-present (${imported + skipped} total atlas files)`,
  );
}

main().catch((err) => {
  console.error("import-atlas-decisions failed:", err.message ?? err);
  process.exit(1);
});
