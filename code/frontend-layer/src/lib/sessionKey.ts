// Maps frontend channel ID + agentId → OpenClaw gateway session key
// Format: agent:<agentId>:webchat:channel:<channelId>
export function toSessionKey(agentId: string, channelId: string): string {
  return `agent:${agentId}:webchat:channel:${channelId}`;
}

// Given a session key, extract the channel ID and agent ID
export function fromSessionKey(
  sessionKey: string
): { agentId: string; channelId: string } | null {
  const m = sessionKey.match(/^agent:([^:]+):webchat:channel:(.+)$/);
  if (!m) return null;
  return { agentId: m[1], channelId: m[2] };
}
