/**
 * Session Manager — keeps a project indexed in memory between tool calls.
 * Avoids re-indexing on every MCP tool invocation.
 *
 * Key guarantees:
 * - `getSession(path)` always returns a valid session (creates if needed)
 * - `getActiveSession()` returns the current session or null
 * - `requireSession()` returns the session or throws an actionable error
 * - `getOrRecoverSession()` auto-recovers from the last known path
 * - Sessions auto-refresh when stale (>5 min TTL)
 * - Last known path is persisted for auto-recovery
 */

import { parseRepository } from '../src/parser/index.ts';
import { buildDependencyGraph } from '../src/structural/graph-builder.ts';
import { KnowledgeGraph } from '../src/graph/knowledge-graph.ts';
import { scanInfrastructure } from '../src/intelligence/infrastructure-scanner.ts';
import { scanRoutes } from '../src/intelligence/route-scanner.ts';
import { WorkingMemory } from '../src/working-memory.ts';
import { log } from '../src/logger.ts';
import type { ProjectModel, CodeNode, CodeEdge } from '../src/types.ts';
import type { InfrastructureModel } from '../src/intelligence/infrastructure-scanner.ts';
import type { RouteMap } from '../src/intelligence/route-scanner.ts';

export interface ProjectSession {
  repoPath: string;
  graph: KnowledgeGraph;
  model: ProjectModel | null;
  infrastructure: InfrastructureModel | null;
  routes: RouteMap | null;
  memory: WorkingMemory;
  indexedAt: number;
  snapshot: Map<string, string>; // file path → content before last task
}

let activeSession: ProjectSession | null = null;
let lastKnownPath: string | null = null;
let sessionInitializing: Promise<ProjectSession> | null = null;

const SESSION_TTL = 5 * 60 * 1000; // 5 minutes
const SESSION_DIR = '.superman';

// ── Session Persistence ──

interface PersistedSessionState {
  repoPath: string;
  indexedAt: number;
  nodeCount: number;
  edgeCount: number;
}

function getSessionFilePath(projectPath: string): string {
  const safeName = projectPath.replace(/[\/\\:]/g, '_').replace(/^_+/, '');
  return `${projectPath}/${SESSION_DIR}/session-${safeName.slice(-60)}.json`;
}

async function persistSessionState(session: ProjectSession): Promise<void> {
  try {
    const fsMod = await import('fs');
    const pathMod = await import('path');
    const dir = pathMod.join(session.repoPath, SESSION_DIR);

    if (!fsMod.existsSync(dir)) {
      fsMod.mkdirSync(dir, { recursive: true });
    }

    const state: PersistedSessionState = {
      repoPath: session.repoPath,
      indexedAt: session.indexedAt,
      nodeCount: session.graph.nodes.size,
      edgeCount: session.graph.edges.length,
    };

    const filePath = getSessionFilePath(session.repoPath);
    fsMod.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    log('mcp', `Session state persisted to ${filePath}`);
  } catch (err) {
    // Non-fatal — persistence is best-effort
    log('mcp', `Failed to persist session state (non-fatal): ${err}`);
  }
}

async function loadPersistedPath(): Promise<string | null> {
  if (lastKnownPath) return lastKnownPath;

  // Try to find any persisted session file
  try {
    const fsMod = await import('fs');
    const pathMod = await import('path');
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    // Check common project locations — this is a heuristic
    const candidates = ['.', homeDir];

    for (const base of candidates) {
      const dir = pathMod.join(base, SESSION_DIR);
      if (fsMod.existsSync(dir)) {
        const files = fsMod.readdirSync(dir).filter((f: string) => f.startsWith('session-') && f.endsWith('.json'));
        if (files.length > 0) {
          const latest = files.sort().pop()!;
          const data = JSON.parse(fsMod.readFileSync(pathMod.join(dir, latest), 'utf-8'));
          if (data.repoPath && fsMod.existsSync(data.repoPath)) {
            return data.repoPath;
          }
        }
      }
    }
  } catch {
    // Silent fallback
  }

  return null;
}

/**
 * Get or create a session for the given repo path.
 * Re-indexes only if the path changed or session is stale (>5 min).
 * Thread-safe: concurrent calls for the same path share one initialization.
 */
export async function getSession(repoPath: string): Promise<ProjectSession> {
  // Return cached session if fresh
  if (
    activeSession &&
    activeSession.repoPath === repoPath &&
    Date.now() - activeSession.indexedAt < SESSION_TTL
  ) {
    return activeSession;
  }

  // If already initializing for this path, wait for it
  if (sessionInitializing) {
    try {
      const pending = await sessionInitializing;
      if (pending.repoPath === repoPath && Date.now() - pending.indexedAt < SESSION_TTL) {
        return pending;
      }
    } catch {
      // Previous init failed, try again
    }
  }

  // Start new initialization
  sessionInitializing = initializeSession(repoPath);
  try {
    const session = await sessionInitializing;
    return session;
  } finally {
    sessionInitializing = null;
  }
}

/**
 * Core session initialization — parses repo, builds graph, scans infra.
 */
async function initializeSession(repoPath: string): Promise<ProjectSession> {
  log('mcp', `Indexing project: ${repoPath}`);

  // Verify path exists
  const fsMod = await import('fs');
  if (!fsMod.existsSync(repoPath)) {
    throw new Error(
      `Project path does not exist: ${repoPath}. ` +
      `Provide an absolute path to a project directory.`
    );
  }

  // Parse repository
  const parseResults = await parseRepository(repoPath);
  const { nodes, edges } = buildDependencyGraph(parseResults);

  // Build knowledge graph
  const graph = new KnowledgeGraph();
  graph.build(nodes as CodeNode[], edges as CodeEdge[]);

  // Scan infrastructure and routes (non-blocking, best-effort)
  let infrastructure: InfrastructureModel | null = null;
  let routes: RouteMap | null = null;

  try {
    infrastructure = await scanInfrastructure(repoPath);
  } catch (err) {
    log('mcp', `Infrastructure scan failed (non-fatal): ${err}`);
  }

  try {
    routes = await scanRoutes(repoPath);
  } catch (err) {
    log('mcp', `Route scan failed (non-fatal): ${err}`);
  }

  // Load working memory
  const memory = new WorkingMemory(repoPath);
  await memory.load();

  activeSession = {
    repoPath,
    graph,
    model: null, // built on demand
    infrastructure,
    routes,
    memory,
    indexedAt: Date.now(),
    snapshot: new Map(),
  };

  // Remember this path for auto-recovery
  lastKnownPath = repoPath;

  log('mcp', `Session ready: ${graph.nodes.size} nodes, ${graph.edges.length} edges`);

  // Persist session state to disk for recovery
  await persistSessionState(activeSession);

  return activeSession;
}

/**
 * Invalidate the active session (force re-index on next call).
 * Preserves lastKnownPath for auto-recovery.
 */
export function invalidateSession(): void {
  activeSession = null;
}

/**
 * Full reset for testing — clears session AND lastKnownPath.
 */
export function resetForTesting(): void {
  activeSession = null;
  lastKnownPath = null;
  sessionInitializing = null;
}

/**
 * Get the active session without creating one.
 */
export function getActiveSession(): ProjectSession | null {
  return activeSession;
}

/**
 * Get the session or throw a clear, actionable error.
 * Every tool that needs a session should call this instead of getActiveSession().
 */
export function requireSession(toolName: string): ProjectSession {
  if (activeSession) {
    return activeSession;
  }

  const hint = lastKnownPath
    ? `NEXT STEP: Call analyze_repo with path "${lastKnownPath}" to restore the session.`
    : `NEXT STEP: Call analyze_repo first with the absolute path to your project directory.`;

  throw new Error(
    `[${toolName}] No active project session.\n\n` +
    `${hint}\n\n` +
    `Required tool call order:\n` +
    `  1. check_status (verify server is running)\n` +
    `  2. analyze_repo({ path: "/path/to/project" })\n` +
    `  3. ${toolName} (now ready to use)\n\n` +
    `Example: analyze_repo({ path: "${lastKnownPath || '/Users/you/your-project'}" })`
  );
}

/**
 * Get the session, auto-recovering from the last known path if possible.
 * Falls back to a clear error if no path is known.
 */
export async function getOrRecoverSession(toolName: string): Promise<ProjectSession> {
  // Session still alive
  if (activeSession && Date.now() - activeSession.indexedAt < SESSION_TTL) {
    return activeSession;
  }

  // Session expired or missing — try auto-recovery
  if (lastKnownPath) {
    log('mcp', `Session expired/missing for ${toolName}, auto-recovering from ${lastKnownPath}`);
    try {
      return await getSession(lastKnownPath);
    } catch (err) {
      throw new Error(
        `[${toolName}] Session auto-recovery failed for "${lastKnownPath}": ${err}. ` +
        `Call analyze_repo with a valid project path.`
      );
    }
  }

  // Try loading persisted path from disk
  const persistedPath = await loadPersistedPath();
  if (persistedPath) {
    log('mcp', `Found persisted session path: ${persistedPath}, attempting recovery`);
    try {
      return await getSession(persistedPath);
    } catch (err) {
      log('mcp', `Recovery from persisted path failed: ${err}`);
    }
  }

  // No recovery possible
  throw new Error(
    `[${toolName}] No active project session and no previous project path to recover from.\n\n` +
    `NEXT STEP: Call analyze_repo with the absolute path to your project directory.\n\n` +
    `Required tool call order:\n` +
    `  1. check_status (verify server is running)\n` +
    `  2. analyze_repo({ path: "/path/to/project" })\n` +
    `  3. ${toolName} (now ready to use)\n\n` +
    `Example: analyze_repo({ path: "/Users/you/your-project" })`
  );
}

/**
 * Get the last known project path (for status reporting).
 */
export function getLastKnownPath(): string | null {
  return lastKnownPath;
}

/**
 * Check if the session is healthy and fresh.
 */
export function getSessionHealth(): {
  active: boolean;
  stale: boolean;
  repoPath: string | null;
  lastKnownPath: string | null;
  age: number | null;
  initializing: boolean;
} {
  const active = activeSession !== null;
  const stale = active && (Date.now() - activeSession!.indexedAt > SESSION_TTL);
  return {
    active,
    stale,
    repoPath: activeSession?.repoPath ?? null,
    lastKnownPath,
    age: activeSession ? Date.now() - activeSession.indexedAt : null,
    initializing: sessionInitializing !== null,
  };
}

/**
 * Save a snapshot of file contents before a task (for rollback).
 */
export async function saveSnapshot(filePaths: string[]): Promise<void> {
  if (!activeSession) return;
  const fs = await import('fs/promises');
  for (const fp of filePaths) {
    try {
      const content = await fs.readFile(fp, 'utf-8');
      activeSession.snapshot.set(fp, content);
    } catch {
      // File doesn't exist yet, no snapshot needed
    }
  }
}

/**
 * Rollback files to their snapshot state.
 */
export async function rollbackSnapshot(): Promise<string[]> {
  if (!activeSession || activeSession.snapshot.size === 0) {
    return [];
  }

  const fs = await import('fs/promises');
  const rolledBack: string[] = [];

  for (const [fp, content] of activeSession.snapshot) {
    try {
      await fs.writeFile(fp, content, 'utf-8');
      rolledBack.push(fp);
    } catch (err) {
      log('mcp', `Rollback failed for ${fp}: ${err}`);
    }
  }

  activeSession.snapshot.clear();
  return rolledBack;
}
