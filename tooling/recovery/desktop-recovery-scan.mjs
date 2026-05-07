#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";

const DESKTOP_ROOT = process.env.EMA_DESKTOP_ROOT ?? path.join(homedir(), "Desktop");
const EMA_ROOT = findRepoRoot(process.cwd()) ?? process.cwd();
const DEFAULT_SOURCE_ROOTS = [
  path.join(DESKTOP_ROOT, "Active builds"),
  path.join(DESKTOP_ROOT, "Projects"),
  path.join(DESKTOP_ROOT, "Space shared files-uploads-vDesktop-vFilesystem-root"),
].filter((candidate) => existsSync(candidate));

const PRUNE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  "coverage",
  "test-results",
  "playwright-report",
]);

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".qmd",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".gleam",
  ".erl",
  ".rs",
  ".toml",
  ".css",
]);

const KEYWORDS = [
  "agent work",
  "agent-work",
  "see agent work",
  "agent workspace",
  "swarm",
  "lane",
  "queue",
  "handoff",
  "vcalendar",
  "checkup",
  "worktree",
  "orchestrator",
  "hermes",
  "lost",
  "stale",
  "recover",
  "pending_daemon_writer",
  "control plane",
  "projection",
  "daemon",
  "companion",
];

const SOURCE_HINTS = [
  { pathPart: "EMA-0.0.5-swarm-claude", kind: "ema-swarm-worktree", target: "docs/orchestration/swarm + executable lane recovery" },
  { pathPart: "EMA-0.0.5-swarm-codex", kind: "ema-swarm-worktree", target: "docs/orchestration/swarm + executable lane recovery" },
  { pathPart: "Projects/EMA/atlas", kind: "atlas-doctrine", target: "docs/recovery + docs/orchestration + vApp specs" },
  { pathPart: "agent-workspace-vapp", kind: "vapp-sketch", target: "apps/web/src/components/apps/agent-work" },
  { pathPart: "threads-vapp", kind: "vapp-sketch", target: "apps/web/src/components/apps/threads" },
  { pathPart: "atlas-vapp", kind: "vapp-sketch", target: "apps/web/src/components/apps/wiki" },
  { pathPart: "duct-tape-onion-harness", kind: "harness-donor", target: "apps/cli/src/commands/harness.ts + tooling" },
  { pathPart: "place-companion", kind: "native-companion-donor", target: "apps/desktop/src-tauri + desktop presence" },
  { pathPart: "place.org", kind: "shell-donor", target: "apps/web/src/components/desktop" },
  { pathPart: "_cleanup-archives", kind: "pre-port-archive", target: "apps/web/src/components/apps + tests/e2e" },
  { pathPart: "lanes/", kind: "stale-lane", target: "lane.registry / docs/orchestration/lanes" },
  { pathPart: "queue/", kind: "stale-queue", target: "queue.registry / docs/orchestration/lanes" },
  { pathPart: "handoffs/", kind: "handoff-fragment", target: "handoff writer + docs/orchestration/handoffs" },
];

function parseArgs(argv) {
  const flags = new Map();
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      flags.set(body.slice(0, eq), body.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      flags.set(body, next);
      i += 1;
    } else {
      flags.set(body, true);
    }
  }
  return { flags, positional };
}

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (current !== path.dirname(current)) {
    if (existsSync(path.join(current, ".git")) && existsSync(path.join(current, "package.json"))) return current;
    current = path.dirname(current);
  }
  return null;
}

function safeRead(file) {
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.size > 750_000) return null;
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function walk(root, maxDepth, visit, depth = 0) {
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!PRUNE_DIRS.has(entry.name)) walk(full, maxDepth, visit, depth + 1);
      continue;
    }
    if (entry.isFile()) visit(full);
  }
}

function hintFor(file) {
  const normalized = file.split(path.sep).join("/");
  return SOURCE_HINTS.find((hint) => normalized.includes(hint.pathPart));
}

function classify(file, text, keywordHits) {
  const hint = hintFor(file);
  if (hint) return hint;
  if (keywordHits.some((hit) => hit.includes("pending_daemon_writer"))) {
    return { kind: "lost-work", target: "daemon writer + CLI command" };
  }
  if (keywordHits.some((hit) => hit.includes("projection"))) {
    return { kind: "projection-fragment", target: "packages/surface-core/src/projections" };
  }
  if (/\b(vapp|surface|route|panel)\b/i.test(text)) {
    return { kind: "vapp-inspiration", target: "apps/web/src/components/apps" };
  }
  return { kind: "desktop-fragment", target: "docs/recovery triage" };
}

function confidenceFor(file, keywordHits, text) {
  let score = keywordHits.length;
  if (file.includes("Projects/EMA/atlas")) score += 3;
  if (file.includes("EMA-0.0.5-swarm")) score += 3;
  if (file.includes("_cleanup-archives")) score += 2;
  if (file.includes("place-companion")) score += 2;
  if (/pending_daemon_writer|lane\.registry|queue\.registry|agent workspace|Agent Workspace/.test(text)) score += 3;
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function scanFiles(sourceRoots, maxDepth) {
  const candidates = [];
  const seen = new Set();
  for (const root of sourceRoots) {
    walk(root, maxDepth, (file) => {
      const ext = path.extname(file);
      if (!TEXT_EXTENSIONS.has(ext)) return;
      if (seen.has(file)) return;
      seen.add(file);
      const text = safeRead(file);
      if (!text) return;
      const lower = text.toLowerCase();
      const keywordHits = KEYWORDS.filter((keyword) => lower.includes(keyword));
      if (keywordHits.length === 0) return;
      const classification = classify(file, text, keywordHits);
      candidates.push({
        id: `candidate:${String(candidates.length + 1).padStart(4, "0")}`,
        donor_path: file,
        relative_to_desktop: path.relative(DESKTOP_ROOT, file),
        source_kind: classification.kind,
        suggested_target: classification.target,
        confidence: confidenceFor(file, keywordHits, text),
        keywords: keywordHits.slice(0, 8),
        status: "candidate",
      });
    });
  }
  return candidates.sort((a, b) => candidateRank(a) - candidateRank(b) || a.relative_to_desktop.localeCompare(b.relative_to_desktop));
}

function candidateRank(candidate) {
  const confidenceRank = { high: 0, medium: 100, low: 200 }[candidate.confidence] ?? 300;
  const kindRank = {
    "ema-swarm-worktree": 0,
    "atlas-doctrine": 5,
    "harness-donor": 10,
    "vapp-sketch": 15,
    "stale-lane": 20,
    "stale-queue": 25,
    "handoff-fragment": 30,
    "native-companion-donor": 35,
    "pre-port-archive": 40,
    "shell-donor": 50,
    "projection-fragment": 60,
    "vapp-inspiration": 70,
    "lost-work": 80,
    "desktop-fragment": 90,
  }[candidate.source_kind] ?? 95;
  return confidenceRank + kindRank;
}

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function scanWorktrees() {
  const porcelain = git(["worktree", "list", "--porcelain"], EMA_ROOT);
  const worktrees = [];
  let current = null;
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) worktrees.push(current);
      current = { path: line.slice("worktree ".length), head: null, branch: null, status: [] };
    } else if (current && line.startsWith("HEAD ")) {
      current.head = line.slice("HEAD ".length);
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length);
    }
  }
  if (current) worktrees.push(current);
  return worktrees.map((worktree) => ({
    ...worktree,
    status: git(["status", "--short"], worktree.path).split("\n").filter(Boolean),
  }));
}

function summarize(candidates, worktrees) {
  const byKind = {};
  const byConfidence = {};
  for (const candidate of candidates) {
    byKind[candidate.source_kind] = (byKind[candidate.source_kind] ?? 0) + 1;
    byConfidence[candidate.confidence] = (byConfidence[candidate.confidence] ?? 0) + 1;
  }
  return {
    candidates: candidates.length,
    high_confidence: byConfidence.high ?? 0,
    medium_confidence: byConfidence.medium ?? 0,
    low_confidence: byConfidence.low ?? 0,
    dirty_worktrees: worktrees.filter((worktree) => worktree.status.length > 0).length,
    by_kind: byKind,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const json = args.flags.get("json") === true || args.flags.get("json") === "true";
  const maxDepth = Number.parseInt(String(args.flags.get("max-depth") ?? "8"), 10);
  const limit = Number.parseInt(String(args.flags.get("limit") ?? "250"), 10);
  const kindFilter = stringSet(args.flags.get("kind"));
  const confidenceFilter = stringSet(args.flags.get("confidence"));
  const sourceRoots = args.flags.has("source")
    ? String(args.flags.get("source")).split(",").map((item) => path.resolve(item))
    : DEFAULT_SOURCE_ROOTS;
  const allCandidates = scanFiles(sourceRoots, Number.isFinite(maxDepth) ? maxDepth : 8)
    .filter((candidate) => kindFilter.size === 0 || kindFilter.has(candidate.source_kind))
    .filter((candidate) => confidenceFilter.size === 0 || confidenceFilter.has(candidate.confidence));
  const candidates = allCandidates.slice(0, Number.isFinite(limit) ? limit : 250);
  const worktrees = scanWorktrees();
  const payload = {
    ok: true,
    command: "desktop-recovery-scan",
    generated_at: new Date().toISOString(),
    desktop_root: DESKTOP_ROOT,
    ema_root: EMA_ROOT,
    source_roots: sourceRoots,
    summary: summarize(candidates, worktrees),
    worktrees,
    candidates,
    policy: {
      donor_projects: "read-only",
      mutation_target: EMA_ROOT,
      next_step: "promote accepted candidates into docs/recovery/desktop-wide-recovery-ledger.md before porting code",
    },
  };
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  process.stdout.write(`# EMA desktop recovery scan\n`);
  process.stdout.write(`sources: ${sourceRoots.length}\n`);
  process.stdout.write(`candidates: ${payload.summary.candidates} (${payload.summary.high_confidence} high)\n`);
  process.stdout.write(`dirty worktrees: ${payload.summary.dirty_worktrees}\n\n`);
  for (const candidate of candidates.slice(0, 40)) {
    process.stdout.write(`- [${candidate.confidence}] ${candidate.source_kind}: ${candidate.relative_to_desktop}\n`);
  }
}

main();

function stringSet(value) {
  if (!value) return new Set();
  return new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean));
}
