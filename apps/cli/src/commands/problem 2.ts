import type { ParsedArgs } from "../args.js";
import { runStubContract } from "./stub-contract.js";

const DOC_REF = "docs/cli/agent-workspace.md";

export async function runProblem(args: ParsedArgs): Promise<number> {
  return runStubContract(args, {
    noun: "problem",
    docRef: DOC_REF,
    commands: [
      {
        verb: "log",
        flags: ["title", "project", "lane", "depends-on", "cause", "solution", "source", "recurs"],
        required: ["title"],
        summary: "Record a problem discovered during work, with cause, dependency, and candidate solution.",
      },
      {
        verb: "solution",
        flags: ["problem", "title", "depends-on", "verify", "source"],
        required: ["problem", "title"],
        summary: "Attach a proposed solution to a problem node.",
      },
      {
        verb: "link",
        flags: ["from", "to", "relation"],
        required: ["from", "to", "relation"],
        summary: "Link problem/solution/dependency nodes into a graph.",
      },
      {
        verb: "show",
        flags: ["problem"],
        required: ["problem"],
        summary: "Show a recursive problem and solution dependency graph.",
      },
      {
        verb: "list",
        flags: ["project", "lane", "status"],
        summary: "List open problem nodes and solution candidates.",
      },
    ],
  });
}
