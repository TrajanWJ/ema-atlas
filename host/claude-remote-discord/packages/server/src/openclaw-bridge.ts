/**
 * OpenClaw Bridge — lightweight REST client for the OpenClaw gateway on the VM.
 * Proxies requests from ClaudeForge to OpenClaw at http://192.168.122.10:18789.
 */

const OPENCLAW_URL = process.env.OPENCLAW_URL ?? "http://192.168.122.10:18789";
const OPENCLAW_TIMEOUT_MS = 15_000;

interface OpenClawAgent {
  id: string;
  name: string;
  status: string;
  model?: string;
  uptime?: number;
}

interface OpenClawStatus {
  status: string;
  agents?: number;
  uptime?: number;
  version?: string;
  [key: string]: unknown;
}

interface OpenClawQueryRequest {
  agent: string;
  message: string;
  timeout?: number;
}

interface OpenClawQueryResponse {
  agent: string;
  response: string;
  tokens?: number;
  duration?: number;
}

interface VaultSearchResult {
  path: string;
  score: number;
  content: string;
  title?: string;
}

async function openclawFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${OPENCLAW_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENCLAW_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** Get OpenClaw gateway status */
export async function getOpenClawStatus(): Promise<OpenClawStatus> {
  try {
    const res = await openclawFetch("/api/status");
    if (!res.ok) {
      return { status: "unreachable", error: `HTTP ${res.status}` };
    }
    return await res.json() as OpenClawStatus;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: "unreachable", error: message };
  }
}

/** List running agents on the VM */
export async function listOpenClawAgents(): Promise<OpenClawAgent[]> {
  try {
    const res = await openclawFetch("/api/agents");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data as { agents?: OpenClawAgent[] }).agents ?? [];
  } catch {
    return [];
  }
}

/** Send a query to a specific OpenClaw agent */
export async function queryOpenClawAgent(req: OpenClawQueryRequest): Promise<OpenClawQueryResponse> {
  const timeoutMs = req.timeout ?? 60_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OPENCLAW_URL}/api/agents/${encodeURIComponent(req.agent)}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: req.message }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenClaw agent query failed: HTTP ${res.status} — ${body}`);
    }

    return await res.json() as OpenClawQueryResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/** Search the VM vault via qmd */
export async function searchOpenClawVault(query: string, limit = 10): Promise<VaultSearchResult[]> {
  try {
    const res = await openclawFetch(
      `/api/vault/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data as { results?: VaultSearchResult[] }).results ?? [];
  } catch {
    return [];
  }
}

export { OPENCLAW_URL };
export type { OpenClawAgent, OpenClawStatus, OpenClawQueryRequest, OpenClawQueryResponse, VaultSearchResult };
