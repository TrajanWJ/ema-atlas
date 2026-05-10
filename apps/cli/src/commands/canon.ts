import { readFileSync } from "node:fs";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString, flagStrings } from "../args.js";
import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { maybeRunVerbHelp, runStubContract, type StubCommand } from "./stub-contract.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";
import {
  CANONICAL_DB,
  sha256,
  sqlEscape,
  sqliteJson,
} from "./substrate-utils.js";
import {
  eventsMentioning,
  parsePayload,
  tableExists,
  type CanonicalEventRow,
} from "./pipeline-store.js";

const CANON_COMMANDS: StubCommand[] = [
  {
    verb: "write",
    flags: ["kind", "body-file", "source-kind", "source-id", "written-by", "id", "approved-by", "link", "json"],
    required: ["kind", "body-file", "source-kind", "source-id", "written-by"],
    summary: "Write a daemon-canonical canon node.",
  },
  { verb: "show", flags: ["json"], required: ["id"], summary: "Show one canon node with links and events." },
  { verb: "list", flags: ["kind", "source-kind", "source-id", "linked-to", "json"], summary: "List canon nodes." },
  {
    verb: "supersede",
    flags: ["by", "actor", "rationale", "json"],
    required: ["old-id", "by", "actor", "rationale"],
    summary: "Mark an existing canon node superseded by another canon node.",
  },
];

const CANON_STUB_OPTS = {
  noun: "canon",
  status: "available",
  docRef: "packages/contracts/events/canon.md",
  commands: CANON_COMMANDS,
};

const CANON_KINDS = new Set(["execution_result", "decision", "doctrine", "observation", "retro", "direction"]);
const SOURCE_KINDS = new Set(["execution", "proposal", "intent", "manual", "external"]);

interface CanonNode {
  readonly id: string;
  readonly canon_id: string;
  readonly kind: string;
  readonly content_hash: string;
  readonly body: string;
  readonly source_kind: string;
  readonly source_id: string | null;
  readonly written_by_actor_id: string;
  readonly approved_by_actor_id: string | null;
  readonly written_at: string;
  readonly superseded_by: string | null;
  readonly superseded_at: string | null;
  readonly links: CanonLink[];
}

interface CanonLink {
  readonly canon_id: string;
  readonly kind: string;
  readonly target_id: string;
}

type CanonFilters = {
  readonly id?: string;
  readonly kind?: string;
  readonly sourceKind?: string;
  readonly sourceId?: string;
  readonly linkedTo?: string;
};

export async function runCanon(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "help";
  const helpExit = maybeRunVerbHelp(args, CANON_STUB_OPTS);
  if (helpExit !== null) return helpExit;
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "write") return write(args);
  if (verb === "show") return show(args);
  if (verb === "list") return list(args);
  if (verb === "supersede") return supersede(args);
  emitError(`ema canon: unknown subcommand "${verb}" (expected: write | show | list | supersede)`);
  return 64;
}

function help(args: ParsedArgs): number {
  return runStubContract(args, CANON_STUB_OPTS);
}

async function write(args: ParsedArgs): Promise<number> {
  const kind = flagString(args, "kind");
  const bodyFile = flagString(args, "body-file");
  const sourceKind = flagString(args, "source-kind");
  const sourceId = flagString(args, "source-id");
  const writtenBy = flagString(args, "written-by");
  if (!kind || !bodyFile || !sourceKind || !sourceId || !writtenBy) {
    return fail(args, "canon.write", "invalid_args", "--kind, --body-file, --source-kind, --source-id, and --written-by are required", 64);
  }
  if (!CANON_KINDS.has(kind)) return fail(args, "canon.write", "invalid_args", `invalid canon kind: ${kind}`, 64);
  if (!SOURCE_KINDS.has(sourceKind)) return fail(args, "canon.write", "invalid_args", `invalid source kind: ${sourceKind}`, 64);
  const id = flagString(args, "id");
  if (id && canonById(id)) return fail(args, "canon.write", "duplicate_id", `canon node already exists: ${id}`, 1);
  const body = readFileSync(bodyFile, "utf8");
  const links = parseLinks(args);
  if (!links.ok) return fail(args, "canon.write", "invalid_args", links.error, 64);
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("canon.write", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: writtenBy,
      canon_id: id ?? null,
      canon_kind: kind,
      body,
      content_hash: sha256(body),
      source_kind: sourceKind,
      source_id: sourceId,
      approved_by_actor_id: flagString(args, "approved-by") ?? null,
      links: links.links.map((link) => `${link.kind}:${link.target_id}`),
    });
    if (result.ok !== true) {
      return fail(args, "canon.write", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    }
    const canonId = String(result.resource ?? id ?? "");
    const canon = canonById(canonId);
    const payload = {
      ok: Boolean(canon),
      command: "canon.write",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      canon,
    };
    if (json) emitJson(payload);
    else emitPretty(`canon: ${canonId}`);
    return canon ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

function show(args: ParsedArgs): number {
  const id = args.positional[1] ?? flagString(args, "id");
  if (!id) return fail(args, "canon.show", "invalid_args", "canon id is required", 64);
  const canon = canonById(id);
  const payload = {
    ok: Boolean(canon),
    command: "canon.show",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    canon,
    events: eventsMentioning(id),
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (canon) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`canon node not found: ${id}`);
  return canon ? 0 : 1;
}

function list(args: ParsedArgs): number {
  const linkedTo = flagString(args, "linked-to");
  const nodes = canonRecords({
    kind: flagString(args, "kind"),
    sourceKind: flagString(args, "source-kind"),
    sourceId: flagString(args, "source-id"),
    linkedTo,
  });
  const payload = {
    ok: true,
    command: "canon.list",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    canon_nodes: nodes,
  };
  if (flagBool(args, "json")) emitJson(payload);
  else for (const node of nodes) emitPretty(`${node.canon_id} ${node.kind} ${node.source_kind}:${node.source_id ?? ""}`);
  return 0;
}

async function supersede(args: ParsedArgs): Promise<number> {
  const oldId = args.positional[1] ?? flagString(args, "id");
  const by = flagString(args, "by");
  const actor = flagString(args, "actor");
  const rationale = flagString(args, "rationale");
  if (!oldId || !by || !actor || !rationale) {
    return fail(args, "canon.supersede", "invalid_args", "old id, --by, --actor, and --rationale are required", 64);
  }
  if (!canonById(oldId)) return fail(args, "canon.supersede", "not_found", `canon node not found: ${oldId}`, 1);
  if (!canonById(by)) return fail(args, "canon.supersede", "not_found", `superseding canon node not found: ${by}`, 1);
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("canon.supersede", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: actor,
      canon_id: oldId,
      superseded_by_canon_id: by,
      reason: rationale,
    });
    if (result.ok !== true) {
      return fail(args, "canon.supersede", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    }
    const canon = canonById(oldId);
    const payload = {
      ok: Boolean(canon),
      command: "canon.supersede",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      canon,
    };
    if (json) emitJson(payload);
    else emitPretty(`canon superseded: ${oldId} -> ${by}`);
    return canon ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

export function canonById(canonId: string): CanonNode | null {
  return canonRecords({ id: canonId })[0] ?? null;
}

export function canonRecords(filters: CanonFilters = {}): CanonNode[] {
  if (tableExists("canon_nodes")) {
    const where = [
      filters.id ? `canon_id = '${sqlEscape(filters.id)}'` : null,
      filters.kind ? `kind = '${sqlEscape(filters.kind)}'` : null,
      filters.sourceKind ? `source_kind = '${sqlEscape(filters.sourceKind)}'` : null,
      filters.sourceId ? `source_id = '${sqlEscape(filters.sourceId)}'` : null,
      filters.linkedTo ? `canon_id in (select canon_id from canon_links where target_id = '${sqlEscape(filters.linkedTo)}')` : null,
    ].filter(Boolean);
    const nodes = sqliteJson<CanonTableRow>(CANONICAL_DB, `
      select canon_id, kind, content_hash, body, source_kind, source_id,
             written_by_actor_id, approved_by_actor_id, written_at,
             superseded_by, superseded_at
      from canon_nodes
      ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
      order by written_at desc;
    `).map(normalizeCanonRow);
    const links = canonLinks(nodes.map((node) => node.canon_id));
    return nodes.map((node) => ({
      ...node,
      links: links.filter((link) => link.canon_id === node.canon_id),
    }));
  }
  return canonRecordsFromEvents(filters);
}

function canonLinks(ids: string[]): CanonLink[] {
  if (ids.length === 0 || !tableExists("canon_links")) return [];
  const quoted = ids.map((id) => `'${sqlEscape(id)}'`).join(",");
  return sqliteJson<CanonLink>(CANONICAL_DB, `
    select canon_id, kind, target_id
    from canon_links
    where canon_id in (${quoted})
    order by canon_id asc, kind asc, target_id asc;
  `);
}

function canonRecordsFromEvents(filters: CanonFilters): CanonNode[] {
  const rows = sqliteJson<CanonicalEventRow>(CANONICAL_DB, `
    select txid, event_id, kind, ts, actor, org_id, space_id, project_id,
           dispatch_id, execution_id, payload_json
    from events
    where kind in ('canon.written', 'canon.superseded')
    order by txid asc;
  `);
  const byId = new Map<string, CanonNode>();
  for (const row of rows) {
    const payload = parsePayload(row.payload_json);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
    const obj = payload as Record<string, unknown>;
    const canonId = stringValue(obj.canon_id);
    if (!canonId) continue;
    if (row.kind === "canon.written") {
      byId.set(canonId, {
        id: canonId,
        canon_id: canonId,
        kind: stringValue(obj.kind) ?? "observation",
        content_hash: stringValue(obj.content_hash) ?? "",
        body: stringValue(obj.body) ?? "",
        source_kind: stringValue(obj.source_kind) ?? "manual",
        source_id: stringValue(obj.source_id),
        written_by_actor_id: stringValue(obj.written_by_actor_id) ?? row.actor,
        approved_by_actor_id: stringValue(obj.approved_by_actor_id),
        written_at: stringValue(obj.written_at) ?? row.ts,
        superseded_by: null,
        superseded_at: null,
        links: linksFromPayload(obj.links, canonId),
      });
      continue;
    }
    const current = byId.get(canonId);
    if (!current) continue;
    byId.set(canonId, {
      ...current,
      superseded_by: stringValue(obj.superseded_by_canon_id),
      superseded_at: stringValue(obj.superseded_at) ?? row.ts,
    });
  }
  return [...byId.values()]
    .filter((node) =>
      (!filters.id || node.canon_id === filters.id) &&
      (!filters.kind || node.kind === filters.kind) &&
      (!filters.sourceKind || node.source_kind === filters.sourceKind) &&
      (!filters.sourceId || node.source_id === filters.sourceId) &&
      (!filters.linkedTo || node.links.some((link) => link.target_id === filters.linkedTo))
    )
    .sort((a, b) => b.written_at.localeCompare(a.written_at));
}

type CanonTableRow = {
  readonly canon_id: string;
  readonly kind: string;
  readonly content_hash: string;
  readonly body: string;
  readonly source_kind: string;
  readonly source_id: string | null;
  readonly written_by_actor_id: string;
  readonly approved_by_actor_id: string | null;
  readonly written_at: string;
  readonly superseded_by: string | null;
  readonly superseded_at: string | null;
};

function normalizeCanonRow(row: CanonTableRow): CanonNode {
  return {
    id: row.canon_id,
    canon_id: row.canon_id,
    kind: row.kind,
    content_hash: row.content_hash,
    body: row.body,
    source_kind: row.source_kind,
    source_id: row.source_id,
    written_by_actor_id: row.written_by_actor_id,
    approved_by_actor_id: row.approved_by_actor_id,
    written_at: row.written_at,
    superseded_by: row.superseded_by,
    superseded_at: row.superseded_at,
    links: [],
  };
}

function parseLinks(args: ParsedArgs): { ok: true; links: CanonLink[] } | { ok: false; error: string } {
  const raw = flagStrings(args, "link").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const links: CanonLink[] = [];
  for (const value of raw) {
    const index = value.indexOf(":");
    if (index <= 0 || index === value.length - 1) {
      return { ok: false, error: `invalid --link ${value}; expected kind:target-id` };
    }
    links.push({ canon_id: "", kind: value.slice(0, index), target_id: value.slice(index + 1) });
  }
  return { ok: true, links };
}

function linksFromPayload(value: unknown, canonId: string): CanonLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const obj = item as Record<string, unknown>;
    const kind = stringValue(obj.kind);
    const targetId = stringValue(obj.target_id);
    return kind && targetId ? [{ canon_id: canonId, kind, target_id: targetId }] : [];
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function fail(args: ParsedArgs, command: string, klass: string, message: string, code: number): number {
  const payload = { ok: false, command, error: { class: klass, message } };
  if (flagBool(args, "json")) emitJson(payload);
  else emitError(`${command}: ${message}`);
  return code;
}
