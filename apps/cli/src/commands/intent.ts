import { readFileSync } from "node:fs";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";
import {
  eventsMentioning,
  intentById,
  intentRecords,
  proposalsForIntent,
  type IntentRecord,
} from "./pipeline-store.js";

const KINDS = new Set(["bootstrap", "feature", "fix", "research", "doctrine", "external"]);
const STATUSES = new Set(["open", "proposed", "accepted", "executing", "satisfied", "superseded", "abandoned"]);
const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  open: ["proposed", "abandoned", "superseded"],
  proposed: ["open", "accepted", "abandoned", "superseded"],
  accepted: ["executing", "satisfied", "abandoned", "superseded"],
  executing: ["satisfied", "abandoned", "superseded"],
  satisfied: ["superseded"],
  abandoned: [],
  superseded: [],
};

export async function runIntent(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "create") return create(args);
  if (verb === "list") return list(args);
  if (verb === "show") return show(args);
  if (verb === "update") return update(args);
  emitError(`ema intent: unknown subcommand "${verb}" (expected: create | list | show | update)`);
  return 64;
}

function help(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "intent",
    status: "available",
    docRef: "packages/contracts/events/intent.md",
    commands: [
      {
        verb: "create",
        flags: ["id", "title", "kind", "actor", "project", "space", "body", "body-file", "exit-condition", "json"],
        required: ["id", "title", "kind", "actor"],
        summary: "Create a canonical pipeline-floor intent.",
      },
      { verb: "list", flags: ["project", "space", "actor", "status", "kind", "json"], summary: "List canonical intents." },
      { verb: "show", flags: ["json"], required: ["id"], summary: "Show one intent with events and linked proposals." },
      {
        verb: "update",
        flags: ["title", "status", "body", "body-file", "exit-condition", "actor", "reason", "json"],
        required: ["id", "actor", "reason", "at least one changed field"],
        summary: "Update an intent and emit intent.updated.",
      },
    ],
  });
}

async function create(args: ParsedArgs): Promise<number> {
  const intentId = flagString(args, "id");
  const title = flagString(args, "title");
  const kind = flagString(args, "kind");
  const actor = flagString(args, "actor");
  if (!intentId || !title || !kind || !actor) {
    return fail(args, "intent.create", "invalid_args", "--id, --title, --kind, and --actor are required", 64);
  }
  if (!KINDS.has(kind)) return fail(args, "intent.create", "invalid_args", `invalid kind: ${kind}`, 64);
  if (intentById(intentId)) return fail(args, "intent.create", "duplicate_id", `intent already exists: ${intentId}`, 1);
  const body = readBody(args);
  const slug = flagString(args, "slug") ?? slugFromTitle(title);
  return writeIntentCommand(args, "intent.create", {
    intent: intentId,
    title,
    target_kind: kind,
    status: "open",
    actor_id: actor,
    project_id: flagString(args, "project") ?? null,
    space_id: flagString(args, "space") ?? null,
    body,
    label: slug,
    done_when: flagString(args, "exit-condition") ?? null,
  }, intentId, "created");
}

function list(args: ParsedArgs): number {
  const intents = intentRecords({
    project: flagString(args, "project"),
    space: flagString(args, "space"),
    actor: flagString(args, "actor"),
    status: flagString(args, "status"),
    kind: flagString(args, "kind"),
  });
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "intent.list",
      source: "canonical_sqlite",
      daemon_authority: "canonical_events",
      intents,
    });
  } else {
    for (const intent of intents) emitPretty(`${intent.intent_id} ${intent.status} ${intent.title}`);
  }
  return 0;
}

function show(args: ParsedArgs): number {
  const intentId = args.positional[1] ?? flagString(args, "id");
  if (!intentId) return fail(args, "intent.show", "invalid_args", "intent id is required", 64);
  const intent = intentById(intentId);
  const payload = intentPayload("intent.show", intentId, intent);
  if (flagBool(args, "json")) emitJson(payload);
  else if (intent) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`intent not found: ${intentId}`);
  return intent ? 0 : 1;
}

async function update(args: ParsedArgs): Promise<number> {
  const intentId = args.positional[1] ?? flagString(args, "id");
  const actor = flagString(args, "actor");
  const reason = flagString(args, "reason");
  if (!intentId || !actor || !reason) {
    return fail(args, "intent.update", "invalid_args", "intent id, --actor, and --reason are required", 64);
  }
  const current = intentById(intentId);
  if (!current) return fail(args, "intent.update", "not_found", `intent not found: ${intentId}`, 1);
  const body = readBody(args);
  const requestedStatus = flagString(args, "status");
  if (requestedStatus && !STATUSES.has(requestedStatus)) {
    return fail(args, "intent.update", "invalid_args", `invalid status: ${requestedStatus}`, 64);
  }
  if (requestedStatus && requestedStatus !== current.status && !canTransition(current.status, requestedStatus)) {
    return fail(args, "intent.update", "invalid_transition", `invalid status transition: ${current.status} -> ${requestedStatus}`, 1);
  }
  const changes = changedFields(current, {
    title: flagString(args, "title") ?? null,
    status: requestedStatus ?? null,
    body,
    exit_condition: flagString(args, "exit-condition") ?? null,
  });
  if (changes.length === 0) {
    return fail(args, "intent.update", "invalid_args", "at least one changed field is required", 64);
  }
  return writeIntentCommand(args, "intent.update", {
    intent: intentId,
    actor_id: actor,
    title: flagString(args, "title") ?? null,
    status: requestedStatus ?? null,
    body,
    done_when: flagString(args, "exit-condition") ?? null,
    reason,
    changed: changes.join(","),
  }, intentId, "updated");
}

async function writeIntentCommand(
  args: ParsedArgs,
  op: "intent.create" | "intent.update",
  argsObj: Record<string, unknown>,
  intentId: string,
  verb: "created" | "updated",
): Promise<number> {
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command(op, { org_id: flagString(args, "org") ?? DEFAULT_ORG, ...argsObj });
    if (result.ok !== true) return fail(args, op, result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const intent = intentById(intentId);
    const payload = {
      ok: true,
      command: op,
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      intent,
    };
    if (json) emitJson(payload);
    else emitPretty(`${verb} intent ${intentId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

export function intentPayload(command: string, intentId: string, intent: IntentRecord | null) {
  return {
    ok: intent !== null,
    command,
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    intent,
    proposals: intent ? proposalsForIntent(intentId) : [],
    events: intent ? eventsMentioning(intentId) : [],
    error: intent ? null : { class: "not_found", message: `intent not found: ${intentId}` },
  };
}

function canTransition(from: string, to: string): boolean {
  return (ALLOWED_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

function changedFields(
  current: IntentRecord,
  candidate: { title: string | null; status: string | null; body: string | null; exit_condition: string | null },
): string[] {
  const changes: string[] = [];
  if (candidate.title !== null && candidate.title !== current.title) changes.push("title");
  if (candidate.status !== null && candidate.status !== current.status) changes.push("status");
  if (candidate.body !== null && candidate.body !== current.body) changes.push("body");
  if (candidate.exit_condition !== null && candidate.exit_condition !== current.exit_condition) changes.push("exit_condition");
  return changes;
}

function readBody(args: ParsedArgs): string | null {
  const bodyFile = flagString(args, "body-file");
  if (bodyFile) return readFileSync(bodyFile, "utf8");
  return flagString(args, "body") ?? null;
}

function slugFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "intent";
}

function fail(
  args: ParsedArgs,
  command: string,
  errorClass: string,
  message: string,
  code: number,
): number {
  if (flagBool(args, "json")) emitJson({ ok: false, command, error: { class: errorClass, message } });
  else emitError(`ema ${command}: ${errorClass}: ${message}`);
  return code;
}
