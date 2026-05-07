import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { connect } from "../ws-client.js";
import { reportError } from "./ping.js";
import { readProjection } from "./workspace-daemon.js";

type PresenceProjection = {
  readonly source?: string;
  readonly revision?: number;
  readonly sessions?: unknown[];
  readonly cursors?: unknown[];
  readonly app_locations?: unknown[];
  readonly window_outlines?: unknown[];
};

export async function runDesktop(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "presence";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runHelp(args);
  }
  if (verb === "presence") return runPresence(args);
  emitError(`ema desktop: unknown subcommand "${verb}" (expected: presence)`);
  return 64;
}

function runHelp(args: ParsedArgs): number {
  const commands = [
    { verb: "presence", summary: "Show daemon-backed shared desktop presence." },
    { verb: "presence join", summary: "Join a shared vDesktop presence room." },
    { verb: "presence cursor", summary: "Publish a named cursor position." },
    { verb: "presence location", summary: "Publish current app/window location." },
    { verb: "presence leave", summary: "Leave a shared vDesktop presence room." },
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "desktop", projection: "desktop.presence", commands });
    return 0;
  }
  emitPretty("ema desktop - shared vDesktop controls");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(18)} ${command.summary}`);
  return 0;
}

async function runPresence(args: ParsedArgs): Promise<number> {
  const action = args.positional[1] ?? "show";
  if (action === "show" || action === "list") return showPresence(args);
  if (action === "join") return sendPresence(args, "desktop.presence.join", await basePayload(args));
  if (action === "leave") {
    return sendPresence(args, "desktop.presence.leave", {
      session_id: flagString(args, "session") ?? "presence:cli",
    });
  }
  if (action === "cursor") {
    return sendPresence(args, "desktop.presence.cursor", {
      ...(await basePayload(args)),
      x: intFlag(args, "x", 0),
      y: intFlag(args, "y", 0),
      surface: flagString(args, "surface") ?? "desktop",
      window_id: flagString(args, "window") ?? null,
      app_id: flagString(args, "app") ?? null,
    });
  }
  if (action === "location") {
    const app = flagString(args, "app");
    if (!app) {
      emitError("ema desktop presence location: --app is required");
      return 64;
    }
    return sendPresence(args, "desktop.presence.location", {
      ...(await basePayload(args)),
      window_id: flagString(args, "window") ?? null,
      app_id: app,
      label: flagString(args, "label") ?? app,
    });
  }
  emitError(`ema desktop presence: unknown action "${action}" (expected: show | join | cursor | location | leave)`);
  return 64;
}

async function showPresence(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const projection = await readProjection<PresenceProjection>(args, {
    name: "desktop.presence",
    pick: (data) => data as PresenceProjection,
  });
  const payload = projection ?? {};
  if (json) {
    emitJson({ ok: true, command: "desktop presence show", projection: "desktop.presence", data: payload });
  } else {
    emitPretty("# desktop.presence");
    emitPretty(`source: ${payload.source ?? "(unavailable)"}`);
    emitPretty(`revision: ${payload.revision ?? 0}`);
    emitPretty(`sessions: ${payload.sessions?.length ?? 0}`);
    emitPretty(`cursors: ${payload.cursors?.length ?? 0}`);
    emitPretty(`app locations: ${payload.app_locations?.length ?? 0}`);
  }
  return 0;
}

async function sendPresence(
  args: ParsedArgs,
  op: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, payload);
    c.close();
    if (json) emitJson({ ok: result.ok, command: op, projection: "desktop.presence", result });
    else emitPretty(`${op}: ${result.ok ? "ok" : "failed"}`);
    return result.ok ? 0 : 1;
  } catch (err) {
    return reportError(err, json);
  }
}

async function basePayload(args: ParsedArgs): Promise<Record<string, unknown>> {
  const scope = await resolveWorkspaceScope({ args });
  return {
    org_id: flagString(args, "org") ?? scope.org_id ?? "org:local",
    space_id: flagString(args, "space") ?? scope.space_id ?? "space:local",
    room_id: flagString(args, "room") ?? "desktop_room:default",
    session_id: flagString(args, "session") ?? "presence:cli",
    actor_id: flagString(args, "actor") ?? "actor:codex",
    display_name: flagString(args, "name") ?? "Codex",
    color: flagString(args, "color") ?? "#5eead4",
  };
}

function intFlag(args: ParsedArgs, name: string, fallback: number): number {
  const raw = flagString(args, name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
