export interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AGENTS: Record<string, AgentInfo> = {
  main: { id: "main", name: "Right Hand", emoji: "🤝", color: "#E8A838" },
  researcher: { id: "researcher", name: "Researcher", emoji: "🔬", color: "#2BA89E" },
  coder: { id: "coder", name: "Coder", emoji: "💻", color: "#57A773" },
  ops: { id: "ops", name: "Ops", emoji: "⚙️", color: "#6C7A89" },
  security: { id: "security", name: "Security", emoji: "🛡️", color: "#E74C3C" },
  "vault-keeper": { id: "vault-keeper", name: "Vault Keeper", emoji: "📚", color: "#9B59B6" },
  scout: { id: "scout", name: "Scout", emoji: "🔭", color: "#E67E22" },
  "prompt-engineer": { id: "prompt-engineer", name: "Prompt Engineer", emoji: "🎯", color: "#3498DB" },
  concierge: { id: "concierge", name: "Concierge", emoji: "🛎️", color: "#1ABC9C" },
  "devils-advocate": { id: "devils-advocate", name: "Devil's Advocate", emoji: "😈", color: "#E91E63" },
  user: { id: "user", name: "Trajan", emoji: "👤", color: "#F5F5F5" },
};

export type ProjectTag = "frontend" | "research" | "ops" | "strategy" | "code" | "misc";

export interface ChatMessage {
  id: string;
  sender: string;
  senderAgent?: string;
  content: string;
  timestamp: number;
  channel?: string;
  projectTag?: ProjectTag;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  type: "spawn" | "complete" | "error";
  task: string;
  status: "running" | "done" | "failed";
  startTime: number;
  endTime?: number;
  result?: string;
}

export interface VaultFile {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: string;
  children?: VaultFile[];
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface SystemStatus {
  status: "ok" | "degraded" | "down";
  uptime?: string;
  activeAgents: number;
  gatewayVersion?: string;
  usagePct?: number;
}

export interface LiveAgentInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "active" | "idle";
  lastActivity?: string;
  sessionCount: number;
}
