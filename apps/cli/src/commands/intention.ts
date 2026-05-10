import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DESKTOP_ROOT } from "../workspace-state.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { runQueue } from "./queue.js";

type SourceType =
  | "codex_session"
  | "codex_history"
  | "codex_memory"
  | "claude_project"
  | "ema_doc"
  | "donor_project"
  | "proslync_repo";

type SourceFamily = "proslync" | "ema" | "chronicle" | "duct_tape" | "session_manager" | "general";
type Destination = "proslync_queue" | "ema_queue" | "doc_only" | "duplicate";
type ReviewState = "new" | "accepted" | "rejected" | "deferred";

type IntentionSource = {
  path: string;
  source_type: SourceType;
  source_family: SourceFamily;
  project_hint: string | null;
};

export type IntentionCard = {
  id: string;
  title: string;
  raw_text: string;
  tags: string[];
  confidence: number;
  review_state: ReviewState;
  recommended_destination: Destination;
  evidence_ref: string;
  source_path: string;
  source_type: SourceType;
  source_family: SourceFamily;
  project_hint: string | null;
  occurred_at: string | null;
  role: string | null;
};

type IntentionProjection = {
  ok: true;
  command: "intention.projection";
  source: "ema_intention_cli";
  authority: "file_backed_review_projection";
  generated_at: string;
  project: string | null;
  stats: {
    sources_seen: number;
    records_parsed: number;
    candidate_intents: number;
    proslync_relevant: number;
    ema_relevant: number;
    lost_followups: number;
    duplicates_skipped: number;
  };
  top_tags: Array<{ tag: string; count: number }>;
  intents: IntentionCard[];
  recommended_queue: IntentionCard[];
};

type IntentionReview = {
  intent_id: string;
  state: ReviewState;
  reviewer: string;
  reason: string;
  reviewed_at: string;
};

const STORE_ROOT = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "intention-backfeed");
const REVIEWS_PATH = join(STORE_ROOT, "reviews.json");
const DEFAULT_PROJECT = "proslync-app-ios-final";

export async function runIntention(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "projection";
  if (verb === "help" || flagBool(args, "help") || args.flags.h === true) {
    printHelp();
    return 0;
  }

  if (verb === "harvest") return harvest(args);
  if (verb === "projection") return projection(args);
  if (verb === "list") return list(args);
  if (verb === "show") return show(args);
  if (verb === "backfeed") return backfeed(args);
  if (verb === "accept") return reviewIntent(args, "accepted");
  if (verb === "reject") return reviewIntent(args, "rejected");
  if (verb === "defer") return reviewIntent(args, "deferred");

  emitError(`ema intention: unknown subcommand "${verb}"`);
  emitError("Usage: ema intention [harvest|projection|list|show|accept|reject|defer|backfeed] [--project <name>] [--json]");
  return 64;
}

export async function loadIntentionProjection(args: ParsedArgs): Promise<IntentionProjection> {
  const project = await projectName(args);
  const stored = readStoredProjection(project);
  return applyReviews(stored ?? emptyProjection(project));
}

async function harvest(args: ParsedArgs): Promise<number> {
  const project = await projectName(args);
  const maxSources = parsePositiveInt(flagString(args, "max-sources"), 100);
  const maxRecordsPerSource = parsePositiveInt(flagString(args, "max-records-per-source"), 500);
  const sources = discoverSources(project).slice(0, maxSources);
  const { intents, recordsParsed, duplicatesSkipped } = parseSources(sources, maxRecordsPerSource);
  const projection = buildProjection(project, sources.length, recordsParsed, duplicatesSkipped, intents);
  writeStoredProjection(project, projection);
  const reviewedProjection = applyReviews(projection);
  emit(args, reviewedProjection, () => {
    emitPretty(`harvested ${reviewedProjection.stats.candidate_intents} candidate intentions`);
    emitPretty(`sources: ${reviewedProjection.stats.sources_seen}`);
    emitPretty(`proslync: ${reviewedProjection.stats.proslync_relevant}`);
    emitPretty(`lost followups: ${reviewedProjection.stats.lost_followups}`);
  });
  return 0;
}

async function projection(args: ParsedArgs): Promise<number> {
  const value = await loadIntentionProjection(args);
  emit(args, value, () => printProjection(value));
  return 0;
}

async function list(args: ParsedArgs): Promise<number> {
  const value = await loadIntentionProjection(args);
  const tag = flagString(args, "tag");
  const state = flagString(args, "state") as ReviewState | undefined;
  const items = value.intents.filter((intent) => {
    if (tag && !intent.tags.includes(tag)) return false;
    if (state && intent.review_state !== state) return false;
    return true;
  });
  const payload = { ...value, command: "intention.list" as const, intents: items };
  emit(args, payload, () => {
    if (items.length === 0) {
      emitPretty("No harvested intentions match.");
      return;
    }
    for (const intent of items) {
      emitPretty(`${intent.id} [${intent.review_state}] ${intent.title}`);
      emitPretty(`  tags: ${intent.tags.join(", ") || "(none)"}`);
      emitPretty(`  destination: ${intent.recommended_destination}`);
      emitPretty(`  evidence: ${intent.evidence_ref}`);
    }
  });
  return 0;
}

async function show(args: ParsedArgs): Promise<number> {
  const id = flagString(args, "intent");
  if (!id) {
    emitError("ema intention show: --intent is required");
    return 64;
  }
  const value = await loadIntentionProjection(args);
  const found = findIntent(value, id) ?? findIntentAcrossStore(id);
  const intent = found?.intent ?? null;
  emit(args, { ok: intent != null, command: "intention.show", intent }, () => {
    if (!intent) emitPretty(`intent not found: ${id}`);
    else emitPretty(JSON.stringify(intent, null, 2));
  });
  return intent ? 0 : 1;
}

async function backfeed(args: ParsedArgs): Promise<number> {
  const id = flagString(args, "intent");
  if (!id) {
    emitError("ema intention backfeed: --intent is required");
    return 64;
  }
  const destination = flagString(args, "destination") ?? "queue";
  if (destination !== "queue") {
    emitError("ema intention backfeed: only --destination queue is supported in this slice");
    return 64;
  }

  const scopedProjection = await loadIntentionProjection(args);
  const found = findIntent(scopedProjection, id) ?? findIntentAcrossStore(id);
  if (!found) {
    emitError(`ema intention backfeed: intent not found: ${id}`);
    return 1;
  }
  const { projection: value, intent } = found;

  const targetProject = targetProjectForIntent(value.project ?? DEFAULT_PROJECT, intent);
  const queueCommand = queueAddCommand(targetProject, intent);
  if (flagBool(args, "dry-run")) {
    emit(args, { ok: true, command: "intention.backfeed", mode: "dry_run", target_project: targetProject, queue_command: queueCommand, intent }, () => {
      emitPretty(queueCommand.join(" "));
    });
    return 0;
  }

  if (flagString(args, "approve") !== "reviewed") {
    emitError("ema intention backfeed: non-dry-run requires --approve reviewed");
    return 64;
  }
  if (intent.review_state !== "accepted") {
    emitError("ema intention backfeed: non-dry-run requires an accepted review state");
    return 64;
  }

  return runQueue({
    positional: ["add"],
    flags: {
      ...args.flags,
      project: targetProject,
      title: intent.title,
      why: `${intent.raw_text.slice(0, 400)} Evidence: ${intent.evidence_ref}`,
      "done-when": `Reviewed intention is either shipped, rejected, or merged into the current project plan. Source: ${intent.id}`,
      source: intent.evidence_ref,
    },
  });
}

async function reviewIntent(args: ParsedArgs, state: Exclude<ReviewState, "new">): Promise<number> {
  const id = flagString(args, "intent");
  if (!id) {
    emitError(`ema intention ${state}: --intent is required`);
    return 64;
  }
  const reason = flagString(args, "reason") ?? "reviewed in cockpit";
  const reviewer = flagString(args, "reviewer") ?? "actor:trajan";
  const scopedProjection = await loadIntentionProjection(args);
  const found = findIntent(scopedProjection, id) ?? findIntentAcrossStore(id);
  if (!found) {
    emitError(`ema intention ${state}: intent not found: ${id}`);
    return 1;
  }

  const review: IntentionReview = {
    intent_id: id,
    state,
    reviewer,
    reason,
    reviewed_at: new Date().toISOString(),
  };
  const reviews = readReviews().filter((item) => item.intent_id !== id);
  writeReviews([...reviews, review]);
  const reviewedProjection = applyReviews(found.projection);
  const reviewedIntent = findIntent(reviewedProjection, id)?.intent ?? { ...found.intent, review_state: state };
  emit(args, { ok: true, command: `intention.${state}`, review, intent: reviewedIntent }, () => {
    emitPretty(`${id} -> ${state}`);
  });
  return 0;
}

function targetProjectForIntent(fallbackProject: string, intent: IntentionCard): string {
  if (intent.recommended_destination === "ema_queue") return intent.project_hint ?? "EMA";
  if (intent.recommended_destination === "proslync_queue") return intent.project_hint ?? fallbackProject;
  return intent.project_hint ?? fallbackProject;
}

function printHelp(): void {
  emitPretty("ema intention - session/history intention backfeed");
  emitPretty("");
  emitPretty("Usage:");
  emitPretty("  ema intention harvest --project proslync-app-ios-final --max-sources 100 [--json]");
  emitPretty("  ema intention projection --project proslync-app-ios-final [--json]");
  emitPretty("  ema intention list --project proslync-app-ios-final [--tag lost_followup] [--json]");
  emitPretty("  ema intention list --project proslync-app-ios-final --state accepted [--json]");
  emitPretty("  ema intention show --intent <id> [--json]");
  emitPretty("  ema intention accept --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention reject --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention defer --intent <id> --reason <text> --reviewer actor:trajan [--json]");
  emitPretty("  ema intention backfeed --intent <id> --destination queue --dry-run [--json]");
  emitPretty("  ema intention backfeed --intent <id> --destination queue --approve reviewed [--json]");
}

function printProjection(value: IntentionProjection): void {
  emitPretty(`${value.project ?? "(unresolved project)"} intention projection`);
  emitPretty(`sources: ${value.stats.sources_seen}`);
  emitPretty(`candidates: ${value.stats.candidate_intents}`);
  emitPretty(`proslync: ${value.stats.proslync_relevant}`);
  emitPretty(`ema: ${value.stats.ema_relevant}`);
  emitPretty(`lost followups: ${value.stats.lost_followups}`);
  emitPretty(`recommended queue: ${value.recommended_queue.length}`);
}

function emit(args: ParsedArgs, payload: unknown, pretty: () => void): void {
  if (flagBool(args, "json")) emitJson(payload);
  else pretty();
}

async function projectName(args: ParsedArgs): Promise<string | null> {
  const explicit = flagString(args, "project");
  if (explicit) return explicit;
  const scope = await resolveWorkspaceScope({ args });
  return scope.project_name ?? DEFAULT_PROJECT;
}

function discoverSources(project: string | null): IntentionSource[] {
  const home = homedir();
  const paths = [
    join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "architecture", "18-harness-glue.md"),
    join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "architecture", "24-harness-vapp-launch.md"),
    join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "vapps", "duct-tape-onion-harness.md"),
    join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", "docs", "superpowers", "specs", "2026-05-09-intention-backlog-farmer.md"),
    join(DESKTOP_ROOT, "Projects", "EMA", "atlas", "workspace", "cmux-native-orchestrator-proposal.md"),
    ...projectDocs(join(DESKTOP_ROOT, "Projects", "ema-agent-multiplexer-interface")),
    ...proslyncDocs(),
    join(home, ".codex/memories/MEMORY.md"),
    ...expandGlob(join(home, ".codex/memories/rollout_summaries")),
    ...projectDocs(join(DESKTOP_ROOT, "Active builds", "chronicle")),
    ...projectDocs(join(DESKTOP_ROOT, "Projects", "chronicle")),
    ...projectDocs(join(DESKTOP_ROOT, "Active builds", "duct-tape-onion-harness")),
    ...projectDocs(join(DESKTOP_ROOT, "Projects", "duct-tape-onion-harness")),
    join(home, ".codex/history.jsonl"),
    join(home, ".codex/session_index.jsonl"),
    ...expandGlob(join(home, ".claude/projects")),
    ...expandGlob(join(home, ".codex/sessions")),
    ...expandGlob(join(home, ".codex/archived_sessions")),
  ];
  const seen = new Set<string>();
  return paths
    .filter((path) => existsSync(path) && safeStat(path)?.isFile())
    .filter((path) => {
      if (seen.has(path)) return false;
      seen.add(path);
      return true;
    })
    .map((path) => sourceForPath(path, project));
}

function expandGlob(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0 && out.length < 500) {
    const current = stack.pop()!;
    const stat = safeStat(current);
    if (!stat) continue;
    if (stat.isFile() && interestingFile(current)) {
      out.push(current);
      continue;
    }
    if (!stat.isDirectory() || skipDir(current)) continue;
    for (const name of readdirSync(current)) stack.push(join(current, name));
  }
  return out.sort();
}

function projectDocs(root: string): string[] {
  return [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "project.md",
    "queue/README.md",
    "blueprint/01-executive-summary.md",
    "blueprint/02-system-boundaries.md",
    "blueprint/03-dual-fork-spike.md",
    "blueprint/04-t3code-relationship.md",
    "blueprint/05-stack-decision.md",
  ].map((path) => join(root, path));
}

function proslyncDocs(): string[] {
  const roots = [
    join(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final"),
    join(DESKTOP_ROOT, "Active builds", "proslync-backend"),
    join(DESKTOP_ROOT, "Active builds", "proslync-desktop"),
    join(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final"),
  ];
  return roots.flatMap(projectDocs).concat([
    join(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "PLAN.md"),
    join(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "research-plane", "cross-pollinators", "identity-absorption-product-plan-2026-05-09.md"),
    join(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final", "research-plane", "cross-pollinators", "master-plan-integration-2026-05-09.md"),
    join(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final", "docs", "plans", "proslync-role-happiness-master-plan-2026-05-09", "README.md"),
  ]);
}

function parseSources(
  sources: IntentionSource[],
  maxRecordsPerSource: number,
): { intents: IntentionCard[]; recordsParsed: number; duplicatesSkipped: number } {
  const seen = new Set<string>();
  const intents: IntentionCard[] = [];
  let recordsParsed = 0;
  let duplicatesSkipped = 0;
  for (const source of sources) {
    const records = parseSource(source, maxRecordsPerSource);
    recordsParsed += records.length;
    for (const intent of records) {
      const key = normalize(intent.raw_text).toLowerCase();
      if (seen.has(key)) {
        duplicatesSkipped += 1;
        continue;
      }
      seen.add(key);
      if (intent.tags.length > 0 && intent.raw_text.length >= 12) intents.push(intent);
    }
  }
  return { intents, recordsParsed, duplicatesSkipped };
}

function parseSource(source: IntentionSource, maxRecords: number): IntentionCard[] {
  try {
    const body = readFileSync(source.path, "utf8");
    if (source.path.endsWith(".jsonl")) {
      return body
        .split("\n")
        .slice(0, maxRecords)
        .flatMap((line, index) => parseJsonLine(source, line, index + 1));
    }
    return parseMarkdown(source, body);
  } catch {
    return [];
  }
}

function parseJsonLine(source: IntentionSource, line: string, lineNumber: number): IntentionCard[] {
  if (line.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return [];
  }
  const text = normalize(extractTexts(parsed).join("\n"));
  if (!text) return [];
  const role = stringField(parsed, ["role", "type"]);
  const occurredAt = stringField(parsed, ["timestamp", "created_at", "time"]);
  return [card(source, text, `jsonl:${source.path}#${lineNumber}`, role, occurredAt)];
}

function parseMarkdown(source: IntentionSource, body: string): IntentionCard[] {
  const chunks = body
    .split(/\n(?=#{1,4}\s+)/)
    .map((chunk) => normalize(chunk))
    .filter(Boolean)
    .slice(0, 80);
  return chunks.map((chunk, index) => card(source, chunk, `md:${source.path}#${index + 1}`, null, null));
}

function card(
  source: IntentionSource,
  text: string,
  evidenceRef: string,
  role: string | null,
  occurredAt: string | null,
): IntentionCard {
  const tags = tagsFor(text, source);
  const confidence = Math.min(0.55 + Math.min(tags.length * 0.1, 0.35) + (text.length > 240 ? 0.1 : 0), 0.99);
  const id = `intent:${hash(`${evidenceRef}:${text}`).slice(0, 24)}`;
  return {
    id,
    title: titleFor(text, tags),
    raw_text: text.slice(0, 1500),
    tags,
    confidence,
    review_state: "new",
    recommended_destination: destinationFor(tags),
    evidence_ref: evidenceRef,
    source_path: source.path,
    source_type: source.source_type,
    source_family: source.source_family,
    project_hint: source.project_hint,
    occurred_at: occurredAt,
    role,
  };
}

function extractTexts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractTexts);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return ["prompt", "text", "content", "message", "summary", "command", "cmd", "body", "output", "input"]
      .flatMap((key) => extractTexts(object[key]))
      .filter((text) => text.trim().length > 0);
  }
  return [];
}

function tagsFor(text: string, source: IntentionSource): string[] {
  const lower = text.toLowerCase();
  const proslyncSource = source.source_family === "proslync" || lower.includes("proslync");
  const emaSource = source.source_family === "ema" || lower.includes(" ema ") || lower.startsWith("ema ");
  return [
    testTag(lower, /proslync|mrs\.? wilson|\bnil\b|athletic director|\bad\b|brand hq|revenue-share|revenue share|athlete|compliance/, "proslync_product_intent"),
    proslyncSource ? testTag(lower, /tsc|typecheck|build|simulator|backend|desktop|active build|branch|dirty|worktree/, "proslync_build_process_intent") : null,
    emaSource ? testTag(lower, /\bema\b|cockpit|lane|queue|vapp|daemon|projection|active builds/, "ema_build_process_intent") : null,
    testTag(lower, /i want|we need|should|keep|don't|please|follow up|lost|stale|blocker|next/, "lost_followup"),
    testTag(lower, /chronicle|activity|replay|event stream|session history/, "chronicle_pattern"),
    testTag(lower, /duct tape|harness glue|dispatch|execution|tool\.timeline/, "harness_glue_pattern"),
    testTag(lower, /cmux|multiplexer|session manager|\btui\b|codex\/claude sessions|claude tui|codex tui/, "session_manager_pattern"),
  ].filter((tag): tag is string => tag != null);
}

function testTag(text: string, regex: RegExp, tag: string): string | null {
  return regex.test(text) ? tag : null;
}

function destinationFor(tags: string[]): Destination {
  if (tags.includes("proslync_product_intent") || tags.includes("proslync_build_process_intent")) return "proslync_queue";
  if (tags.some((tag) => ["ema_build_process_intent", "harness_glue_pattern", "chronicle_pattern", "session_manager_pattern", "lost_followup"].includes(tag))) return "ema_queue";
  return "doc_only";
}

function titleFor(text: string, tags: string[]): string {
  const prefix = tags.includes("proslync_product_intent")
    ? "Proslync"
    : tags.includes("ema_build_process_intent")
      ? "EMA"
      : tags.includes("harness_glue_pattern")
        ? "Harness"
        : tags.includes("chronicle_pattern")
          ? "Chronicle"
          : tags.includes("session_manager_pattern")
            ? "Session"
            : "Intent";
  return `${prefix}: ${text.split(/\s+/).slice(0, 18).join(" ")}`.slice(0, 160);
}

function buildProjection(
  project: string | null,
  sourceCount: number,
  recordsParsed: number,
  duplicatesSkipped: number,
  intents: IntentionCard[],
): IntentionProjection {
  const topTags = Object.entries(
    intents.flatMap((intent) => intent.tags).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return {
    ok: true,
    command: "intention.projection",
    source: "ema_intention_cli",
    authority: "file_backed_review_projection",
    generated_at: new Date().toISOString(),
    project,
    stats: {
      sources_seen: sourceCount,
      records_parsed: recordsParsed,
      candidate_intents: intents.length,
      proslync_relevant: intents.filter((intent) => intent.tags.includes("proslync_product_intent")).length,
      ema_relevant: intents.filter((intent) => intent.tags.includes("ema_build_process_intent")).length,
      lost_followups: intents.filter((intent) => intent.tags.includes("lost_followup")).length,
      duplicates_skipped: duplicatesSkipped,
    },
    top_tags: topTags,
    intents,
    recommended_queue: intents
      .filter((intent) => (intent.recommended_destination === "proslync_queue" || intent.recommended_destination === "ema_queue") && intent.review_state !== "rejected" && intent.review_state !== "deferred")
      .sort((a, b) => queuePriority(b) - queuePriority(a) || b.confidence - a.confidence || a.title.localeCompare(b.title))
      .slice(0, 25),
  };
}

function queuePriority(intent: IntentionCard): number {
  let score = 0;
  if (intent.recommended_destination === "proslync_queue") score += 10;
  if (intent.tags.includes("proslync_product_intent")) score += 6;
  if (intent.source_family === "proslync") score += 4;
  if (intent.tags.includes("lost_followup")) score += 2;
  return score;
}

function sourceForPath(path: string, project: string | null): IntentionSource {
  const lower = path.toLowerCase();
  const source_family: SourceFamily = lower.includes("proslync")
    ? "proslync"
    : lower.includes("ema-0.0.6") || lower.includes("/projects/ema/")
      ? "ema"
      : lower.includes("chronicle")
        ? "chronicle"
        : lower.includes("duct-tape")
          ? "duct_tape"
          : lower.includes("multiplexer") || lower.includes("cmux") || lower.includes("t3code")
            ? "session_manager"
            : "general";
  const source_type: SourceType = lower.endsWith(".jsonl") && lower.includes("/.claude/")
    ? "claude_project"
    : lower.endsWith(".jsonl") && (lower.includes("/.codex/sessions/") || lower.includes("/.codex/archived_sessions/"))
      ? "codex_session"
      : lower.endsWith(".jsonl") && lower.includes("/.codex/")
        ? "codex_history"
        : lower.includes("/.codex/memories/")
          ? "codex_memory"
          : source_family === "proslync"
            ? "proslync_repo"
            : source_family === "ema"
              ? "ema_doc"
              : "donor_project";
  return {
    path,
    source_type,
    source_family,
    project_hint: source_family === "proslync" ? project ?? DEFAULT_PROJECT : source_family === "ema" ? "EMA" : basename(dirname(path)) || null,
  };
}

function readStoredProjection(project: string | null): IntentionProjection | null {
  const path = storePath(project);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as IntentionProjection;
  } catch {
    return null;
  }
}

function readReviews(): IntentionReview[] {
  if (!existsSync(REVIEWS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(REVIEWS_PATH, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReview);
  } catch {
    return [];
  }
}

function writeReviews(reviews: readonly IntentionReview[]): void {
  mkdirSync(STORE_ROOT, { recursive: true });
  writeFileSync(REVIEWS_PATH, JSON.stringify(reviews, null, 2) + "\n");
}

function isReview(value: unknown): value is IntentionReview {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.intent_id === "string" &&
    (record.state === "accepted" || record.state === "rejected" || record.state === "deferred" || record.state === "new") &&
    typeof record.reviewer === "string" &&
    typeof record.reason === "string" &&
    typeof record.reviewed_at === "string"
  );
}

function applyReviews(projection: IntentionProjection): IntentionProjection {
  const reviews = new Map(readReviews().map((review) => [review.intent_id, review]));
  const intents = projection.intents.map((intent) => ({
    ...intent,
    review_state: reviews.get(intent.id)?.state ?? intent.review_state ?? "new",
  }));
  return {
    ...projection,
    intents,
    recommended_queue: intents
      .filter((intent) => (intent.recommended_destination === "proslync_queue" || intent.recommended_destination === "ema_queue") && intent.review_state !== "rejected" && intent.review_state !== "deferred")
      .sort((a, b) => queuePriority(b) - queuePriority(a) || b.confidence - a.confidence || a.title.localeCompare(b.title))
      .slice(0, 25),
  };
}

function findIntent(
  projection: IntentionProjection,
  id: string,
): { projection: IntentionProjection; intent: IntentionCard } | null {
  const intent = projection.intents.find((candidate) => candidate.id === id) ?? null;
  return intent ? { projection, intent } : null;
}

function findIntentAcrossStore(id: string): { projection: IntentionProjection; intent: IntentionCard } | null {
  if (!existsSync(STORE_ROOT)) return null;
  for (const name of readdirSync(STORE_ROOT)) {
    if (name === "reviews.json") continue;
    if (!name.endsWith(".json")) continue;
    try {
      const projection = applyReviews(JSON.parse(readFileSync(join(STORE_ROOT, name), "utf8")) as IntentionProjection);
      const found = findIntent(projection, id);
      if (found) return found;
    } catch {
      continue;
    }
  }
  return null;
}

function writeStoredProjection(project: string | null, projection: IntentionProjection): void {
  mkdirSync(STORE_ROOT, { recursive: true });
  writeFileSync(storePath(project), JSON.stringify(projection, null, 2) + "\n");
}

function storePath(project: string | null): string {
  return join(STORE_ROOT, `${safeName(project ?? "unresolved")}.json`);
}

function emptyProjection(project: string | null): IntentionProjection {
  return buildProjection(project, 0, 0, 0, []);
}

function queueAddCommand(project: string, intent: IntentionCard): string[] {
  return [
    "ema",
    "queue",
    "add",
    "--project",
    shellQuote(project),
    "--title",
    shellQuote(intent.title),
    "--why",
    shellQuote(`${intent.raw_text.slice(0, 400)} Evidence: ${intent.evidence_ref}`),
    "--done-when",
    shellQuote(`Reviewed intention is either shipped, rejected, or merged into the current project plan. Source: ${intent.id}`),
    "--source",
    shellQuote(intent.evidence_ref),
  ];
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function shellQuote(value: string): string {
  return JSON.stringify(value);
}

function interestingFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".jsonl") || lower.endsWith(".md");
}

function skipDir(path: string): boolean {
  const lower = path.toLowerCase();
  return ["/node_modules", "/.next", "/dist", "/build", "/pods", "/deriveddata"].some((part) => lower.includes(part));
}

function safeStat(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stringField(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const raw = object[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}

function hash(value: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
