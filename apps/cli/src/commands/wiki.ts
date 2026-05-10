import { promises as fs } from "node:fs";
import path from "node:path";

import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DESKTOP_ROOT } from "../workspace-state.js";

const ATLAS_ROOT = path.join(DESKTOP_ROOT, "Projects", "EMA", "atlas");
const DOC_REF = "Projects/EMA/atlas/knowledge/ROOT-MAP.md";
const MAX_FILES = 2_500;

type WikiNote = {
  path: string;
  title: string;
  node_id: string | null;
  node_type: string | null;
  status: string | null;
  excerpt: string;
};

export async function runWiki(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === undefined || verb === "help") {
    return runHelp(args);
  }
  if (verb === "list") return runList(args);
  if (verb === "search") return runSearch(args);
  if (verb === "get" || verb === "show") return runGet(args);
  emitError(`ema wiki: unknown subcommand "${verb}" (expected: list | search | get)`);
  return 64;
}

function runHelp(args: ParsedArgs): number {
  const json = flagBool(args, "json");
  const body = {
    ok: true,
    noun: "wiki",
    status: "atlas_file_index",
    atlas_root: ATLAS_ROOT,
    commands: [
      "ema wiki list [--limit 20] [--json]",
      "ema wiki search --query <text> [--limit 10] [--json]",
      "ema wiki get --path <atlas-relative-path> [--json]",
    ],
    doc: DOC_REF,
  };
  if (json) emitJson(body);
  else {
    emitPretty("ema wiki — atlas/QMD second-brain search");
    emitPretty(`atlas_root: ${ATLAS_ROOT}`);
    emitPretty("Usage:");
    for (const command of body.commands) emitPretty(`  ${command}`);
    emitPretty(`Docs: ${DOC_REF}`);
  }
  return 0;
}

async function runList(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const limit = parseLimit(args, 30);
  const notes = (await loadNotes()).slice(0, limit);
  if (json) emitJson({ ok: true, command: "wiki list", source: "atlas_files", notes });
  else {
    emitPretty(`# wiki list  (source: atlas_files)`);
    for (const note of notes) emitPretty(`${note.path} — ${note.title}`);
  }
  return 0;
}

async function runSearch(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const query = flagString(args, "query") ?? args.positional.slice(1).join(" ");
  if (!query.trim()) {
    emitError("ema wiki search: --query is required");
    return 64;
  }
  const limit = parseLimit(args, 10);
  const q = query.toLowerCase();
  const scored = (await loadNotes())
    .map((note) => ({ note, score: scoreNote(note, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.note);
  if (json) emitJson({ ok: true, command: "wiki search", source: "atlas_files", query, notes: scored });
  else {
    emitPretty(`# wiki search "${query}"`);
    for (const note of scored) {
      emitPretty(`${note.path} — ${note.title}`);
      if (note.excerpt) emitPretty(`  ${note.excerpt}`);
    }
  }
  return 0;
}

async function runGet(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const rel = flagString(args, "path") ?? args.positional[1];
  if (!rel) {
    emitError("ema wiki get: --path is required");
    return 64;
  }
  const safePath = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const abs = path.resolve(ATLAS_ROOT, safePath);
  const rootWithSep = `${path.resolve(ATLAS_ROOT)}${path.sep}`;
  if (abs !== path.resolve(ATLAS_ROOT) && !abs.startsWith(rootWithSep)) {
    emitError("ema wiki get: path must stay inside Projects/EMA/atlas");
    return 64;
  }
  try {
    const content = await fs.readFile(abs, "utf8");
    const note = noteFromContent(safePath, content);
    if (json) emitJson({ ok: true, command: "wiki get", source: "atlas_files", note, content });
    else {
      emitPretty(`# ${note.title}`);
      emitPretty(`path: ${note.path}`);
      emitPretty("");
      emitPretty(content);
    }
    return 0;
  } catch (err) {
    emitError(`ema wiki get: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
}

async function loadNotes(): Promise<WikiNote[]> {
  const files = await walk(ATLAS_ROOT);
  const notes: WikiNote[] = [];
  for (const file of files.slice(0, MAX_FILES)) {
    const rel = path.relative(ATLAS_ROOT, file);
    try {
      const content = await fs.readFile(file, "utf8");
      notes.push(noteFromContent(rel, content));
    } catch {
      // Ignore unreadable files; atlas search is best-effort context.
    }
  }
  return notes.sort((a, b) => a.path.localeCompare(b.path));
}

async function walk(root: string): Promise<string[]> {
  const out: string[] = [];
  async function visit(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "archive") continue;
        await visit(full);
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".qmd"))) {
        out.push(full);
      }
    }
  }
  await visit(root);
  return out;
}

function noteFromContent(rel: string, content: string): WikiNote {
  const frontmatter = parseFrontmatter(content);
  const body = content.replace(/^---[\s\S]*?---\n*/m, "");
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const fallback = path.basename(rel).replace(/\.(qmd|md)$/i, "").replace(/[-_]/g, " ");
  return {
    path: rel,
    title: frontmatter.title ?? heading ?? fallback,
    node_id: frontmatter.node_id ?? frontmatter.id ?? null,
    node_type: frontmatter.node_type ?? frontmatter.type ?? null,
    status: frontmatter.status ?? null,
    excerpt: body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .slice(0, 2)
      .join(" ")
      .slice(0, 240),
  };
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/m);
  if (!match?.[1]) return {};
  const out: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (m?.[1] && m[2]) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function scoreNote(note: WikiNote, query: string): number {
  const haystack = `${note.path}\n${note.title}\n${note.node_id ?? ""}\n${note.node_type ?? ""}\n${note.excerpt}`.toLowerCase();
  let score = 0;
  for (const term of query.split(/\s+/).filter(Boolean)) {
    if (note.title.toLowerCase().includes(term)) score += 8;
    if (note.path.toLowerCase().includes(term)) score += 5;
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

function parseLimit(args: ParsedArgs, fallback: number): number {
  const raw = flagString(args, "limit");
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
