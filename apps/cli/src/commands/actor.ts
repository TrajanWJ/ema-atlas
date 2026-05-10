import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";
import { actorById, actorRecords, eventsMentioning } from "./pipeline-store.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";

export async function runActor(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "help";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "register") return register(args);
  if (verb === "list") return list(args);
  if (verb === "show") return show(args);
  emitError(`ema actor: unknown subcommand "${verb}" (expected: register | list | show)`);
  return 64;
}

function help(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "actor",
    status: "available",
    docRef: "packages/contracts/events/actor.md",
    commands: [
      {
        verb: "register",
        flags: ["id", "kind", "display-name", "dispatch", "perspective", "json"],
        required: ["id", "kind", "display-name"],
        summary: "Register a human or agent actor through the daemon canonical writer.",
      },
      {
        verb: "list",
        flags: ["kind", "json"],
        summary: "List actors by replaying actor.created events.",
      },
      {
        verb: "show",
        flags: ["json"],
        required: ["id"],
        summary: "Show one actor and the event rows that mention it.",
      },
    ],
  });
}

async function register(args: ParsedArgs): Promise<number> {
  const actorId = flagString(args, "id");
  const kind = flagString(args, "kind");
  const displayName = flagString(args, "display-name");
  if (!actorId || !kind || !displayName) {
    return fail(args, "actor.register", "invalid_args", "--id, --kind, and --display-name are required", 64);
  }
  if (kind !== "human" && kind !== "agent") {
    return fail(args, "actor.register", "invalid_args", "--kind must be human or agent", 64);
  }
  if (actorById(actorId)) {
    return fail(args, "actor.register", "duplicate_id", `actor already exists: ${actorId}`, 1);
  }
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("actor.register", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: actorId,
      target_kind: kind,
      display_name: displayName,
      provider: flagString(args, "dispatch") ?? null,
      relation: flagString(args, "perspective") ?? null,
      role: flagString(args, "role") ?? flagString(args, "perspective") ?? flagString(args, "dispatch") ?? kind,
    });
    if (result.ok !== true) return commandFailure(args, "actor.register", result.error.class, result.error.message);
    const actor = actorById(actorId);
    const payload = {
      ok: true,
      command: "actor.register",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      actor,
    };
    if (json) emitJson(payload);
    else emitPretty(`registered actor ${actorId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

function list(args: ParsedArgs): number {
  const kind = flagString(args, "kind");
  const actors = actorRecords().filter((actor) => !kind || actor.kind === kind);
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "actor.list",
      source: "canonical_sqlite_events",
      daemon_authority: "canonical_events",
      actors,
    });
  } else {
    for (const actor of actors) emitPretty(`${actor.actor_id} ${actor.kind} ${actor.display_name}`);
  }
  return 0;
}

function show(args: ParsedArgs): number {
  const actorId = args.positional[1] ?? flagString(args, "id");
  if (!actorId) return fail(args, "actor.show", "invalid_args", "actor id is required", 64);
  const actor = actorById(actorId);
  const payload = {
    ok: actor !== null,
    command: "actor.show",
    source: "canonical_sqlite_events",
    daemon_authority: "canonical_events",
    actor,
    events: actor ? eventsMentioning(actorId) : [],
    error: actor ? null : { class: "not_found", message: `actor not found: ${actorId}` },
  };
  if (flagBool(args, "json")) emitJson(payload);
  else if (actor) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`actor not found: ${actorId}`);
  return actor ? 0 : 1;
}

function commandFailure(args: ParsedArgs, command: string, errorClass: string, message: string): number {
  return fail(args, command, errorClass, message, errorClass === "invalid_args" ? 64 : 1);
}

function fail(
  args: ParsedArgs,
  command: string,
  errorClass: string,
  message: string,
  code: number,
): number {
  if (flagBool(args, "json")) {
    emitJson({ ok: false, command, error: { class: errorClass, message } });
  } else {
    emitError(`ema ${command}: ${errorClass}: ${message}`);
  }
  return code;
}
