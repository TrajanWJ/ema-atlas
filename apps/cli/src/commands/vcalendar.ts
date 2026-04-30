import { connect, type EventEnvelope, type ProjectionEnvelope } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { vcalendarTick } from "../workspace-state.js";
import { runStubContract } from "./stub-contract.js";

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
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") return runVcalendarHelp(args);
  switch (sub) {
    case "show":
      return runShow(args);
    case "week":
      return runWeek(args);
    case "tick":
      return runTick(args);
    case "block":
      return runBlock(args);
    case "phase":
      return runPhase(args);
    case "tick-checkups":
      return runTickCheckups(args);
    default:
      emitError(
        `ema vcalendar: unknown subcommand "${sub ?? ""}" ` +
          `(expected: show | week | tick | block | phase)`
      );
      emitError(`See docs/cli/see-agent-work.md §vCalendar for grammar.`);
      return 64;
  }
}

function runVcalendarHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "vcalendar",
    status: "available",
    docRef: "docs/cli/see-agent-work.md",
    commands: [
      { verb: "show", flags: ["actor", "json"], summary: "Show an actor's calendar from daemon projections/events." },
      { verb: "week", flags: ["project", "json"], summary: "Show this week's vCalendar events." },
      { verb: "tick", flags: ["actor", "project", "json"], summary: "Compute the current planning/execution/review/handoff phase." },
      { verb: "block add", flags: ["actor", "kind", "label", "start", "end"], required: ["kind", "label"], summary: "Append a calendar block." },
      { verb: "block move", flags: ["block", "start", "end"], required: ["block", "start"], summary: "Move a calendar block." },
      { verb: "phase set", flags: ["actor", "label"], required: ["label"], summary: "Set the canonical phase label." },
      { verb: "tick-checkups", flags: ["actor", "json"], summary: "Run the on-demand checkup tick path." },
    ],
  });
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

type VcalendarMode = "planning" | "execution" | "review" | "handoff";

const PHASE_MODE: Record<string, VcalendarMode> = {
  "intake and orientation": "planning",
  "planning and lane claim": "planning",
  "execution block": "execution",
  "review and checkup": "review",
  "handoff and next-day queue": "handoff",
};

function modeFromHour(hour: number, fallback: VcalendarMode): VcalendarMode {
  if (hour < 9) return "planning";
  if (hour < 11) return "planning";
  if (hour < 16) return "planning";
  if (hour < 18) return "execution";
  if (hour < 24) return "review";
  return fallback;
}

function phaseToMode(
  phase: string,
  setAt: string | null,
  heuristicMode: VcalendarMode,
): VcalendarMode {
  const mapped = PHASE_MODE[phase];
  if (mapped) return mapped;
  if (setAt) {
    const date = new Date(setAt);
    if (!Number.isNaN(date.getTime())) {
      return modeFromHour(date.getHours(), heuristicMode);
    }
  }
  return heuristicMode;
}

interface VcalendarStateProjection {
  current_phase?: string | null;
  current_phase_set_at?: string | null;
  current_phase_set_by?: string | null;
  blocks?: unknown[];
  checkups?: unknown[];
}

async function readVcalendarState(): Promise<VcalendarStateProjection | null> {
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise<VcalendarStateProjection | null>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 1500);
      c.onMessage((msg) => {
        if (msg.type === "projection" && (msg as ProjectionEnvelope).name === "vcalendar.state") {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve((msg as ProjectionEnvelope).data as VcalendarStateProjection);
          }
        }
      });
      c.subscribe("vcalendar.state");
    });
    c.close();
    return data;
  } catch {
    return null;
  }
}

async function runTick(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const heuristic = vcalendarTick();
  const state = await readVcalendarState();

  const canonicalPhase =
    state && typeof state.current_phase === "string" && state.current_phase.length > 0
      ? state.current_phase
      : null;

  let phase = heuristic.phase;
  let mode: VcalendarMode = heuristic.mode as VcalendarMode;
  let source: string = "cli_computed_vcalendar_tick";
  let canonicalSetAt: string | null = null;
  let canonicalSetBy: string | null = null;
  let blocks: unknown[] = [];
  let checkupsDue: unknown[] = [];

  if (canonicalPhase) {
    phase = canonicalPhase;
    canonicalSetAt =
      typeof state?.current_phase_set_at === "string" ? state.current_phase_set_at : null;
    canonicalSetBy =
      typeof state?.current_phase_set_by === "string" ? state.current_phase_set_by : null;
    mode = phaseToMode(canonicalPhase, canonicalSetAt, heuristic.mode as VcalendarMode);
    source = "daemon_canonical_phase";
    blocks = Array.isArray(state?.blocks) ? state!.blocks! : [];
    checkupsDue = Array.isArray(state?.checkups)
      ? state!.checkups!.filter(
          (c) => (c as { status?: string }).status === "scheduled",
        )
      : [];
  }

  const tick = {
    now: heuristic.now,
    iso_week: heuristic.iso_week,
    phase,
    mode,
    should_plan: mode === "planning",
    should_checkup: mode === "review" || mode === "handoff",
    should_handoff: mode === "handoff",
    next_tick: heuristic.next_tick,
    instructions: heuristic.instructions,
  };

  if (json) {
    emitJson({
      ok: true,
      source,
      tick,
      canonical_phase_set_at: canonicalSetAt,
      canonical_phase_set_by: canonicalSetBy,
      blocks,
      checkups_due: checkupsDue,
    });
    return 0;
  }

  emitPretty(`# vcalendar tick`);
  emitPretty(`source: ${source}`);
  emitPretty(`phase: ${tick.phase}`);
  emitPretty(`mode: ${tick.mode}`);
  emitPretty(`now: ${tick.now}`);
  emitPretty(`next: ${tick.next_tick}`);
  if (canonicalSetAt) emitPretty(`set_at: ${canonicalSetAt}  by: ${canonicalSetBy ?? "?"}`);
  for (const instruction of tick.instructions) {
    emitPretty(`  - ${instruction}`);
  }
  if (blocks.length > 0) {
    emitPretty(`blocks:`);
    for (const block of blocks) {
      const b = block as { kind?: string; label?: string; start_at?: string; end_at?: string };
      emitPretty(
        `  ${b.start_at ?? "?"} → ${b.end_at ?? "?"}  ${b.kind ?? "?"}  ${b.label ?? ""}`,
      );
    }
  }
  if (checkupsDue.length > 0) {
    emitPretty(`checkups due:`);
    for (const checkup of checkupsDue) {
      const c = checkup as { id?: string; lane_id?: string; cadence?: string };
      emitPretty(`  ${c.id ?? "?"}  lane=${c.lane_id ?? "?"}  cadence=${c.cadence ?? "?"}`);
    }
  }
  return 0;
}

async function runTickCheckups(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	try {
		const c = await connect({ surface: "desktop" });
		const result = await c.command("vcalendar.checkup.tick", {});
		c.close();
		if (result.ok !== true) {
			if (json) emitJson({ ok: false, error: result.error });
			else emitError(`ema vcalendar tick-checkups: ${result.error.class}: ${result.error.message}`);
			return 1;
		}
		const data = (result as {
			data?: { emitted?: number; lane_ids?: string[]; skipped_unscoped?: number };
		}).data ?? {};
		const emitted = data.emitted ?? 0;
		const laneIds = data.lane_ids ?? [];
		const skippedUnscoped = data.skipped_unscoped ?? 0;
		// Translate emitted=0 into a human-readable reason so the silent-zero
		// case has a real diagnostic — see queue_item:01KQE5P02F015GF0KXM6KHZWWR.
		// `no_due_lanes` means the scan ran but nothing was over-cadence
		// (lanes are healthy, or no active/claimed lanes exist).
		// `skipped_unscoped` means due lanes were skipped because their
		// envelopes pre-date M1's envelope-scope plumbing (no org_id on the
		// lane.opened envelope) — backfill (M9) will fix.
		const reason =
			emitted === 0
				? skippedUnscoped > 0
					? "skipped_unscoped"
					: "no_due_lanes"
				: null;
		if (json) {
			emitJson({
				ok: true,
				emitted,
				lane_ids: laneIds,
				skipped_unscoped: skippedUnscoped,
				reason,
			});
		} else {
			emitPretty(`# vcalendar tick-checkups`);
			emitPretty(`emitted: ${emitted}`);
			if (skippedUnscoped > 0)
				emitPretty(`skipped_unscoped: ${skippedUnscoped}  (legacy lanes with no envelope org_id; M9 backfill required)`);
			if (reason) emitPretty(`reason: ${reason}`);
			for (const id of laneIds) emitPretty(`  + ${id}`);
		}
		return 0;
	} catch (err) {
		return reportError(err, json);
	}
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
