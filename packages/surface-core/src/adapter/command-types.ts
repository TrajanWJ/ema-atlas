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
export type ProjectCreateArgs = { org_id: string; space_id: string; name: string };

export type IdentityUpsertArgs = {
  user_id?: string;
  google_sub?: string;
  display_name: string;
  email: string | null;
  email_verified?: boolean;
};

export type MembershipGrantArgs = {
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "guest";
};

export type InviteCreateArgs = {
  org_id: string;
  target_kind: string;
  target_value: string;
  role: "owner" | "admin" | "member" | "guest";
  expires_at: string;
};

export type InviteAcceptArgs = {
  org_id: string;
  invite_id: string;
  accepted_by: string;
  accepted_device: string;
  role: "owner" | "admin" | "member" | "guest";
};

export type DeviceLocalRegisterArgs = {
  org_id: string;
  user_id: string;
  name: string;
  bootstrap?: "genesis" | "paired";
};

export type DevicePairingOfferCreateArgs = {
  org_id: string;
  user_id: string;
  name: string;
  pubkey: string;
  capabilities?: string[];
};

export type DevicePairingOfferApproveArgs = {
  offer_id: string;
  org_id: string;
  user_id: string;
  device_id: string;
  name: string;
  pubkey: string;
  capabilities?: string[];
  short_code: string;
  confirmed_short_code: string;
  attested_by: string;
};

export type PeerTrustEstablishArgs = {
  org_id: string;
  peer_device: string;
  peer_pubkey: string;
  local_pubkey: string;
  ceremony_kind: "qr_ble_hybrid" | "recovery_packet" | "genesis";
  ceremony_id: string;
  lineage_proof?: string;
  device_id?: string;
};

export type AccessSessionChallengeArgs = {
  org_id: string;
  access_point: string;
  scopes: string[];
  expires_at: string;
};

export type AccessSessionApproveArgs = {
  org_id: string;
  challenge_id: string;
  user_id: string;
  approved_by_device: string;
  scopes: string[];
  expires_at: string;
};

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

export type DesktopPresenceJoinArgs = {
  org_id: string;
  space_id: string;
  room_id: string;
  session_id: string;
  actor_id: string;
  display_name: string;
  color: string;
};

export type DesktopPresenceLeaveArgs = {
  session_id: string;
};

export type DesktopPresenceCursorArgs = DesktopPresenceJoinArgs & {
  x: number;
  y: number;
  surface: "desktop" | "window" | "app" | string;
  window_id?: string | null;
  app_id?: string | null;
};

export type DesktopPresenceLocationArgs = DesktopPresenceJoinArgs & {
  window_id?: string | null;
  app_id: string;
  label: string;
};

// ----------------------------------------------------------------------------
// Pending daemon writer — referenced by Wave 5 CommandPalette actions
// ----------------------------------------------------------------------------

// pending daemon writer (Wave 5 handoff): swarm.start | swarm.pause | swarm.stop
export type SwarmLifecycleArgs = { swarm_id: string };

// pending daemon writer: mission.create
export type MissionCreateArgs = { project_id: string; title: string; body_md?: string };

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
  "identity.google_upsert": IdentityUpsertArgs;
  "membership.role_grant": MembershipGrantArgs;
  "invite.create": InviteCreateArgs;
  "invite.accept": InviteAcceptArgs;
  "device.local_register": DeviceLocalRegisterArgs;
  "device.pairing_offer.create": DevicePairingOfferCreateArgs;
  "device.pairing_offer.approve": DevicePairingOfferApproveArgs;
  "peer.trust_establish": PeerTrustEstablishArgs;
  "access_session.challenge": AccessSessionChallengeArgs;
  "access_session.approve": AccessSessionApproveArgs;
  "connector.connect": ConnectorConnectArgs;
  "connector.disconnect": ConnectorDisconnectArgs;
  "attachment.create": AttachmentCreateArgs;
  "desktop.presence.join": DesktopPresenceJoinArgs;
  "desktop.presence.leave": DesktopPresenceLeaveArgs;
  "desktop.presence.cursor": DesktopPresenceCursorArgs;
  "desktop.presence.location": DesktopPresenceLocationArgs;
  // pending daemon writer (Wave 5)
  "swarm.start": SwarmLifecycleArgs;
  "swarm.pause": SwarmLifecycleArgs;
  "swarm.stop": SwarmLifecycleArgs;
  "mission.create": MissionCreateArgs;
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
  "identity.google_upsert",
  "membership.role_grant",
  "invite.create",
  "invite.accept",
  "device.local_register",
  "device.pairing_offer.create",
  "device.pairing_offer.approve",
  "peer.trust_establish",
  "access_session.challenge",
  "access_session.approve",
  "connector.connect",
  "connector.disconnect",
  "attachment.create",
  "desktop.presence.join",
  "desktop.presence.leave",
  "desktop.presence.cursor",
  "desktop.presence.location",
]);

export function isShippedCommand(op: string): op is CommandOp {
  return SHIPPED_COMMAND_OPS.has(op as CommandOp);
}
