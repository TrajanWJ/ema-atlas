import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";
import { readProjection } from "./workspace-daemon.js";

type OrgSummary = {
  readonly id: string;
  readonly name: string;
};

type TopbarProjection = {
  readonly orgs?: readonly OrgSummary[];
  readonly current_org?: OrgSummary | null;
};

type EntityConflictStrategy = {
  readonly entity_class: string;
  readonly conflict_strategy: string;
  readonly source: string;
};

type OrgStatus = {
  readonly ok: boolean;
  readonly source: "topbar_projection";
  readonly org: OrgSummary | null;
  readonly host_set: {
    readonly required_min: 1;
    readonly doctrine: "binary_accessibility";
    readonly online_count: number | null;
    readonly accessibility: "accessible" | "known_but_not_current" | "unknown";
  };
  readonly entity_classes: readonly EntityConflictStrategy[];
  readonly error?: "unknown_org";
};

export const ORG_ENTITY_CONFLICT_STRATEGIES: readonly EntityConflictStrategy[] = [
  {
    entity_class: "Blueprint prose",
    conflict_strategy: "CRDT prose",
    source: "docs/orchestration/source-intake/pattern-routing-2026-05-10.md",
  },
  {
    entity_class: "Audit events / agent reports",
    conflict_strategy: "append-only events",
    source: "docs/decisions/2026-05-10-multi-host-conflict-policy.md",
  },
  {
    entity_class: "Lane status fields",
    conflict_strategy: "LWW status fields",
    source: "docs/decisions/2026-05-10-multi-host-conflict-policy.md",
  },
  {
    entity_class: "Lane claims",
    conflict_strategy: "distributed mutex",
    source: "docs/decisions/2026-05-10-multi-host-conflict-policy.md",
  },
  {
    entity_class: "Queue item state advances",
    conflict_strategy: "LWW + state-machine validation",
    source: "docs/decisions/2026-05-10-multi-host-conflict-policy.md",
  },
  {
    entity_class: "Approval queue advances",
    conflict_strategy: "distributed sequencer",
    source: "docs/decisions/2026-05-10-multi-host-conflict-policy.md",
  },
  {
    entity_class: "Source records",
    conflict_strategy: "append-only + supersede",
    source: "packages/contracts/workspace/v0/source-intake.md",
  },
  {
    entity_class: "Donor patterns",
    conflict_strategy: "CRDT prose",
    source: "packages/contracts/workspace/v0/schema.md",
  },
];

export async function runOrg(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "org",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["name"], required: ["name"], summary: "Create an organization and its same-name default space." },
        { verb: "status", flags: ["org", "json"], summary: "Read daemon org status, host-set doctrine, and entity conflict strategies." },
      ],
    });
  }
  if (sub === "status") return runOrgStatus(args);
  if (sub !== "create") {
    emitError(`ema org: unknown subcommand "${sub ?? ""}" (expected: create | status)`);
    return 64;
  }

  const json = flagBool(args, "json");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");

  if (!name.trim()) {
    emitError(`ema org create: missing organization name`);
    emitError(`Usage: ema org create --name "Trajan's Organization"`);
    return 64;
  }

  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("org.create", { name });
    c.close();

    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema org create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, name, events });
    } else {
      emitPretty(`created org: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

async function runOrgStatus(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const projection = await readProjection<TopbarProjection>(args, {
    name: "topbar",
    pick: (data) => data as TopbarProjection,
  });
  if (!projection) return 1;

  const targetOrg = flagString(args, "org") ?? projection.current_org?.id ?? "";
  if (!targetOrg) {
    emitError("ema org status: --org is required when the daemon has no current org");
    return 64;
  }

  const status = orgStatusFromTopbar(projection, targetOrg);
  if (json) emitJson(status);
  else if (status.org) {
    emitPretty(`${status.org.name} (${status.org.id})`);
    emitPretty(`accessibility: ${status.host_set.accessibility}`);
    emitPretty(`host_set: required_min=${status.host_set.required_min}, online_count=${status.host_set.online_count ?? "unknown"}`);
    emitPretty("entity conflict strategies:");
    for (const row of status.entity_classes) {
      emitPretty(`  ${row.entity_class}: ${row.conflict_strategy}`);
    }
  } else {
    emitError(`ema org status: unknown org ${targetOrg}`);
  }
  return status.ok ? 0 : 1;
}

export function orgStatusFromTopbar(projection: TopbarProjection, targetOrg: string): OrgStatus {
  const orgs = projection.orgs ?? [];
  const current = projection.current_org ?? null;
  const org = orgs.find((item) => item.id === targetOrg) ?? null;
  if (!org) {
    return {
      ok: false,
      source: "topbar_projection",
      org: null,
      host_set: {
        required_min: 1,
        doctrine: "binary_accessibility",
        online_count: null,
        accessibility: "unknown",
      },
      entity_classes: ORG_ENTITY_CONFLICT_STRATEGIES,
      error: "unknown_org",
    };
  }
  const isCurrentOrg = current?.id === org.id;
  return {
    ok: true,
    source: "topbar_projection",
    org,
    host_set: {
      required_min: 1,
      doctrine: "binary_accessibility",
      online_count: isCurrentOrg ? 1 : null,
      accessibility: isCurrentOrg ? "accessible" : "known_but_not_current",
    },
    entity_classes: ORG_ENTITY_CONFLICT_STRATEGIES,
  };
}
