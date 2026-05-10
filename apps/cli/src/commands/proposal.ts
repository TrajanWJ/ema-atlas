import { readFileSync } from "node:fs";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { maybeRunVerbHelp, runStubContract, type StubCommand } from "./stub-contract.js";
import { DEFAULT_ORG } from "./workspace-daemon.js";
import {
  actorById,
  eventsMentioning,
  intentById,
  proposalById,
  proposalRecords,
  type ProposalRecord,
} from "./pipeline-store.js";

const PROPOSAL_COMMANDS: StubCommand[] = [
  {
    verb: "create",
    flags: ["id", "intent", "title", "body", "body-file", "plan", "plan-file", "proposed-by", "no-approval-required", "json"],
    required: ["id", "intent", "title", "proposed-by"],
    summary: "Create a canonical proposal under an intent.",
  },
  { verb: "approve", flags: ["actor", "rationale", "json"], required: ["id", "actor", "rationale"], summary: "Approve a proposal." },
  { verb: "reject", flags: ["actor", "rationale", "json"], required: ["id", "actor", "rationale"], summary: "Reject a proposal." },
  { verb: "list", flags: ["intent", "status", "json"], summary: "List proposals." },
  { verb: "show", flags: ["json"], required: ["id"], summary: "Show one proposal with events and parent intent." },
];

const PROPOSAL_STUB_OPTS = {
  noun: "proposal",
  status: "available",
  docRef: "packages/contracts/events/proposal.md",
  commands: PROPOSAL_COMMANDS,
};

const CLOSED_INTENT_STATUSES = new Set(["satisfied", "abandoned", "superseded"]);
const DECIDED_PROPOSAL_STATUSES = new Set(["approved", "rejected", "withdrawn"]);

export async function runProposal(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "help";
  const helpExit = maybeRunVerbHelp(args, PROPOSAL_STUB_OPTS);
  if (helpExit !== null) return helpExit;
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb === "create") return create(args);
  if (verb === "approve") return decide(args, "approve");
  if (verb === "reject") return decide(args, "reject");
  if (verb === "list") return list(args);
  if (verb === "show") return show(args);
  emitError(`ema proposal: unknown subcommand "${verb}" (expected: create | approve | reject | list | show)`);
  return 64;
}

function help(args: ParsedArgs): number {
  return runStubContract(args, PROPOSAL_STUB_OPTS);
}

async function create(args: ParsedArgs): Promise<number> {
  const proposalId = flagString(args, "id");
  const intentId = flagString(args, "intent");
  const title = flagString(args, "title");
  const proposedBy = flagString(args, "proposed-by");
  if (!proposalId || !intentId || !title || !proposedBy) {
    return fail(args, "proposal.create", "invalid_args", "--id, --intent, --title, and --proposed-by are required", 64);
  }
  if (proposalById(proposalId)) {
    return fail(args, "proposal.create", "duplicate_id", `proposal already exists: ${proposalId}`, 1);
  }
  const intent = intentById(intentId);
  if (!intent) return fail(args, "proposal.create", "not_found", `intent not found: ${intentId}`, 1);
  if (CLOSED_INTENT_STATUSES.has(intent.status)) {
    return fail(args, "proposal.create", "invalid_intent_status", `intent status disallows new proposals: ${intent.status}`, 1);
  }
  const approverRequired = !flagBool(args, "no-approval-required");
  const body = readFlagOrFile(args, "body", "body-file");
  const plan = readFlagOrFile(args, "plan", "plan-file");
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command("proposal.create", {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      target: proposalId,
      intent: intentId,
      title,
      body,
      context: plan,
      actor_id: proposedBy,
      verified: approverRequired ? "true" : "false",
    });
    if (result.ok !== true) return fail(args, "proposal.create", result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const proposal = proposalById(proposalId);
    const payload = {
      ok: true,
      command: "proposal.create",
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      proposal,
    };
    if (json) emitJson(payload);
    else emitPretty(`created proposal ${proposalId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

async function decide(args: ParsedArgs, decision: "approve" | "reject"): Promise<number> {
  const proposalId = args.positional[1] ?? flagString(args, "id");
  const actor = flagString(args, "actor");
  const rationale = flagString(args, "rationale");
  if (!proposalId || !actor || !rationale) {
    return fail(args, `proposal.${decision}`, "invalid_args", "proposal id, --actor, and --rationale are required", 64);
  }
  const proposal = proposalById(proposalId);
  if (!proposal) return fail(args, `proposal.${decision}`, "not_found", `proposal not found: ${proposalId}`, 1);
  if (DECIDED_PROPOSAL_STATUSES.has(proposal.status)) {
    return fail(args, `proposal.${decision}`, "already_decided", `proposal already decided: ${proposal.status}`, 1);
  }
  if (!proposal.approver_required) {
    return fail(args, `proposal.${decision}`, "approval_not_required", "proposal does not require approval; approval command is not valid", 1);
  }
  const approvingActor = actorById(actor);
  if (!approvingActor) return fail(args, `proposal.${decision}`, "not_found", `actor not found: ${actor}`, 1);
  if (proposal.proposed_by_actor_id === actor && approvingActor.kind === "agent") {
    return fail(args, `proposal.${decision}`, "agent_self_approval_refused", "agent self-approval is not allowed for proposals", 1);
  }
  const json = flagBool(args, "json");
  let client: Awaited<ReturnType<typeof connect>> | null = null;
  try {
    client = await connect({ surface: "desktop" });
    const result = await client.command(`proposal.${decision}`, {
      org_id: flagString(args, "org") ?? DEFAULT_ORG,
      target: proposalId,
      intent: proposal.intent_id,
      actor_id: actor,
      reason: rationale,
    });
    if (result.ok !== true) return fail(args, `proposal.${decision}`, result.error.class, result.error.message, result.error.class === "invalid_args" ? 64 : 1);
    const updated = proposalById(proposalId);
    const payload = {
      ok: true,
      command: `proposal.${decision}`,
      source: "daemon_command",
      daemon_authority: "canonical_events",
      events: result.events ?? [],
      proposal: updated,
      intent: updated ? intentById(updated.intent_id) : null,
    };
    if (json) emitJson(payload);
    else emitPretty(`${decision}d proposal ${proposalId}`);
    return 0;
  } catch (err) {
    return reportError(err, json);
  } finally {
    client?.close();
  }
}

function list(args: ParsedArgs): number {
  const proposals = proposalRecords({
    intent: flagString(args, "intent"),
    status: flagString(args, "status"),
  });
  if (flagBool(args, "json")) {
    emitJson({
      ok: true,
      command: "proposal.list",
      source: "canonical_sqlite",
      daemon_authority: "canonical_events",
      proposals,
    });
  } else {
    for (const proposal of proposals) emitPretty(`${proposal.proposal_id} ${proposal.status} ${proposal.title}`);
  }
  return 0;
}

function show(args: ParsedArgs): number {
  const proposalId = args.positional[1] ?? flagString(args, "id");
  if (!proposalId) return fail(args, "proposal.show", "invalid_args", "proposal id is required", 64);
  const proposal = proposalById(proposalId);
  const payload = proposalPayload(proposalId, proposal);
  if (flagBool(args, "json")) emitJson(payload);
  else if (proposal) emitPretty(JSON.stringify(payload, null, 2));
  else emitError(`proposal not found: ${proposalId}`);
  return proposal ? 0 : 1;
}

function proposalPayload(proposalId: string, proposal: ProposalRecord | null) {
  return {
    ok: proposal !== null,
    command: "proposal.show",
    source: "canonical_sqlite",
    daemon_authority: "canonical_events",
    proposal,
    intent: proposal ? intentById(proposal.intent_id) : null,
    events: proposal ? eventsMentioning(proposalId) : [],
    error: proposal ? null : { class: "not_found", message: `proposal not found: ${proposalId}` },
  };
}

function readFlagOrFile(args: ParsedArgs, flag: string, fileFlag: string): string | null {
  const file = flagString(args, fileFlag);
  if (file) return readFileSync(file, "utf8");
  return flagString(args, flag) ?? null;
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
