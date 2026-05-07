import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { runStubContract } from "./stub-contract.js";

const DOC_REF = "docs/architecture/20-cwt-integration.md";

type ProjectionCounts = {
  projects?: number;
  lanes?: number;
  queue_items?: number;
  campaigns?: number;
  problems?: number;
  handoffs?: number;
  vcalendar_blocks?: number;
  executions?: number;
  responsibilities?: number;
  checkups?: number;
};

type CwtManifest = {
  projection?: string;
  generated_at?: string;
  root?: string;
  counts?: ProjectionCounts;
  local_n_sync?: {
    mode?: string;
    namespace?: string;
    index?: string;
    current_state?: string;
  };
};

type RecordIndex = {
  count?: number;
  records?: Array<{ id: string; path: string }>;
};

type QueueRecord = {
  id?: string;
  title?: string;
  why?: string;
  done_when?: string;
  project_id?: string;
  priority?: number;
  source?: string;
  status?: string;
};

export async function runCwt(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (!verb || verb === "help" || flagBool(args, "help") || args.flags.h === true) {
    return runStubContract(args, {
      noun: "cwt",
      status: "available",
      docRef: DOC_REF,
      commands: [
        {
          verb: "status",
          flags: ["root"],
          summary: "Inspect the current-work-tracker shared-files projection.",
        },
        {
          verb: "ingest",
          flags: ["root", "dry-run"],
          summary: "Preview promotion of CWT records into EMA daemon records.",
        },
      ],
    });
  }

  if (verb === "status") return runStatus(args);
  if (verb === "ingest") return runIngest(args);

  emitError(`ema cwt: unknown subcommand "${verb}" (expected: status, ingest)`);
  return 64;
}

async function runStatus(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const root = projectionRoot(args);
  const manifest = await readManifest(root);
  if (!manifest) {
    const result = {
      ok: false,
      source: "cwt.shared_files",
      status: "missing_projection",
      root,
      expected: join(root, "manifest.json"),
      next: "Run CWT and send `sync` in the in-app Agent Chat.",
    };
    if (json) emitJson(result);
    else {
      emitPretty("CWT projection missing");
      emitPretty(`root: ${root}`);
      emitPretty(result.next);
    }
    return 1;
  }

  const statePath = join(root, manifest.local_n_sync?.current_state ?? "local-n-sync/current-state.md");
  const stateExists = await exists(statePath);
  const result = {
    ok: true,
    source: "cwt.shared_files",
    status: "projection_found",
    root,
    generated_at: manifest.generated_at ?? null,
    projection: manifest.projection ?? null,
    counts: manifest.counts ?? {},
    local_n_sync: manifest.local_n_sync ?? null,
    current_state_exists: stateExists,
    next: "ema cwt ingest --dry-run --json",
  };

  if (json) emitJson(result);
  else {
    emitPretty("CWT projection found");
    emitPretty(`root: ${root}`);
    emitPretty(`generated: ${result.generated_at ?? "(unknown)"}`);
    emitPretty(`projects: ${result.counts.projects ?? 0}`);
    emitPretty(`queue items: ${result.counts.queue_items ?? 0}`);
    emitPretty(`next: ${result.next}`);
  }
  return 0;
}

async function runIngest(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const dryRun = flagBool(args, "dry-run");
  const root = projectionRoot(args);
  const manifest = await readManifest(root);
  if (!manifest) {
    if (json) emitJson({ ok: false, status: "missing_projection", root });
    else emitError(`CWT projection missing at ${root}`);
    return 1;
  }
  if (!dryRun) {
    const result = {
      ok: false,
      status: "writer_pending",
      root,
      reason: "CWT promotion is intentionally dry-run only until the daemon queue/lane/problem import writer lands.",
      required_next: "Run `ema cwt ingest --dry-run --json`, review candidates, then implement cwt.import_preview -> daemon writer.",
    };
    if (json) emitJson(result);
    else {
      emitError(result.reason);
      emitPretty(result.required_next);
    }
    return 2;
  }

  const queue = await readQueueCandidates(root);
  const result = {
    ok: true,
    source: "cwt.shared_files",
    mode: "dry_run",
    root,
    generated_at: manifest.generated_at ?? null,
    counts: manifest.counts ?? {},
    candidates: {
      queue_items: queue.map((item) => ({
        cwt_id: item.id ?? null,
        title: item.title ?? "(untitled)",
        why: item.why ?? "",
        done_when: item.done_when ?? "",
        project_id: item.project_id ?? null,
        priority: item.priority ?? null,
        source: item.source ?? "cwt.shared_files",
        suggested_command: suggestedQueueCommand(item),
      })),
    },
    promotion_boundary: "preview_only",
  };

  if (json) emitJson(result);
  else {
    emitPretty("CWT ingest dry-run");
    emitPretty(`root: ${root}`);
    emitPretty(`queue candidates: ${result.candidates.queue_items.length}`);
    for (const candidate of result.candidates.queue_items.slice(0, 8)) {
      emitPretty(`  ${candidate.title} (${candidate.cwt_id ?? "no id"})`);
    }
  }
  return 0;
}

async function readQueueCandidates(root: string): Promise<QueueRecord[]> {
  const indexPath = join(root, "records", "queue", "index.json");
  const index = await readJson<RecordIndex>(indexPath);
  const refs = index?.records ?? [];
  const rows: QueueRecord[] = [];
  for (const ref of refs) {
    const row = await readJson<QueueRecord>(join(root, ref.path));
    if (row && row.status !== "done" && row.status !== "dropped") rows.push(row);
  }
  return rows;
}

function suggestedQueueCommand(item: QueueRecord): string {
  const title = shellQuote(item.title ?? "(untitled)");
  const why = shellQuote(item.why ?? "Imported from CWT shared-files projection.");
  const doneWhen = shellQuote(item.done_when ?? "Reviewed and accepted in EMA.");
  const source = shellQuote(item.source ?? "cwt.shared_files");
  const project = item.project_id ? ` --project ${shellQuote(item.project_id)}` : "";
  return `ema queue add${project} --title ${title} --why ${why} --done-when ${doneWhen} --source ${source}`;
}

function projectionRoot(args: ParsedArgs): string {
  const raw = flagString(args, "root");
  if (raw) return resolve(raw);
  return resolve(
    homedir(),
    "Desktop",
    "Space shared files-uploads-vDesktop-vFilesystem-root",
    "current-work-tracker-trajan",
  );
}

async function readManifest(root: string): Promise<CwtManifest | null> {
  return readJson<CwtManifest>(join(root, "manifest.json"));
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return null;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
