/**
 * Hierarchical Retrieval — three-level retrieval with diversity enforcement.
 *
 * Levels:
 * 1. File level — which files are relevant
 * 2. Section level — which sections within those files
 * 3. Node level — specific functions, classes, methods
 *
 * Diversity enforcement:
 * - Max 3 nodes from same file
 * - Always include entry point + business logic + data model when relevant
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { ScoredCandidate } from './types.js';
import type { ExpandedQuery, CodeNode } from '../types.js';

// ── Config ──

const MAX_NODES_PER_FILE = 3;
const ENTRY_POINT_PATTERNS = /^(page|layout|app|index|main|server|handler)\./i;
const BUSINESS_LOGIC_TYPES = new Set(['function', 'method', 'class']);
const DATA_MODEL_PATTERNS = /\b(model|schema|entity|type|interface)\b/i;

// ── Types ──

interface FileGroup {
  filePath: string;
  candidates: ScoredCandidate[];
  maxScore: number;
  hasEntryPoint: boolean;
  hasBusinessLogic: boolean;
  hasDataModel: boolean;
}

/**
 * Apply hierarchical retrieval to candidates.
 * Ensures diversity: max 3 nodes per file, with role-based inclusion guarantees.
 */
export function applyHierarchicalRetrieval(
  candidates: ScoredCandidate[],
  graph: KnowledgeGraph,
  query: string,
  expanded?: ExpandedQuery,
  maxResults: number = 15,
): ScoredCandidate[] {
  if (candidates.length === 0) return [];

  const start = Date.now();

  // Level 1: Group candidates by file
  const fileGroups = groupByFile(candidates);

  // Level 2: Classify each group
  for (const group of fileGroups.values()) {
    classifyGroup(group);
  }

  // Level 3: Select nodes with diversity enforcement
  const selected = selectWithDiversity(fileGroups, maxResults, query, expanded);

  log('query', 'Hierarchical retrieval applied', {
    inputCandidates: candidates.length,
    fileGroups: fileGroups.size,
    outputCandidates: selected.length,
    ms: Date.now() - start,
  });

  return selected;
}

// ── Level 1: File Grouping ──

function groupByFile(candidates: ScoredCandidate[]): Map<string, FileGroup> {
  const groups = new Map<string, FileGroup>();

  for (const candidate of candidates) {
    const filePath = candidate.node?.filePath ?? candidate.id;
    const existing = groups.get(filePath);

    if (existing) {
      existing.candidates.push(candidate);
      if (candidate.score > existing.maxScore) {
        existing.maxScore = candidate.score;
      }
    } else {
      groups.set(filePath, {
        filePath,
        candidates: [candidate],
        maxScore: candidate.score,
        hasEntryPoint: false,
        hasBusinessLogic: false,
        hasDataModel: false,
      });
    }
  }

  return groups;
}

// ── Level 2: Group Classification ──

function classifyGroup(group: FileGroup): void {
  const fileName = group.filePath.split('/').pop() ?? '';

  group.hasEntryPoint = ENTRY_POINT_PATTERNS.test(fileName) ||
    group.candidates.some(c => c.node?.type === 'route');

  group.hasBusinessLogic = group.candidates.some(c =>
    c.node && BUSINESS_LOGIC_TYPES.has(c.node.type) &&
    c.node.content.length > 50,
  );

  group.hasDataModel = DATA_MODEL_PATTERNS.test(fileName) ||
    group.candidates.some(c =>
      c.node && (c.node.type === 'interface' || c.node.type === 'type' || c.node.type === 'class'),
    );
}

// ── Level 3: Diversity-Enforced Selection ──

function selectWithDiversity(
  fileGroups: Map<string, FileGroup>,
  maxResults: number,
  query: string,
  expanded?: ExpandedQuery,
): ScoredCandidate[] {
  const selected: ScoredCandidate[] = [];
  const fileCountMap = new Map<string, number>();

  // Sort groups by max score (best files first)
  const sortedGroups = [...fileGroups.values()].sort((a, b) => b.maxScore - a.maxScore);

  // Priority pass: ensure representation of entry points, business logic, and data models
  const queryNeeds = detectQueryNeeds(query, expanded);

  if (queryNeeds.needsEntryPoint) {
    const entryGroup = sortedGroups.find(g => g.hasEntryPoint);
    if (entryGroup) {
      addTopFromGroup(entryGroup, selected, fileCountMap, 1);
    }
  }

  if (queryNeeds.needsBusinessLogic) {
    const bizGroup = sortedGroups.find(g => g.hasBusinessLogic && !g.hasEntryPoint);
    if (bizGroup) {
      addTopFromGroup(bizGroup, selected, fileCountMap, 1);
    }
  }

  if (queryNeeds.needsDataModel) {
    const dataGroup = sortedGroups.find(g => g.hasDataModel);
    if (dataGroup) {
      addTopFromGroup(dataGroup, selected, fileCountMap, 1);
    }
  }

  // Fill remaining slots with top candidates, enforcing diversity
  const allCandidatesSorted = [...fileGroups.values()]
    .flatMap(g => g.candidates)
    .sort((a, b) => b.score - a.score);

  for (const candidate of allCandidatesSorted) {
    if (selected.length >= maxResults) break;
    if (selected.some(s => s.id === candidate.id)) continue;

    const filePath = candidate.node?.filePath ?? candidate.id;
    const count = fileCountMap.get(filePath) ?? 0;

    if (count >= MAX_NODES_PER_FILE) continue;

    selected.push(candidate);
    fileCountMap.set(filePath, count + 1);
  }

  return selected;
}

function addTopFromGroup(
  group: FileGroup,
  selected: ScoredCandidate[],
  fileCountMap: Map<string, number>,
  count: number,
): void {
  const sorted = [...group.candidates].sort((a, b) => b.score - a.score);

  for (const candidate of sorted.slice(0, count)) {
    if (selected.some(s => s.id === candidate.id)) continue;

    const fileCount = fileCountMap.get(group.filePath) ?? 0;
    if (fileCount >= MAX_NODES_PER_FILE) continue;

    selected.push(candidate);
    fileCountMap.set(group.filePath, fileCount + 1);
  }
}

interface QueryNeeds {
  needsEntryPoint: boolean;
  needsBusinessLogic: boolean;
  needsDataModel: boolean;
}

function detectQueryNeeds(query: string, expanded?: ExpandedQuery): QueryNeeds {
  const q = query.toLowerCase();
  const concepts = expanded?.concepts ?? [];

  return {
    needsEntryPoint: /\b(flow|route|endpoint|handler|page|entry)\b/.test(q) ||
      concepts.some(c => ['api', 'ui'].includes(c)),
    needsBusinessLogic: /\b(how|logic|process|handle|calculate|validate)\b/.test(q) ||
      concepts.some(c => ['auth', 'api'].includes(c)),
    needsDataModel: /\b(model|schema|data|type|entity|database)\b/.test(q) ||
      concepts.includes('database'),
  };
}
