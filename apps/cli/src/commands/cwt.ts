import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { runCwtIngestWriter } from "./cwt-ingest-writer.js";
import { runStubContract } from "./stub-contract.js";

const DOC_REF = "docs/architecture/20-cwt-integration.md";

type ProjectionCounts = {
  orgs?: number;
  spaces?: number;
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
          flags: ["root", "dry-run", "all", "only"],
          summary: "Preview or commit CWT records into EMA daemon records.",
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
    project_storage: projectStoragePolicy(),
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
  const root = projectionRoot(args);
  const manifest = await readManifest(root);
  if (!manifest) {
    if (json) emitJson({ ok: false, status: "missing_projection", root });
    else emitError(`CWT projection missing at ${root}`);
    return 1;
  }
  return runCwtIngestWriter(args, root, manifest);
}

function projectStoragePolicy() {
  return {
    driver: "git_worktree",
    versioning: "git",
    target_policy: "project_git_repo",
  };
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
