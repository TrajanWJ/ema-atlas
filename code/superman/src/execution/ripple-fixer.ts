/**
 * Ripple effect detection and fixing.
 *
 * After every file edit:
 * 1. Walk the import graph to find all dependent files
 * 2. Check if the change breaks their interface (exports changed)
 * 3. Queue dependent files for fixing in the same execution loop
 */

import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export interface RippleTarget {
  filePath: string;
  dependencyChain: string[];
  nodeIds: string[];
}

/**
 * Find all files that transitively depend on the changed files.
 * Walks reverse import/uses/calls edges in the knowledge graph.
 */
export function findRippleTargets(
  changedFiles: string[],
  graph: KnowledgeGraph,
): RippleTarget[] {
  const visited = new Set<string>();
  const targets: RippleTarget[] = [];

  // Mark changed files as visited so they don't appear in results
  for (const f of changedFiles) visited.add(f);

  function walkReverse(filePath: string, chain: string[]): void {
    const nodesInFile = graph.findByFile(filePath);

    for (const node of nodesInFile) {
      const edges = graph.getEdgesFor(node.id, 'both');

      for (const edge of edges) {
        // Find reverse dependencies: something imports/uses/calls this node
        if (edge.target !== node.id) continue;
        if (edge.type !== 'imports' && edge.type !== 'uses' && edge.type !== 'calls') continue;

        const sourceNode = graph.getNode(edge.source);
        if (!sourceNode) continue;

        const depFile = sourceNode.filePath;
        if (visited.has(depFile)) continue;

        visited.add(depFile);
        const newChain = [...chain, `${edge.type} -> ${depFile}`];

        // Collect all nodes in this file that reference the changed file
        const depNodes = graph.findByFile(depFile)
          .filter((n) => {
            const nodeEdges = graph.getEdgesFor(n.id, 'forward');
            return nodeEdges.some((e) =>
              nodesInFile.some((changed) => e.target === changed.id)
            );
          })
          .map((n) => n.id);

        targets.push({
          filePath: depFile,
          dependencyChain: newChain,
          nodeIds: depNodes,
        });

        // Continue walking transitively
        walkReverse(depFile, newChain);
      }
    }
  }

  for (const file of changedFiles) {
    walkReverse(file, [file]);
  }

  log('execute', 'Ripple targets found', {
    changedFiles,
    rippleCount: targets.length,
    files: targets.map((t) => t.filePath),
  });

  return targets;
}

/**
 * Detect whether a file change breaks its exported interface.
 * Compares old vs new content for removed exports and changed signatures.
 * Returns a list of potential breakages (best-effort heuristic).
 */
export function detectBrokenInterfaces(
  filePath: string,
  oldContent: string,
  newContent: string,
  graph: KnowledgeGraph,
): Array<{ type: string; detail: string; affectedFiles: string[] }> {
  const breakages: Array<{ type: string; detail: string; affectedFiles: string[] }> = [];

  const oldExports = extractExportedNames(oldContent);
  const newExports = extractExportedNames(newContent);

  // Check for removed exports
  for (const name of oldExports) {
    if (!newExports.has(name)) {
      const consumers = findConsumersOfExport(filePath, name, graph);
      if (consumers.length > 0) {
        breakages.push({
          type: 'removed_export',
          detail: `Removed export "${name}" from ${filePath}`,
          affectedFiles: consumers,
        });
      }
    }
  }

  // Check for changed function signatures
  const oldSigs = extractFunctionSignatures(oldContent);
  const newSigs = extractFunctionSignatures(newContent);

  for (const [name, oldSig] of oldSigs) {
    const newSig = newSigs.get(name);
    if (newSig && oldSig.paramCount !== newSig.paramCount) {
      const consumers = findConsumersOfExport(filePath, name, graph);
      if (consumers.length > 0) {
        breakages.push({
          type: 'changed_signature',
          detail: `${name} params changed from ${oldSig.paramCount} to ${newSig.paramCount}`,
          affectedFiles: consumers,
        });
      }
    }
  }

  return breakages;
}

// ── Helpers ──

function extractExportedNames(content: string): Set<string> {
  const names = new Set<string>();
  const patterns = [
    /export\s+(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/g,
    /export\s+default\s+(?:function|class)?\s*(\w+)/g,
    /export\s*\{([^}]+)\}/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (pattern.source.includes('{')) {
        const list = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
        list.forEach((name) => { if (name) names.add(name); });
      } else {
        if (match[1]) names.add(match[1]);
      }
    }
  }

  return names;
}

function extractFunctionSignatures(content: string): Map<string, { paramCount: number }> {
  const sigs = new Map<string, { paramCount: number }>();
  const pattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const params = match[2].trim();
    const paramCount = params.length === 0 ? 0 : params.split(',').length;
    sigs.set(name, { paramCount });
  }

  return sigs;
}

function findConsumersOfExport(
  filePath: string,
  exportName: string,
  graph: KnowledgeGraph,
): string[] {
  const consumers: string[] = [];
  const nodesInFile = graph.findByFile(filePath);

  for (const node of nodesInFile) {
    if (node.name !== exportName) continue;

    const edges = graph.getEdgesFor(node.id, 'both');
    for (const edge of edges) {
      if (edge.target !== node.id) continue;
      if (edge.type !== 'imports' && edge.type !== 'uses') continue;

      const consumer = graph.getNode(edge.source);
      if (consumer && consumer.filePath !== filePath) {
        consumers.push(consumer.filePath);
      }
    }
  }

  return [...new Set(consumers)];
}
