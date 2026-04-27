/**
 * Adapter layer — command op + args shapes.
 *
 * Mirrors the "v0 commands" table in
 * `packages/contracts/ipc/shell-protocol.md`. When a command writer is
 * not yet implemented, its args shape still lives here and the Surface
 * lane wires the label `pending daemon writer` via the honest-mock
 * registry until Runtime lands the writer.
 */

// ----------------------------------------------------------------------------
// Shipped commands (daemon has writers)
// ----------------------------------------------------------------------------

export type OrgCreateArgs = { name: string };
export type SpaceCreateArgs = { org_id: string; name: string };
export type ProjectCreateArgs = { space_id: string; name: string };

export type IdentityUpsertArgs = {
  display_name: string;
  email: string | null;
};

export type MembershipGrantArgs = {
  identity_id: string;
  scope: "org" | "space" | "project";
  scope_id: string;
  role: "viewer" | "member" | "owner";
};

export type InviteCreateArgs = {
  scope: "org" | "space" | "project";
  scope_id: string;
  email: string;
  role: "viewer" | "member" | "owner";
};

export type AccessSessionStartArgs = { identity_id: string };

export type ConnectorConnectArgs = {
  kind: string;
  label: string;
  credentials_blob?: string;
};
export type ConnectorDisconnectArgs = { connector_id: string };

export type AttachmentCreateArgs = {
  scope: "user" | "project";
  scope_id: string;
  title: string;
  kind: string;
  source: string;
};

// ----------------------------------------------------------------------------
// Pending daemon writer — referenced by Wave 5 CommandPalette actions
// ----------------------------------------------------------------------------

// pending daemon writer (Wave 5 handoff): swarm.start | swarm.pause | swarm.stop
export type SwarmLifecycleArgs = { swarm_id: string };

// pending daemon writer: mission.create
export type MissionCreateArgs = { project_id: string; title: string; body_md?: string };

// pending daemon writer: lane.item_add
export type LaneItemAddArgs = { lane_id: string; title: string; kind?: string };

// pending daemon writer: handoff.request
export type HandoffRequestArgs = {
  from_lane: string;
  to_lane: string;
  title: string;
  body_md?: string;
};

// pending daemon writer: checkup.schedule
export type CheckupScheduleArgs = {
  project_id: string;
  when_iso: string;
  title: string;
};

// ----------------------------------------------------------------------------
// op → args lookup
// ----------------------------------------------------------------------------

export type CommandMap = {
  // shipped
  "org.create": OrgCreateArgs;
  "space.create": SpaceCreateArgs;
  "project.create": ProjectCreateArgs;
  "identity.upsert": IdentityUpsertArgs;
  "membership.grant": MembershipGrantArgs;
  "invite.create": InviteCreateArgs;
  "access_session.start": AccessSessionStartArgs;
  "connector.connect": ConnectorConnectArgs;
  "connector.disconnect": ConnectorDisconnectArgs;
  "attachment.create": AttachmentCreateArgs;
  // pending daemon writer (Wave 5)
  "swarm.start": SwarmLifecycleArgs;
  "swarm.pause": SwarmLifecycleArgs;
  "swarm.stop": SwarmLifecycleArgs;
  "mission.create": MissionCreateArgs;
  "lane.item_add": LaneItemAddArgs;
  "handoff.request": HandoffRequestArgs;
  "checkup.schedule": CheckupScheduleArgs;
};

export type CommandOp = keyof CommandMap;

// ----------------------------------------------------------------------------
// Which commands have shipped writers? (source of truth for the
// honest-mock CI gate added in Wave 1.)
// ----------------------------------------------------------------------------

export const SHIPPED_COMMAND_OPS: ReadonlySet<CommandOp> = new Set<CommandOp>([
  "org.create",
  "space.create",
  "project.create",
  "identity.upsert",
  "membership.grant",
  "invite.create",
  "access_session.start",
  "connector.connect",
  "connector.disconnect",
  "attachment.create",
]);

export function isShippedCommand(op: string): op is CommandOp {
  return SHIPPED_COMMAND_OPS.has(op as CommandOp);
}
