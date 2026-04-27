/**
 * Adapter layer — event channel names + filter shapes.
 *
 * Channels per `packages/contracts/ipc/shell-protocol.md`. Used by the
 * Surface lane's place-events bridge and by NotificationCenter in Wave 6.
 */

export type EventChannel =
  | `project.${string}.all`
  | `project.${string}.attachments`
  | `user.${string}.connectors`;

export type EventStreamEnvelope = {
  id: string;
  type: string;
  at: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
};

export function projectAllChannel(projectId: string): EventChannel {
  return `project.${projectId}.all`;
}

export function projectAttachmentsChannel(projectId: string): EventChannel {
  return `project.${projectId}.attachments`;
}

export function userConnectorsChannel(userId: string): EventChannel {
  return `user.${userId}.connectors`;
}
