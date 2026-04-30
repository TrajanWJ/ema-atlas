import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { connect, type ProjectionEnvelope } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";

const DOC_REF = "packages/contracts/events/blueprint.md";
const STRUCTURAL_PROJECTION = "blueprint.sections";
const PLANNER_PROJECTION = "blueprint.planner";
const DEFAULT_ORG = "org:01J00000000000000000000001";
const DEFAULT_ACTOR = "actor:dev-console";

type ProjectionResult = {
  received: boolean;
  name: string;
  data: Record<string, unknown> | null;
};

type BlueprintCommand = {
  verb: string;
  flags?: string[];
  required?: string[];
  summary: string;
  status: "available";
};

const COMMANDS: BlueprintCommand[] = [
  { verb: "status", summary: "Show installed Blueprint vApp + collab/structural state.", status: "available" },
  { verb: "list", summary: "Show all blueprint documents and sections from the daemon projection.", status: "available" },
  { verb: "planner", summary: "Show GAC, blocker, aspiration, and decision nodes from blueprint.planner.", status: "available" },
  {
    verb: "document create",
    flags: ["org", "space", "actor", "project", "title"],
    required: ["project", "title"],
    summary: "Create a structural Blueprint document.",
    status: "available",
  },
  {
    verb: "document rename",
    flags: ["org", "actor", "document", "title"],
    required: ["document", "title"],
    summary: "Rename a structural Blueprint document.",
    status: "available",
  },
  {
    verb: "document archive",
    flags: ["org", "actor", "document", "reason"],
    required: ["document"],
    summary: "Archive a structural Blueprint document.",
    status: "available",
  },
  {
    verb: "section add",
    flags: ["org", "space", "actor", "project", "document", "parent-section", "title", "position"],
    required: ["document", "title"],
    summary: "Add a structural Blueprint section under a document.",
    status: "available",
  },
  {
    verb: "section rename",
    flags: ["org", "actor", "section", "title"],
    required: ["section", "title"],
    summary: "Rename a structural Blueprint section.",
    status: "available",
  },
  {
    verb: "section move",
    flags: ["org", "actor", "section", "parent-section", "position"],
    required: ["section", "position"],
    summary: "Reparent or reorder a structural Blueprint section.",
    status: "available",
  },
  {
    verb: "section remove",
    flags: ["org", "actor", "section"],
    required: ["section"],
    summary: "Remove a structural Blueprint section (soft delete).",
    status: "available",
  },
  {
    verb: "gac create|answer|list",
    flags: ["document", "section", "question", "category", "priority", "gac", "result-action"],
    summary: "Create, answer, or list Blueprint GAC cards.",
    status: "available",
  },
  {
    verb: "blocker open|list",
    flags: ["title", "description", "category", "priority", "document", "section"],
    summary: "Open or list Blueprint blocker cards.",
    status: "available",
  },
  {
    verb: "aspiration capture|list",
    flags: ["title", "body", "timeframe", "origin-app", "origin-text"],
    summary: "Capture or list Blueprint aspirations.",
    status: "available",
  },
  {
    verb: "decision lock|list",
    flags: ["title", "body", "supersedes", "source-node"],
    summary: "Lock or list Blueprint canon-facing decisions.",
    status: "available",
  },
];

export async function runBlueprint(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  const subverb = args.positional[1];
  const help =
    flagBool(args, "help") ||
    args.flags.h === true ||
    verb === undefined ||
    verb === "help";

  if (help) return runHelp(args);
  if (verb === "status") return runStatus(args);
  if (verb === "list" || verb === "documents" || verb === "sections")
    return runList(args);
  if (verb === "planner") return runPlannerOverview(args);

  if (verb === "document") {
    if (subverb === "create") return runDocumentCreate(args);
    if (subverb === "rename") return runDocumentRename(args);
    if (subverb === "archive") return runDocumentArchive(args);
    emitError(
      `ema blueprint document: unknown subcommand "${subverb ?? ""}" (expected: create | rename | archive)`,
    );
    return 64;
  }

  if (verb === "section") {
    if (subverb === "add") return runSectionAdd(args);
    if (subverb === "rename") return runSectionRename(args);
    if (subverb === "move") return runSectionMove(args);
    if (subverb === "remove") return runSectionRemove(args);
    if (subverb === "promote") return runSectionPromote(args);
    emitError(
      `ema blueprint section: unknown subcommand "${subverb ?? ""}" (expected: add | rename | move | remove | promote)`,
    );
    return 64;
  }

  if (verb === "gac") {
    if (subverb === "create") return runGacCreate(args);
    if (subverb === "answer") return runGacAnswer(args);
    if (subverb === "list") return runPlannerList(args, "gac_cards", "GAC cards");
    emitError(
      `ema blueprint gac: unknown subcommand "${subverb ?? ""}" (expected: create | answer | list)`,
    );
    return 64;
  }

  if (verb === "blocker") {
    if (subverb === "open") return runBlockerOpen(args);
    if (subverb === "resolve") return runBlockerResolve(args);
    if (subverb === "list") return runPlannerList(args, "blockers", "Blockers");
    emitError(
      `ema blueprint blocker: unknown subcommand "${subverb ?? ""}" (expected: open | resolve | list)`,
    );
    return 64;
  }

  if (verb === "aspiration") {
    if (subverb === "capture") return runAspirationCapture(args);
    if (subverb === "list")
      return runPlannerList(args, "aspirations", "Aspirations");
    emitError(
      `ema blueprint aspiration: unknown subcommand "${subverb ?? ""}" (expected: capture | list)`,
    );
    return 64;
  }

  if (verb === "decision") {
    if (subverb === "lock") return runDecisionLock(args);
    if (subverb === "list") return runPlannerList(args, "decisions", "Decisions");
    emitError(
      `ema blueprint decision: unknown subcommand "${subverb ?? ""}" (expected: lock | list)`,
    );
    return 64;
  }

  if (verb === "graph") {
    if (subverb === "view" || subverb === undefined) return runGraphView(args);
    emitError(
      `ema blueprint graph: unknown subcommand "${subverb}" (expected: view)`,
    );
    return 64;
  }

  emitError(
    `ema blueprint: unknown subcommand "${verb}" (expected: help | status | list | document | section | gac | blocker | aspiration | decision | graph)`,
  );
  emitError(`See ${DOC_REF} for the structural event contract.`);
  return 64;
}

function runHelp(args: ParsedArgs): number {
  const json = flagBool(args, "json");
  if (json) {
    emitJson({
      ok: true,
      noun: "blueprint",
      daemon_authority: "canonical_events",
      projection: STRUCTURAL_PROJECTION,
      planner_projection: PLANNER_PROJECTION,
      commands: COMMANDS,
      doc: DOC_REF,
    });
    return 0;
  }

  emitPretty("ema blueprint — structural Blueprint document/section CRUD");
  emitPretty(`projection: ${STRUCTURAL_PROJECTION}`);
  emitPretty(`planner_projection: ${PLANNER_PROJECTION}`);
  emitPretty("");
  emitPretty("Usage: ema blueprint <subcommand> [flags...] [--json]");
  emitPretty("");
  for (const cmd of COMMANDS) {
    emitPretty(`  ${cmd.verb.padEnd(18)} ${cmd.summary}`);
    const flags = cmd.flags ?? [];
    if (flags.length > 0)
      emitPretty(`                     flags: ${flags.map((f) => `--${f}`).join(", ")}`);
    const required = cmd.required ?? [];
    if (required.length > 0)
      emitPretty(`                     required: ${required.map((f) => `--${f}`).join(", ")}`);
    emitPretty(`                     status: ${cmd.status}`);
  }
  emitPretty("");
  emitPretty(`Docs: ${DOC_REF}`);
  emitPretty("");
  emitPretty("Planner commands:");
  emitPretty("  ema blueprint planner [--json]");
  emitPretty("  ema blueprint gac create --document <id> --question \"...\"");
  emitPretty("  ema blueprint blocker open --title \"...\" --description \"...\"");
  emitPretty("  ema blueprint aspiration capture --title \"...\" --body \"...\"");
  emitPretty("  ema blueprint decision lock --title \"...\" --body \"...\"");
  return 0;
}

async function runStatus(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const [vapps, collab, structural] = await Promise.all([
      readProjection(c, "space.installed_vapps"),
      readProjection(c, "collab.document"),
      readProjection(c, STRUCTURAL_PROJECTION),
    ]);
    c.close();

    const installedVapp = findBlueprintVapp(vapps.data);
    const documents = structural.received
      ? readArray(structural.data, "documents")
      : [];
    const totalSections = documents.reduce(
      (n: number, doc: unknown) => n + readArray(doc as Record<string, unknown>, "sections").length,
      0,
    );

    const body = {
      ok: true,
      command: "blueprint status",
      daemon_authority: "canonical_events",
      installed_vapp: installedVapp,
      collab_document: summarizeCollabDocument(collab),
      structural_projection: {
        name: STRUCTURAL_PROJECTION,
        received: structural.received,
        document_count: documents.length,
        section_count: totalSections,
      },
      doc: DOC_REF,
    };

    if (json) emitJson(body);
    else {
      emitPretty("# blueprint");
      emitPretty(`installed_vapp: ${installedVapp ? "available" : "not visible"}`);
      const cd = body.collab_document as Record<string, unknown>;
      emitPretty(
        `collab_document: ${cd.received ? `${cd.document_id ?? "(unknown)"} (${cd.authority ?? "?"})` : cd.status}`,
      );
      emitPretty(
        `structural_projection: ${structural.received ? `${documents.length} doc(s), ${totalSections} section(s)` : "not visible"}`,
      );
      emitPretty(`docs: ${DOC_REF}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function runList(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const structural = await readProjection(c, STRUCTURAL_PROJECTION);
    c.close();

    const documents = structural.received
      ? readArray(structural.data, "documents")
      : [];

    const body = {
      ok: true,
      command: "blueprint list",
      source: STRUCTURAL_PROJECTION,
      received: structural.received,
      documents,
      doc: DOC_REF,
    };

    if (json) emitJson(body);
    else {
      emitPretty(`# blueprint list  (source: ${STRUCTURAL_PROJECTION})`);
      if (documents.length === 0) emitPretty("  (no documents)");
      for (const doc of documents) {
        const d = doc as Record<string, unknown>;
        const sections = readArray(d, "sections");
        emitPretty(
          `${d.id} [${d.status ?? "?"}] ${d.title ?? "(untitled)"}  — ${sections.length} section(s)`,
        );
        for (const sec of sections) {
          const s = sec as Record<string, unknown>;
          const parent = s.parent_section_id ? ` parent=${s.parent_section_id}` : "";
          emitPretty(
            `  ${String(s.position).padStart(3, " ")}. ${s.id} ${s.title ?? "(untitled)"}${parent}`,
          );
        }
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function runPlannerOverview(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const planner = await readProjection(c, PLANNER_PROJECTION);
    c.close();

    const body = {
      ok: true,
      command: "blueprint planner",
      source: PLANNER_PROJECTION,
      received: planner.received,
      planner: planner.data ?? {},
      doc: DOC_REF,
    };

    if (json) emitJson(body);
    else {
      emitPretty(`# blueprint planner  (source: ${PLANNER_PROJECTION})`);
      for (const key of ["gac_cards", "blockers", "aspirations", "decisions"]) {
        const rows = readArray(planner.data, key);
        emitPretty(`${key}: ${rows.length}`);
        for (const row of rows.slice(0, 8)) {
          const record = row as Record<string, unknown>;
          emitPretty(
            `  ${record.id ?? record.gac_id ?? record.blocker_id ?? record.aspiration_id ?? record.decision_id} ${record.title ?? record.question ?? record.status ?? ""}`,
          );
        }
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function runDocumentCreate(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const project = flagString(args, "project");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!project) {
    emitError("ema blueprint document create: --project is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint document create: --title is required");
    return 64;
  }
  return send(
    "blueprint.document.create",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      space_id: flagString(args, "space"),
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      project_id: project,
      title,
    }),
    { json, human: `created blueprint document "${title}"`, resourceLabel: "document" },
  );
}

async function runSectionAdd(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!document) {
    emitError("ema blueprint section add: --document is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint section add: --title is required");
    return 64;
  }
  const positionRaw = flagString(args, "position");
  let position: number | undefined;
  if (positionRaw !== undefined) {
    const parsedPosition = Number(positionRaw);
    if (!Number.isInteger(parsedPosition) || parsedPosition < 0) {
      emitError(`ema blueprint section add: --position must be a non-negative integer (got ${positionRaw})`);
      return 64;
    }
    position = parsedPosition;
  }
  return send(
    "blueprint.section.add",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      space_id: flagString(args, "space"),
      project_id: flagString(args, "project"),
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: document,
      parent_section_id: flagString(args, "parent-section"),
      title,
      position,
    }),
    { json, human: `added section "${title}" to ${document}`, resourceLabel: "section" },
  );
}

async function runDocumentRename(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!document) {
    emitError("ema blueprint document rename: --document is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint document rename: --title is required");
    return 64;
  }
  return send(
    "blueprint.document.rename",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: document,
      title,
    }),
    { json, human: `renamed blueprint document ${document} to "${title}"`, resourceLabel: "document" },
  );
}

async function runDocumentArchive(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  if (!document) {
    emitError("ema blueprint document archive: --document is required");
    return 64;
  }
  return send(
    "blueprint.document.archive",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: document,
      reason: flagString(args, "reason"),
    }),
    { json, human: `archived blueprint document ${document}`, resourceLabel: "document" },
  );
}

async function runSectionRename(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!section) {
    emitError("ema blueprint section rename: --section is required");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint section rename: --title is required");
    return 64;
  }
  return send(
    "blueprint.section.rename",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      section_id: section,
      title,
    }),
    { json, human: `renamed blueprint section ${section} to "${title}"`, resourceLabel: "section" },
  );
}

async function runSectionMove(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  if (!section) {
    emitError("ema blueprint section move: --section is required");
    return 64;
  }
  const positionRaw = flagString(args, "position");
  if (positionRaw === undefined) {
    emitError("ema blueprint section move: --position is required");
    return 64;
  }
  const position = Number(positionRaw);
  if (!Number.isInteger(position) || position < 0) {
    emitError(`ema blueprint section move: --position must be a non-negative integer (got ${positionRaw})`);
    return 64;
  }
  return send(
    "blueprint.section.move",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      section_id: section,
      parent_section_id: flagString(args, "parent-section"),
      position,
    }),
    { json, human: `moved blueprint section ${section} to position ${position}`, resourceLabel: "section" },
  );
}

async function runSectionPromote(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const section = flagString(args, "section");
	const title = flagString(args, "title") ?? flagString(args, "name");
	const body = flagString(args, "body");
	if (!section) {
		emitError("ema blueprint section promote: --section is required");
		return 64;
	}
	if (!title) {
		emitError("ema blueprint section promote: --title is required");
		return 64;
	}
	if (!body) {
		emitError("ema blueprint section promote: --body is required");
		return 64;
	}
	return send(
		"blueprint.section.promote",
		optionalArgs({
			org_id: flagString(args, "org") ?? DEFAULT_ORG,
			actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
			section_id: section,
			title,
			body,
		}),
		{ json, human: `promoted section ${section} to proposal`, resourceLabel: "proposal" },
	);
}

async function runSectionRemove(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const section = flagString(args, "section");
  if (!section) {
    emitError("ema blueprint section remove: --section is required");
    return 64;
  }
  return send(
    "blueprint.section.remove",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      section_id: section,
    }),
    { json, human: `removed blueprint section ${section}`, resourceLabel: "section" },
  );
}

// ---------------------------------------------------------------------------
// Planner subcommands: gac / blocker / aspiration / decision
// ---------------------------------------------------------------------------

async function runGacCreate(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const document = flagString(args, "document");
  const category = flagString(args, "category");
  const priority = flagString(args, "priority");
  const question = flagString(args, "question");
  if (!document) {
    emitError("ema blueprint gac create: --document is required");
    return 64;
  }
  if (!category) {
    emitError("ema blueprint gac create: --category is required (gap | assumption | clarification)");
    return 64;
  }
  if (!priority) {
    emitError("ema blueprint gac create: --priority is required (critical | high | medium | low)");
    return 64;
  }
  if (!question) {
    emitError("ema blueprint gac create: --question is required");
    return 64;
  }
  return send(
    "blueprint.gac.create",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: document,
      section_id: flagString(args, "section"),
      category,
      priority,
      question,
    }),
    { json, human: `created GAC card`, resourceLabel: "gac" },
  );
}

async function runGacAnswer(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const gac = flagString(args, "gac");
  const resultAction = flagString(args, "result-action");
  if (!gac) {
    emitError("ema blueprint gac answer: --gac is required");
    return 64;
  }
  if (!resultAction) {
    emitError(
      "ema blueprint gac answer: --result-action is required (create_canon | create_intent | update_node | defer_to_blocker)",
    );
    return 64;
  }
  return send(
    "blueprint.gac.answer",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      gac_id: gac,
      selected: flagString(args, "selected"),
      freeform: flagString(args, "note"),
      result_action: resultAction,
      target: flagString(args, "target"),
    }),
    { json, human: `answered GAC ${gac}`, resourceLabel: "gac" },
  );
}

async function runBlockerOpen(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const category = flagString(args, "category");
  const priority = flagString(args, "priority");
  const title = flagString(args, "title") ?? flagString(args, "name");
  if (!category) {
    emitError("ema blueprint blocker open: --category is required (tricky_question | deferred_decision | blocking_dependency)");
    return 64;
  }
  if (!priority) {
    emitError("ema blueprint blocker open: --priority is required (critical | high | medium | low)");
    return 64;
  }
  if (!title) {
    emitError("ema blueprint blocker open: --title is required");
    return 64;
  }
  return send(
    "blueprint.blocker.open",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      document_id: flagString(args, "document"),
      section_id: flagString(args, "section"),
      category,
      priority,
      title,
      description: flagString(args, "description"),
      refresh_by: flagString(args, "resolve-by"),
      gac_id: flagString(args, "promoted-from"),
    }),
    { json, human: `opened blocker "${title}"`, resourceLabel: "blocker" },
  );
}

async function runBlockerResolve(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const blocker = flagString(args, "blocker");
  if (!blocker) {
    emitError("ema blueprint blocker resolve: --blocker is required");
    return 64;
  }
  return send(
    "blueprint.blocker.resolve",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      blocker_id: blocker,
      target: flagString(args, "resolved-to"),
      reason: flagString(args, "note"),
    }),
    { json, human: `resolved blocker ${blocker}`, resourceLabel: "blocker" },
  );
}

async function runAspirationCapture(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const title = flagString(args, "title") ?? flagString(args, "name");
  const timeframe = flagString(args, "timeframe");
  if (!title) {
    emitError("ema blueprint aspiration capture: --title is required");
    return 64;
  }
  if (!timeframe) {
    emitError("ema blueprint aspiration capture: --timeframe is required (near_term | mid_term | long_term | aspirational)");
    return 64;
  }
  return send(
    "blueprint.aspiration.capture",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      title,
      description: flagString(args, "description"),
      timeframe,
      source_type: flagString(args, "source-type") ?? "manual_tag",
      origin_app: flagString(args, "origin-app"),
      origin_text: flagString(args, "origin-text"),
    }),
    { json, human: `captured aspiration "${title}"`, resourceLabel: "aspiration" },
  );
}

async function runDecisionLock(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const title = flagString(args, "title") ?? flagString(args, "name");
  const body = flagString(args, "body");
  if (!title) {
    emitError("ema blueprint decision lock: --title is required");
    return 64;
  }
  if (!body) {
    emitError("ema blueprint decision lock: --body is required");
    return 64;
  }
  return send(
    "blueprint.decision.lock",
    optionalArgs({
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
      title,
      body,
      supersedes: flagString(args, "supersedes"),
      source_node: flagString(args, "source-node"),
    }),
    { json, human: `locked decision "${title}"`, resourceLabel: "decision" },
  );
}

async function runGraphView(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const graph = await readProjection(c, "intent_graph");
    c.close();

    if (!graph.received) {
      emitError("ema blueprint graph view: daemon did not return intent_graph projection");
      return 1;
    }
    const nodes = readArray(graph.data, "nodes");
    const edges = readArray(graph.data, "edges");
    if (json) {
      emitJson({
        ok: true,
        command: "blueprint graph view",
        source: "intent_graph",
        node_count: nodes.length,
        edge_count: edges.length,
        nodes,
        edges,
      });
    } else {
      const kindCounts: Record<string, number> = {};
      for (const n of nodes) {
        const k = (n as { kind?: string }).kind ?? "?";
        kindCounts[k] = (kindCounts[k] ?? 0) + 1;
      }
      const relationCounts: Record<string, number> = {};
      for (const e of edges) {
        const r = (e as { relation?: string }).relation ?? "?";
        relationCounts[r] = (relationCounts[r] ?? 0) + 1;
      }
      emitPretty(`# intent graph  (source: intent_graph)`);
      emitPretty(`nodes: ${nodes.length}  ·  edges: ${edges.length}`);
      emitPretty("by kind:");
      for (const [k, n] of Object.entries(kindCounts).sort()) {
        emitPretty(`  ${k.padEnd(12)} ${n}`);
      }
      emitPretty("by relation:");
      for (const [r, n] of Object.entries(relationCounts).sort()) {
        emitPretty(`  ${r.padEnd(14)} ${n}`);
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function runPlannerList(
  args: ParsedArgs,
  field: "gac_cards" | "blockers" | "aspirations" | "decisions",
  label: string,
): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const planner = await readProjection(c, "blueprint.planner");
    c.close();

    const items = planner.received ? readArray(planner.data, field) : [];
    const body = {
      ok: true,
      command: `blueprint ${field}`,
      source: "blueprint.planner",
      received: planner.received,
      [field]: items,
      doc: DOC_REF,
    };
    if (json) emitJson(body);
    else {
      emitPretty(`# ${label}  (source: blueprint.planner)`);
      if (items.length === 0) emitPretty(`  (no ${label.toLowerCase()})`);
      for (const item of items) {
        const r = item as Record<string, unknown>;
        const id = (r.id as string) ?? "(no id)";
        const status = (r.status as string) ?? "?";
        const title = (r.title as string) ?? (r.question as string) ?? "(untitled)";
        emitPretty(`  ${id} [${status}] ${title}`);
      }
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function send(
  op: string,
  argsObj: Record<string, unknown>,
  out: { json: boolean; human: string; resourceLabel?: string },
): Promise<number> {
  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, argsObj);
    c.close();

    if (result.ok !== true) {
      const message = result.error.message.toLowerCase();
      const isMissingHandler =
        result.error.class === "unknown_command" ||
        message.includes("unknown command") ||
        message.includes("no handler");
      if (isMissingHandler) {
        const body = {
          ok: false,
          op,
          status: "blocked_missing_ipc_handler",
          blocked_by: `daemon shell IPC has no handler for ${op}`,
          doc: DOC_REF,
        };
        if (out.json) emitJson(body);
        else {
          emitPretty(`ema ${op}: blocked_missing_ipc_handler`);
          emitPretty(`  blocked_by: ${body.blocked_by}`);
          emitPretty(`  docs: ${DOC_REF}`);
        }
        return 1;
      }
      if (out.json) emitJson({ ok: false, error: result.error });
      else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = (result as { warning?: { class?: string; message?: string } }).warning ?? null;
    if (out.json) emitJson({ ok: true, op, args: argsObj, events, resource, warning });
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
      if (warning?.message) emitPretty(`[warn] ${warning.class ?? "warning"}: ${warning.message}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}

function optionalArgs(args: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined));
}

function readProjection(
  c: { onMessage: (fn: (msg: unknown) => void) => void; subscribe: (channel: string) => void },
  channel: string,
): Promise<ProjectionResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(
      () => resolve({ received: false, name: channel, data: null }),
      1500,
    );
    c.onMessage((msg) => {
      const env = msg as ProjectionEnvelope;
      if (env.type === "projection" && env.name === channel) {
        clearTimeout(timer);
        resolve({ received: true, name: channel, data: env.data });
      }
    });
    c.subscribe(channel);
  });
}

function findBlueprintVapp(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const vapps = [...readArray(data, "vapps"), ...readArray(data, "apps")];
  return (
    (vapps.find((item) => {
      const record = item as Record<string, unknown>;
      return (
        record.slug === "blueprint" ||
        record.id === "vapp-install-blueprint" ||
        record.installation_id === "vapp-install-blueprint"
      );
    }) as Record<string, unknown> | undefined) ?? null
  );
}

function summarizeCollabDocument(projection: ProjectionResult): Record<string, unknown> {
  if (!projection.received || !projection.data) {
    return { received: false, status: "not_visible" };
  }
  return {
    received: true,
    document_id: projection.data.document_id ?? null,
    title: projection.data.title ?? null,
    target: projection.data.target ?? null,
    revision: projection.data.revision ?? projection.data.version ?? null,
    status: projection.data.status ?? null,
    authority: projection.data.authority ?? null,
    storage_authority: projection.data.storage_authority ?? null,
    updated_at: projection.data.updated_at ?? null,
  };
}

function readArray(data: Record<string, unknown> | null, key: string): unknown[] {
  if (!data) return [];
  const value = data[key];
  return Array.isArray(value) ? value : [];
}
