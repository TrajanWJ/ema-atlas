/**
 * Query Rewriter — expands user queries into structured components.
 *
 * Uses Claude to decompose natural language questions into:
 * - concepts: key domain concepts mentioned
 * - actions: what the user wants to know/do
 * - components: code components likely relevant
 * - fileTypes: file extensions/patterns to prioritize
 *
 * Results are cached so the same query never hits Claude twice.
 * Falls back to the original query on timeout (2s) or error.
 */

import { log, logError } from '../logger.js';
import type { ExpandedQuery } from '../types.js';

// ── Cache ──

const rewriteCache = new Map<string, ExpandedQuery>();
const MAX_CACHE = 100;

function cacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Expand a user query into structured components.
 * Uses Claude with a 2s timeout; falls back to heuristic expansion.
 */
export async function rewriteQuery(query: string): Promise<ExpandedQuery> {
  const key = cacheKey(query);

  // Cache hit
  const cached = rewriteCache.get(key);
  if (cached) {
    log('query', 'Query rewrite cache hit', { query: query.slice(0, 60) });
    return cached;
  }

  // Try LLM rewrite with timeout
  try {
    const expanded = await Promise.race([
      llmRewrite(query),
      timeout(2000),
    ]);

    if (expanded) {
      setCached(key, expanded);
      log('query', 'Query rewritten via LLM', {
        query: query.slice(0, 60),
        concepts: expanded.concepts.length,
        actions: expanded.actions.length,
      });
      return expanded;
    }
  } catch (err) {
    logError('query', 'Query rewrite failed, using fallback', err);
  }

  // Fallback: heuristic expansion
  const fallback = heuristicExpand(query);
  setCached(key, fallback);
  return fallback;
}

/**
 * Get cached expanded query (for pipeline inspection).
 */
export function getCachedRewrite(query: string): ExpandedQuery | null {
  return rewriteCache.get(cacheKey(query)) ?? null;
}

/**
 * Clear the rewrite cache.
 */
export function clearRewriteCache(): void {
  const size = rewriteCache.size;
  rewriteCache.clear();
  if (size > 0) {
    log('cache', 'Query rewrite cache cleared', { evicted: size });
  }
}

// ── LLM Rewrite ──

async function llmRewrite(query: string): Promise<ExpandedQuery> {
  // Dynamic import to avoid circular deps
  const { callClaude, safeParseJSON } = await import('../ai/claude-client.js');

  const prompt = `You are a code search query expander. Given a user's question about a codebase, extract structured components to improve search.

Input: "${query}"

Respond ONLY with valid JSON (no markdown fences):
{
  "concepts": ["key domain concepts mentioned, e.g. authentication, database, routing"],
  "actions": ["what the user wants to know/do, e.g. find, understand, trace, debug"],
  "components": ["code components likely relevant, e.g. middleware, model, controller, hook"],
  "fileTypes": ["file patterns to prioritize, e.g. .ts, .tsx, route, middleware, model"]
}

Rules:
- concepts: 1-5 domain-specific terms from the question
- actions: 1-3 verbs describing the user's intent
- components: 1-5 code structure types that would contain the answer
- fileTypes: 1-3 file patterns (extensions or naming conventions)
- Keep each array concise — quality over quantity`;

  const response = await callClaude(prompt, 'query');
  const parsed = safeParseJSON<{
    concepts: string[];
    actions: string[];
    components: string[];
    fileTypes: string[];
  }>(response);

  if (!parsed.ok) {
    throw new Error('Failed to parse LLM rewrite response');
  }

  const data = parsed.data;
  return {
    original: query,
    concepts: Array.isArray(data.concepts) ? data.concepts.slice(0, 5) : [],
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 3) : [],
    components: Array.isArray(data.components) ? data.components.slice(0, 5) : [],
    fileTypes: Array.isArray(data.fileTypes) ? data.fileTypes.slice(0, 3) : [],
  };
}

// ── Heuristic Fallback ──

/**
 * Fast, no-LLM query expansion using keyword patterns.
 */
export function heuristicExpand(query: string): ExpandedQuery {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const concepts: string[] = [];
  const actions: string[] = [];
  const components: string[] = [];
  const fileTypes: string[] = [];

  // Extract action verbs
  const actionPatterns: Record<string, string> = {
    'how does': 'understand',
    'how do': 'understand',
    'what is': 'identify',
    'what are': 'identify',
    'where is': 'find',
    'where are': 'find',
    'why does': 'debug',
    'why is': 'debug',
    'explain': 'understand',
    'trace': 'trace',
    'find': 'find',
    'show': 'find',
    'debug': 'debug',
    'fix': 'debug',
    'list': 'find',
    'who calls': 'trace',
    'what calls': 'trace',
  };

  for (const [pattern, action] of Object.entries(actionPatterns)) {
    if (q.includes(pattern)) {
      if (!actions.includes(action)) actions.push(action);
    }
  }
  if (actions.length === 0) actions.push('find');

  // Extract domain concepts
  const domainPatterns: Record<string, string[]> = {
    auth: ['auth', 'login', 'password', 'session', 'token', 'jwt', 'permission', 'role'],
    database: ['database', 'db', 'model', 'schema', 'migration', 'query', 'prisma', 'supabase', 'table'],
    api: ['api', 'route', 'endpoint', 'request', 'response', 'rest', 'graphql'],
    ui: ['component', 'render', 'jsx', 'tsx', 'page', 'layout', 'button', 'form', 'modal'],
    state: ['state', 'store', 'context', 'redux', 'zustand', 'hook'],
    testing: ['test', 'spec', 'mock', 'fixture', 'jest', 'vitest'],
    error: ['error', 'exception', 'catch', 'throw', 'handling', 'boundary'],
    config: ['config', 'env', 'setting', 'environment', 'variable'],
  };

  for (const [concept, keywords] of Object.entries(domainPatterns)) {
    if (keywords.some(k => words.includes(k) || q.includes(k))) {
      concepts.push(concept);
    }
  }

  // If no domain concepts found, use the longest words as concepts
  if (concepts.length === 0) {
    const meaningful = words
      .filter(w => w.length > 4 && !['does', 'this', 'that', 'what', 'where', 'which', 'about', 'should'].includes(w))
      .slice(0, 3);
    concepts.push(...meaningful);
  }

  // Infer components from concepts
  const conceptToComponents: Record<string, string[]> = {
    auth: ['middleware', 'guard', 'service'],
    database: ['model', 'repository', 'migration'],
    api: ['route', 'controller', 'handler'],
    ui: ['component', 'page', 'layout'],
    state: ['store', 'hook', 'context'],
    testing: ['test', 'spec', 'fixture'],
    error: ['handler', 'boundary', 'middleware'],
    config: ['config', 'env'],
  };

  for (const concept of concepts) {
    const comps = conceptToComponents[concept];
    if (comps) {
      for (const comp of comps) {
        if (!components.includes(comp)) components.push(comp);
      }
    }
  }

  // Infer file types from concepts
  const conceptToFileTypes: Record<string, string[]> = {
    auth: ['middleware', '.ts'],
    database: ['model', 'schema', '.prisma'],
    api: ['route', 'api'],
    ui: ['.tsx', 'component'],
    state: ['store', 'hook'],
    testing: ['.test.ts', '.spec.ts'],
  };

  for (const concept of concepts) {
    const types = conceptToFileTypes[concept];
    if (types) {
      for (const t of types) {
        if (!fileTypes.includes(t)) fileTypes.push(t);
      }
    }
  }

  return {
    original: query,
    concepts: concepts.slice(0, 5),
    actions: actions.slice(0, 3),
    components: components.slice(0, 5),
    fileTypes: fileTypes.slice(0, 3),
  };
}

// ── Helpers ──

function setCached(key: string, value: ExpandedQuery): void {
  if (rewriteCache.size >= MAX_CACHE) {
    // Evict oldest
    const firstKey = rewriteCache.keys().next().value;
    if (firstKey !== undefined) rewriteCache.delete(firstKey);
  }
  rewriteCache.set(key, value);
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Query rewrite timed out after ${ms}ms`)), ms),
  );
}
