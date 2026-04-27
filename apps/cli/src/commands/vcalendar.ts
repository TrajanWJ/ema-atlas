import { connect, type EventEnvelope, type ProjectionEnvelope } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";

// ---------------------------------------------------------------------------
// Defaults — match the first-boot seed so `ema vcalendar ...` works against
// the canonical Founding-Fathers-EMA org without flags in development.
// ---------------------------------------------------------------------------

const DEFAULT_ORG = "org:01J00000000000000000000001";
const DEFAULT_ACTOR = "actor:dev-console";

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export async function runVcalendar(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  switch (sub) {
    case "show":
      return runShow(args);
    case "week":
      return runWeek(args);
    case "block":
      return runBlock(args);
    case "phase":
      return runPhase(args);
    default:
      emitError(
        `ema vcalendar: unknown subcommand "${sub ?? ""}" ` +
          `(expected: show | week | block | phase)`
      );
      emitError(`See docs/cli/see-agent-work.md §vCalendar for grammar.`);
      return 64;
  }
}

// ---------------------------------------------------------------------------
// Block: add | move
// ---------------------------------------------------------------------------

async function runBlock(args: ParsedArgs): Promise<number> {
  const verb = args.positional[1];
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;

  if (verb === "add") {
    const kind = flagString(args, "kind");
    const label = flagString(args, "label");
    const startAt = flagString(args, "start-at") ?? flagString(args, "start");
    const endAt = flagString(args, "end-at") ?? flagString(args, "end");

    if (!kind || !label) {
      emitError(`ema vcalendar block add: --kind and --label are required`);
      emitError(
        `Usage: ema vcalendar block add --actor actor:<id> --kind focus --label "..."`
      );
      return 64;
    }

    return await send("vcalendar.block.add", {
      org_id: org,
      actor_id: actor,
      block_kind: kind,
      label,
      start_at: startAt ?? null,
      end_at: endAt ?? null,
    }, {
      json,
      human: `added ${kind} block "${label}" for ${actor}`,
      resourceLabel: "block",
    });
  }

  if (verb === "move") {
    const blockId = flagString(args, "block");
    const startAt = flagString(args, "start-at") ?? flagString(args, "start");
    const endAt = flagString(args, "end-at") ?? flagString(args, "end");

    if (!blockId || !startAt) {
      emitError(`ema vcalendar block move: --block and --start (or --start-at) are required`);
      emitError(
        `Usage: ema vcalendar block move --block calendar_block:<id> --start "2026-04-24T15:00:00-04:00"`
      );
      return 64;
    }

    return await send("vcalendar.block.move", {
      org_id: org,
      actor_id: actor,
      block_id: blockId,
      start_at: startAt,
      end_at: endAt ?? null,
    }, { json, human: `moved ${blockId} → ${startAt}` });
  }

  emitError(
    `ema vcalendar block: unknown verb "${verb ?? ""}" (expected: add | move)`
  );
  return 64;
}

// ---------------------------------------------------------------------------
// Phase: set
// ---------------------------------------------------------------------------

async function runPhase(args: ParsedArgs): Promise<number> {
  const verb = args.positional[1];
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;

  if (verb === "set") {
    const label = flagString(args, "label");
    if (!label) {
      emitError(`ema vcalendar phase set: --label is required`);
      emitError(
        `Usage: ema vcalendar phase set --actor actor:<id> --label "Implementation Week"`
      );
      return 64;
    }

    return await send("vcalendar.phase.set", {
      org_id: org,
      actor_id: actor,
      label,
    }, { json, human: `set phase "${label}" for ${actor}` });
  }

  emitError(
    `ema vcalendar phase: unknown verb "${verb ?? ""}" (expected: set)`
  );
  return 64;
}

// ---------------------------------------------------------------------------
// Reads: show | week
//
// Wave 1: subscribes briefly to the event_trail projection (last-8 events),
// filters to vcalendar / calendar_block / checkup kinds, prints.
// Richer reads arrive when a dedicated vcalendar projection lands; that is
// tracked in docs/cli/see-agent-work.md §vCalendar.
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  kind: string;
  label: string;
  ts: string;
}

async function runShow(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const actor = flagString(args, "actor");
  return await runReadQuery(args, json, {
    header: actor ? `vcalendar for ${actor}` : `vcalendar (all actors)`,
    actor,
  });
}

async function runWeek(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const project = flagString(args, "project");
  return await runReadQuery(args, json, {
    header: project ? `vcalendar week for project ${project}` : `vcalendar week`,
  });
}

async function runReadQuery(
  _args: ParsedArgs,
  json: boolean,
  opts: { header: string; actor?: string }
): Promise<number> {
  try {
    const c = await connect({ surface: "desktop" });
    const eventTrailRows: EventRow[] = await new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve([]);
        }
      }, 1200);
      c.onMessage((msg) => {
        if (msg.type === "projection" && (msg as ProjectionEnvelope).name === "event_trail") {
          const data = (msg as ProjectionEnvelope).data as { events?: EventRow[] };
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(data.events ?? []);
          }
        }
      });
      c.subscribe("event_trail");
    });
    c.close();

    const relevant = eventTrailRows.filter((row) =>
      row.kind.startsWith("vcalendar.") ||
      row.kind.startsWith("calendar_block.") ||
      row.kind.startsWith("checkup.")
    );

    if (json) {
      emitJson({
        ok: true,
        header: opts.header,
        events: relevant,
        note: "event_trail projection returns up to 8 recent events; a dedicated vcalendar projection is pending.",
      });
    } else {
      emitPretty(`# ${opts.header}`);
      if (relevant.length === 0) {
        emitPretty(`  (no vcalendar events in the last 8-event window)`);
        emitPretty(
          `  Tip: run \`ema events tail --family calendar_block\` or \`ema events tail --family checkup\` for a live stream.`
        );
      } else {
        for (const row of relevant) {
          emitPretty(`  ${row.ts}  ${row.kind.padEnd(24)}  ${row.label}`);
        }
        emitPretty(
          `  (last-8 window from event_trail projection; richer vcalendar projection is pending)`
        );
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

// ---------------------------------------------------------------------------
// Shared send helper — connect, command, report, close.
// ---------------------------------------------------------------------------

async function send(
  op: string,
  argsObj: Record<string, unknown>,
  out: { json: boolean; human: string; resourceLabel?: string }
): Promise<number> {
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, argsObj);
    c.close();

    if (result.ok !== true) {
      if (out.json) emitJson({ ok: false, error: result.error });
      else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    if (out.json) {
      emitJson({ ok: true, op, args: argsObj, events, resource });
    } else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}

// Re-export the EventEnvelope type so TS does not complain about unused imports.
export type { EventEnvelope };
