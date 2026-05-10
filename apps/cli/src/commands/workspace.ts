import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { EMA_ACTIVE_BUILD } from "../workspace-state.js";
import { resolveWorkspaceScope, type WorkspaceScope } from "../workspace-scope.js";
import { connect, type CommandResult } from "../ws-client.js";
import { CANONICAL_DB, readText, sha256, sqliteJson, stableId } from "./substrate-utils.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";

const CONTRACT_KINDS = new Set(["report", "note", "output", "session_log", "proof", "other"]);
const LEGACY_KIND_ALIASES = new Set(["plan", "handoff", "context_bundle", "session_export"]);
const SOURCE = "daemon_canonical_events";
const DAEMON_AUTHORITY = "daemon_artifact_writer";

interface ArtifactEventRow {
  readonly txid: number;
  readonly event_id: string;
  readonly kind: string;
  readonly ts: string | null;
  readonly project_id: string | null;
  readonly payload_json: unknown;
}

interface ArtifactPayload {
  readonly artifact_id?: unknown;
  readonly kind?: unknown;
  readonly project?: unknown;
  readonly content_hash?: unknown;
  readonly storage_path?: unknown;
  readonly bytes?: unknown;
  readonly metadata?: unknown;
}

interface ArtifactRecord {
  readonly id: string;
  readonly project_id: string;
  readonly kind: string;
  readonly title: string;
  readonly path: string;
  readonly storage_path: string;
  readonly source_path: string | null;
  readonly content_hash: string;
  readonly bytes: number;
  readonly status: "active" | "archived";
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

interface ArtifactLink {
  readonly id: string;
  readonly artifact_id: string;
  readonly target_kind: string;
  readonly target_id: string;
  readonly created_at: string | null;
}

export async function runWorkspace(args: ParsedArgs): Promise<number> {
  const noun = args.positional[0];
  const verb = args.positional[1] ?? "list";
  if (flagBool(args, "help") || args.flags.h === true || noun === "help") return help(args);
  if (noun !== "artifact" && noun !== "artifacts") {
    emitError(`ema workspace: unknown subcommand "${noun ?? ""}" (expected: artifact)`);
    return 64;
  }
  if (verb === "add") return addArtifact(args);
  if (verb === "update") return updateArtifact(args);
  if (verb === "list") return listArtifacts(args);
  if (verb === "show") return showArtifact(args);
  if (verb === "link") return linkArtifact(args);
  if (verb === "archive") return archiveArtifact(args);
  emitError(`ema workspace artifact: unknown action "${verb}" (expected: add | update | list | show | link | archive)`);
  return 64;
}

function help(args: ParsedArgs): number {
  const commands = [
    { verb: "artifact add", summary: "Create a daemon-canonical workspace artifact." },
    { verb: "artifact update", summary: "Update artifact content through the daemon writer." },
    { verb: "artifact list", summary: "List daemon-canonical workspace artifacts for the resolved project." },
    { verb: "artifact show", summary: "Show one artifact by --artifact." },
    { verb: "artifact link", summary: "Link an artifact to a lane, queue item, execution, dispatch, project, or intention." },
    { verb: "artifact archive", summary: "Archive an artifact through the daemon writer." },
  ];
  if (flagBool(args, "json")) emitJson({ noun: "workspace", status: "available", commands });
  else {
    emitPretty("ema workspace - shared project artifacts");
    for (const command of commands) emitPretty(`  ${command.verb.padEnd(18)} ${command.summary}`);
  }
  return 0;
}

async function addArtifact(args: ParsedArgs): Promise<number> {
  const scope = await resolveWorkspaceScope({ args });
  const rawKind = flagString(args, "kind") ?? "note";
  const kind = normalizeKind(rawKind);
  const title = flagString(args, "title");
  const bodyFile = flagString(args, "body-file");
  if (!kind) return usage(`invalid --kind ${rawKind}`);
  if (!title || !bodyFile) return usage("artifact add requires --title and --body-file");
  if (!existsSync(bodyFile)) return usage(`body file not found: ${bodyFile}`);
  const projectId = projectIdFor(scope);
  const body = readText(bodyFile);
  const result = await artifactCommand("artifact.create", scope, {
    project_id: projectId,
    source_type: kind,
    title,
    source: bodyFile,
    body,
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.add", result);
  const id = String(result.resource ?? "");
  const artifact = findArtifact(scope, id);
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.add",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact: artifact ?? { id, kind, title, content_hash: sha256(body), status: "active" },
    events: result.events ?? [],
    index: CANONICAL_DB,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact: ${id}\npath: ${artifact?.path ?? "(pending projection)"}`);
  return artifact ? 0 : 1;
}

async function updateArtifact(args: ParsedArgs): Promise<number> {
  const id = flagString(args, "artifact") ?? args.positional[2];
  const bodyFile = flagString(args, "body-file");
  if (!id || !bodyFile) return usage("artifact update requires --artifact and --body-file");
  if (!existsSync(bodyFile)) return usage(`body file not found: ${bodyFile}`);
  const scope = await resolveWorkspaceScope({ args });
  const current = findArtifact(scope, id);
  if (!current) return notFound(args, "workspace.artifact.update", scope, id);
  const rawKind = flagString(args, "kind") ?? current.kind;
  const kind = normalizeKind(rawKind);
  if (!kind) return usage(`invalid --kind ${rawKind}`);
  const title = flagString(args, "title") ?? current.title;
  const body = readText(bodyFile);
  const result = await artifactCommand("artifact.update", scope, {
    project_id: projectIdFor(scope),
    document_id: id,
    source_type: kind,
    title,
    source: bodyFile,
    body,
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.update", result);
  const artifact = findArtifact(scope, id);
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.update",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact,
    events: result.events ?? [],
    index: CANONICAL_DB,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact updated: ${id}`);
  return artifact ? 0 : 1;
}

async function listArtifacts(args: ParsedArgs): Promise<number> {
  const scope = await resolveWorkspaceScope({ args });
  const kind = flagString(args, "kind");
  const normalizedKind = kind ? normalizeKind(kind) : null;
  if (kind && !normalizedKind) return usage(`invalid --kind ${kind}`);
  const artifacts = listCanonicalArtifacts(scope).artifacts
    .filter((artifact) => !normalizedKind || artifact.kind === normalizedKind)
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "") || a.title.localeCompare(b.title));
  const payload = {
    ok: true,
    command: "workspace.artifact.list",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    index: CANONICAL_DB,
    artifacts,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const row of artifacts) emitPretty(`${row.id} [${row.kind}] ${row.title}`);
  return 0;
}

async function showArtifact(args: ParsedArgs): Promise<number> {
  const id = flagString(args, "artifact") ?? args.positional[2];
  if (!id) return usage("artifact show requires --artifact");
  const scope = await resolveWorkspaceScope({ args });
  const state = listCanonicalArtifacts(scope);
  const artifact = state.artifacts.find((row) => row.id === id) ?? null;
  const links = state.links.filter((link) => link.artifact_id === id);
  const body = artifact && existsSync(artifact.path) ? readText(artifact.path) : null;
  const payload = {
    ok: Boolean(artifact),
    command: "workspace.artifact.show",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact,
    links,
    body,
    events: state.events.filter((event) => event.artifact_id === id),
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (artifact) emitPretty(body ?? JSON.stringify(artifact, null, 2));
  else emitError(`artifact not found: ${id}`);
  return artifact ? 0 : 1;
}

async function linkArtifact(args: ParsedArgs): Promise<number> {
  const artifactId = flagString(args, "artifact");
  const targetKind = flagString(args, "target-kind");
  const targetId = flagString(args, "target-id");
  if (!artifactId || !targetKind || !targetId) return usage("artifact link requires --artifact, --target-kind, and --target-id");
  const scope = await resolveWorkspaceScope({ args });
  const artifact = findArtifact(scope, artifactId);
  if (!artifact) return notFound(args, "workspace.artifact.link", scope, artifactId);
  const result = await artifactCommand("artifact.link", scope, {
    project_id: projectIdFor(scope),
    document_id: artifact.id,
    source_type: artifact.kind,
    title: artifact.title,
    result: artifact.content_hash,
    source: artifact.storage_path,
    duration_ms: artifact.bytes,
    target_kind: targetKind,
    target_value: targetId,
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.link", result);
  const link = {
    id: stableId("artifact_link", `${artifactId}:${targetKind}:${targetId}`),
    artifact_id: artifactId,
    target_kind: targetKind,
    target_id: targetId,
    created_at: new Date().toISOString(),
  };
  const payload = {
    ok: true,
    command: "workspace.artifact.link",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    link,
    events: result.events ?? [],
    index: CANONICAL_DB,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`link: ${link.id}`);
  return 0;
}

async function archiveArtifact(args: ParsedArgs): Promise<number> {
  const artifactId = flagString(args, "artifact") ?? args.positional[2];
  if (!artifactId) return usage("artifact archive requires --artifact");
  const scope = await resolveWorkspaceScope({ args });
  const artifact = findArtifact(scope, artifactId);
  if (!artifact) return notFound(args, "workspace.artifact.archive", scope, artifactId);
  const result = await artifactCommand("artifact.archive", scope, {
    project_id: projectIdFor(scope),
    document_id: artifact.id,
    source_type: artifact.kind,
    title: artifact.title,
    result: artifact.content_hash,
    source: artifact.storage_path,
    duration_ms: artifact.bytes,
    reason: flagString(args, "reason") ?? "archived by CLI",
  });
  if (!result.ok) return daemonError(args, "workspace.artifact.archive", result);
  const archived = findArtifact(scope, artifactId);
  const payload = {
    ok: Boolean(archived),
    command: "workspace.artifact.archive",
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    artifact: archived,
    events: result.events ?? [],
    index: CANONICAL_DB,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitPretty(`artifact archived: ${artifactId}`);
  return archived ? 0 : 1;
}

async function artifactCommand(op: string, scope: WorkspaceScope, commandArgs: Record<string, unknown>): Promise<CommandResult> {
  const client = await connect({ surface: "desktop" });
  try {
    return await client.command(op, {
      org_id: scope.org_id ?? DEFAULT_ORG,
      ...commandArgs,
    });
  } finally {
    client.close();
  }
}

function listCanonicalArtifacts(scope: WorkspaceScope): {
  readonly artifacts: ArtifactRecord[];
  readonly links: ArtifactLink[];
  readonly events: Array<ArtifactEventRow & { payload: ArtifactPayload; artifact_id: string | null }>;
} {
  const rows = sqliteJson<ArtifactEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, project_id, payload_json
    from events
    where kind like 'artifact.%'
    order by txid asc;
  `);
  const artifacts = new Map<string, ArtifactRecord>();
  const links: ArtifactLink[] = [];
  const events: Array<ArtifactEventRow & { payload: ArtifactPayload; artifact_id: string | null }> = [];
  for (const row of rows) {
    const payload = parsePayload(row.payload_json);
    const id = stringValue(payload.artifact_id);
    if (!id || !eventMatchesScope(scope, row, payload)) continue;
    events.push({ ...row, payload, artifact_id: id });
    const metadata = objectValue(payload.metadata);
    const kind = stringValue(payload.kind) ?? "other";
    const title = stringValue(metadata.title) ?? id;
    const contentHash = stringValue(payload.content_hash) ?? "";
    const storagePath = stringValue(payload.storage_path) ?? "";
    const bytes = numberValue(payload.bytes) ?? 0;
    if (row.kind === "artifact.created" || row.kind === "artifact.updated") {
      const previous = artifacts.get(id);
      artifacts.set(id, {
        id,
        project_id: stringValue(payload.project) ?? row.project_id ?? projectIdFor(scope),
        kind,
        title,
        path: absoluteStoragePath(storagePath),
        storage_path: storagePath,
        source_path: stringValue(metadata.source_path),
        content_hash: contentHash,
        bytes,
        status: previous?.status ?? "active",
        created_at: previous?.created_at ?? row.ts,
        updated_at: row.ts,
      });
    }
    if (row.kind === "artifact.linked") {
      const targetKind = stringValue(metadata.target_kind) ?? "unknown";
      const targetId = stringValue(metadata.target_id) ?? "unknown";
      links.push({
        id: stableId("artifact_link", `${id}:${targetKind}:${targetId}`),
        artifact_id: id,
        target_kind: targetKind,
        target_id: targetId,
        created_at: row.ts,
      });
    }
    if (row.kind === "artifact.archived") {
      const previous = artifacts.get(id);
      artifacts.set(id, {
        id,
        project_id: stringValue(payload.project) ?? row.project_id ?? projectIdFor(scope),
        kind,
        title,
        path: absoluteStoragePath(storagePath),
        storage_path: storagePath,
        source_path: previous?.source_path ?? null,
        content_hash: contentHash,
        bytes,
        status: "archived",
        created_at: previous?.created_at ?? row.ts,
        updated_at: row.ts,
      });
    }
  }
  return { artifacts: [...artifacts.values()], links, events };
}

function findArtifact(scope: WorkspaceScope, artifactId: string): ArtifactRecord | null {
  return listCanonicalArtifacts(scope).artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}

function normalizeKind(value: string): string | null {
  const clean = value.trim().toLowerCase();
  if (CONTRACT_KINDS.has(clean)) return clean;
  if (LEGACY_KIND_ALIASES.has(clean)) return "other";
  return null;
}

function parsePayload(value: unknown): ArtifactPayload {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return objectValue(parsed) as ArtifactPayload;
  } catch {
    return {};
  }
}

function eventMatchesScope(scope: WorkspaceScope, row: ArtifactEventRow, payload: ArtifactPayload): boolean {
  const expected = scope.project_id;
  if (!expected) return true;
  const actual = stringValue(payload.project) ?? row.project_id;
  return actual === expected;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function absoluteStoragePath(storagePath: string): string {
  return storagePath.startsWith("/") ? storagePath : join(EMA_ACTIVE_BUILD, storagePath);
}

function projectIdFor(scope: WorkspaceScope): string {
  return scope.project_id ?? scope.project_name ?? "ema-0-0-6";
}

function usage(message: string): number {
  emitError(`ema workspace: ${message}`);
  return 64;
}

function notFound(args: ParsedArgs, command: string, scope: WorkspaceScope, artifact: string): number {
  const payload = {
    ok: false,
    command,
    source: SOURCE,
    daemon_authority: DAEMON_AUTHORITY,
    workspace_scope: scope,
    error: { class: "not_found", message: `artifact not found: ${artifact}` },
  };
  if (flagBool(args, "json")) emitJson(payload);
  else emitError(payload.error.message);
  return 1;
}

function daemonError(args: ParsedArgs, command: string, result: CommandResult): number {
  const error = result.ok ? { class: "unknown", message: "daemon command did not return an artifact" } : result.error;
  if (flagBool(args, "json")) emitJson({ ok: false, command, source: SOURCE, daemon_authority: DAEMON_AUTHORITY, error });
  else emitError(`ema workspace: ${error.message}`);
  return 1;
}
