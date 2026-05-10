import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, filterProjectScopedRecords, readProjection, sendWorkspaceCommand, workspaceScopeContext } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

type ProblemGraph = { problems: ProblemRecord[]; solutions: unknown[]; links: unknown[] };
type ProblemRecord = { id: string; problem_id?: string; title?: string; status?: string; project_id?: string | null };

export async function runProblem(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runProblemHelp(args);
  if (verb === "log") return logProblem(args);
  if (verb === "solution") return addSolution(args);
  if (verb === "link") return linkProblem(args);
  if (verb === "show") return showProblem(args);
  return listProblems(args);
}

function runProblemHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "problem",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "log", flags: ["title", "project", "lane", "depends-on", "cause", "source", "recurs"], required: ["title"], summary: "Log a recurring blocker or failure pattern." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List problem graph nodes in scope." },
      { verb: "show", flags: ["project", "all-projects", "problem", "id"], required: ["problem or id"], summary: "Show a problem with solution and link context." },
      { verb: "solution", flags: ["problem", "title", "depends-on", "verify", "source"], required: ["problem", "title"], summary: "Attach a candidate or implemented solution to a problem." },
      { verb: "link", flags: ["from", "to", "relation"], required: ["from", "to", "relation"], summary: "Link problem graph nodes to lanes, queue items, or other problems." },
    ],
  });
}

async function logProblem(args: ParsedArgs): Promise<number> {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema problem log: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "problem.log", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    title,
    project_id: flagString(args, "project") ?? null,
    lane_id: flagString(args, "lane") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    cause: flagString(args, "cause") ?? null,
    source: flagString(args, "source") ?? null,
    recurs: flagString(args, "recurs") ?? null,
  }, { human: `logged problem "${title}"`, resourceLabel: "problem" });
}

async function addSolution(args: ParsedArgs): Promise<number> {
  const problem = flagString(args, "problem");
  const title = flagString(args, "title");
  if (!problem || !title) {
    emitError("ema problem solution: --problem and --title are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "problem.solution", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    problem_id: problem,
    title,
    depends_on: flagString(args, "depends-on") ?? null,
    verify: flagString(args, "verify") ?? null,
    source: flagString(args, "source") ?? null,
  }, { human: `added solution for ${problem}`, resourceLabel: "solution" });
}

async function linkProblem(args: ParsedArgs): Promise<number> {
  const from = flagString(args, "from");
  const to = flagString(args, "to");
  const relation = flagString(args, "relation");
  if (!from || !to || !relation) {
    emitError("ema problem link: --from, --to, and --relation are required");
    return 64;
  }
  const problem = from.startsWith("problem:") ? from : to.startsWith("problem:") ? to : from;
  return sendWorkspaceCommand(args, "problem.link", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    problem_id: problem,
    target_kind: from,
    target_value: to,
    relation,
  }, { human: `linked ${from} ${relation} ${to}` });
}

async function listProblems(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const graph = await loadGraph(args);
  if (!graph) return 1;
  if (json) emitJson({ ok: true, source: "problem.graph", ...graph });
  else {
    emitPretty("# problems");
    if (graph.problems.length === 0) emitPretty("  (none)");
    for (const problem of graph.problems) emitPretty(`  ${problem.id} [${problem.status ?? "open"}] ${problem.title ?? ""}`);
  }
  return 0;
}

async function showProblem(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const id = problemShowId(args);
  if (!id) {
    emitError("ema problem show: --problem or --id is required");
    return 64;
  }
  const graph = await loadGraph(args);
  if (!graph) return 1;
  const payload = problemShowJsonPayload(id, graph);
  const problem = payload.problem;
  if (json) emitJson(payload);
  else if (problem) emitPretty(JSON.stringify({ problem, solutions: graph.solutions, links: graph.links }, null, 2));
  else emitPretty(`problem not found: ${id}`);
  return problem ? 0 : 1;
}

export function problemShowId(args: ParsedArgs): string | undefined {
  return flagString(args, "problem") ?? flagString(args, "id") ?? positionalShowId(args, "show");
}

function positionalShowId(args: ParsedArgs, verb: string): string | undefined {
  const offset = args.positional[0] === verb ? 1 : args.positional[1] === verb ? 2 : -1;
  return offset >= 0 ? args.positional[offset] : undefined;
}

export function problemShowJsonPayload(id: string, graph: ProblemGraph): {
  ok: boolean;
  source: "problem.graph";
  problem: ProblemRecord | null;
  solutions: unknown[];
  links: unknown[];
  error: { class: "not_found"; message: string } | null;
} {
  const problem = graph.problems.find((item) => item.id === id || item.problem_id === id) ?? null;
  return {
    ok: problem !== null,
    source: "problem.graph",
    problem,
    solutions: graph.solutions,
    links: graph.links,
    error: problem ? null : {
      class: "not_found",
      message: `problem not found in resolved workspace scope: ${id}`,
    },
  };
}

async function loadGraph(args: ParsedArgs): Promise<ProblemGraph | null> {
  const context = await workspaceScopeContext(args);
  const graph = await readProjection(args, {
    name: "problem.graph",
    pick: (data) => ({
      problems: (data.problems as ProblemGraph["problems"] | undefined) ?? [],
      solutions: (data.solutions as unknown[] | undefined) ?? [],
      links: (data.links as unknown[] | undefined) ?? [],
    }),
  });
  if (!graph) return null;
  return {
    problems: filterProjectScopedRecords(graph.problems, context),
    solutions: graph.solutions,
    links: graph.links,
  };
}
