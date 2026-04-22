import { dirname, join, normalize, resolve } from 'node:path';
import { log } from '../logger.js';
import type { CodeNode, CodeEdge, ParseResult } from '../types.js';

interface DependencyGraph {
  nodes: CodeNode[];
  edges: CodeEdge[];
}

export function resolveImportPath(
  importSource: string,
  fromFile: string,
  allFiles: string[],
): string | null {
  // Skip bare/package imports (non-relative)
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return null;
  }

  const fromDir = dirname(fromFile);
  const resolved = normalize(join(fromDir, importSource));

  // Possible extensions and index file variations
  const candidates: string[] = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    `${resolved}.py`,
    `${resolved}.go`,
    `${resolved}.rs`,
    `${resolved}.java`,
    join(resolved, 'index.ts'),
    join(resolved, 'index.tsx'),
    join(resolved, 'index.js'),
    join(resolved, 'index.jsx'),
  ];

  // Also handle .js → .ts resolution (NodeNext imports .js but source is .ts)
  if (resolved.endsWith('.js')) {
    const withoutJs = resolved.slice(0, -3);
    candidates.push(`${withoutJs}.ts`, `${withoutJs}.tsx`);
  }

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (allFiles.includes(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function buildDependencyGraph(results: ParseResult[]): DependencyGraph {
  log('graph', `Building dependency graph from ${results.length} parse results`);

  const allNodes: CodeNode[] = [];
  const allEdges: CodeEdge[] = [];
  const allFiles = results.map((r) => r.filePath);

  // Maps for cross-file resolution
  const exportedNameToNodeIds = new Map<string, string[]>(); // name → [nodeId, ...]
  const fileToExports = new Map<string, Map<string, string>>(); // file → (name → nodeId)
  const nodeById = new Map<string, CodeNode>();

  // First pass: collect all nodes and build export maps
  for (const result of results) {
    for (const node of result.nodes) {
      allNodes.push(node);
      nodeById.set(node.id, node);

      if (node.metadata.exported && node.type !== 'file' && node.type !== 'import') {
        const existing = exportedNameToNodeIds.get(node.name) ?? [];
        existing.push(node.id);
        exportedNameToNodeIds.set(node.name, existing);

        let fileExports = fileToExports.get(node.filePath);
        if (!fileExports) {
          fileExports = new Map();
          fileToExports.set(node.filePath, fileExports);
        }
        fileExports.set(node.name, node.id);
      }
    }

    // Collect intra-file edges
    for (const edge of result.edges) {
      allEdges.push(edge);
    }
  }

  log('graph', `Collected ${allNodes.length} nodes, ${allEdges.length} intra-file edges`, {
    exportedNames: exportedNameToNodeIds.size,
    filesWithExports: fileToExports.size,
  });

  // Edge deduplication set
  const edgeKey = (e: CodeEdge): string => `${e.source}→${e.target}→${e.type}`;
  const seenEdges = new Set<string>(allEdges.map(edgeKey));

  function addEdge(edge: CodeEdge): void {
    const key = edgeKey(edge);
    if (!seenEdges.has(key)) {
      seenEdges.add(key);
      allEdges.push(edge);
    }
  }

  // Second pass: resolve cross-file imports
  for (const result of results) {
    for (const node of result.nodes) {
      if (node.type !== 'import') continue;

      const importSource = node.metadata.importSource;
      const importedNames = node.metadata.importedNames;
      if (!importSource) continue;

      // Resolve the import path to a real file
      const resolvedFile = resolveImportPath(importSource, node.filePath, allFiles);

      if (!resolvedFile) {
        // External package import — skip cross-file resolution
        continue;
      }

      const targetExports = fileToExports.get(resolvedFile);
      const targetFileNodeId = `${resolvedFile}::${resolvedFile}::0`;

      // Create edge from importing file to target file
      const sourceFileNodeId = `${node.filePath}::${node.filePath}::0`;
      addEdge({
        source: sourceFileNodeId,
        target: targetFileNodeId,
        type: 'imports',
        metadata: { importSource, resolvedFile },
      });

      // Resolve individual imported names to specific exported nodes
      if (importedNames && targetExports) {
        for (const name of importedNames) {
          // Skip namespace imports
          if (name.startsWith('* as ')) continue;

          const targetNodeId = targetExports.get(name);
          if (targetNodeId) {
            addEdge({
              source: node.id,
              target: targetNodeId,
              type: 'imports',
              metadata: { importedName: name },
            });
          }
        }
      }
    }
  }

  // Third pass: resolve unresolved extends/implements edges
  const unresolvedEdges = allEdges.filter(
    (e) => (e.type === 'extends' || e.type === 'implements') && e.metadata?.unresolved,
  );

  for (const edge of unresolvedEdges) {
    const targetName = edge.target;
    const candidates = exportedNameToNodeIds.get(targetName);
    if (candidates && candidates.length > 0) {
      // Prefer the candidate from a resolved import in the same file
      const sourceNode = nodeById.get(edge.source);
      let bestCandidate = candidates[0];

      if (sourceNode) {
        // Check if there's an import of this name in the same file
        const sameFileImports = allNodes.filter(
          (n) =>
            n.type === 'import' &&
            n.filePath === sourceNode.filePath &&
            n.metadata.importedNames?.includes(targetName),
        );

        if (sameFileImports.length > 0) {
          const importSource = sameFileImports[0].metadata.importSource;
          if (importSource) {
            const resolvedFile = resolveImportPath(importSource, sourceNode.filePath, allFiles);
            if (resolvedFile) {
              const fileExports = fileToExports.get(resolvedFile);
              if (fileExports) {
                const resolved = fileExports.get(targetName);
                if (resolved) bestCandidate = resolved;
              }
            }
          }
        }
      }

      // Update edge target to resolved node ID (add new, old stays but is harmless)
      addEdge({
        source: edge.source,
        target: bestCandidate,
        type: edge.type,
      });
    }
  }

  // Fourth pass: resolve cross-file call edges
  // For each file, find call_expression references to imported names
  for (const result of results) {
    // Build a map of imported name → resolved node ID for this file
    const importedNameResolution = new Map<string, string>();
    const fileImports = result.nodes.filter((n) => n.type === 'import');

    for (const importNode of fileImports) {
      const importSource = importNode.metadata.importSource;
      const importedNames = importNode.metadata.importedNames;
      if (!importSource || !importedNames) continue;

      const resolvedFile = resolveImportPath(importSource, result.filePath, allFiles);
      if (!resolvedFile) continue;

      const targetExports = fileToExports.get(resolvedFile);
      if (!targetExports) continue;

      for (const name of importedNames) {
        if (name.startsWith('* as ')) continue;
        const targetNodeId = targetExports.get(name);
        if (targetNodeId) {
          importedNameResolution.set(name, targetNodeId);
        }
      }
    }

    // Find existing intra-file call edges with unresolved targets and try to resolve
    // Also look at call edges where the callee matches an imported name
    for (const edge of result.edges) {
      if (edge.type !== 'calls') continue;
      const calleeName = edge.metadata?.calleeName as string | undefined;
      if (!calleeName) continue;

      const resolvedTarget = importedNameResolution.get(calleeName);
      if (resolvedTarget) {
        addEdge({
          source: edge.source,
          target: resolvedTarget,
          type: 'calls',
          metadata: { calleeName, crossFile: true },
        });
      }
    }
  }

  // Remove edges with unresolved metadata markers (keep them but clean up)
  const finalEdges = allEdges.map((edge) => {
    if (edge.metadata?.unresolved) {
      const { unresolved, ...rest } = edge.metadata;
      return { ...edge, metadata: Object.keys(rest).length > 0 ? rest : undefined };
    }
    return edge;
  });

  log('graph', `Dependency graph built`, {
    totalNodes: allNodes.length,
    totalEdges: finalEdges.length,
    crossFileEdges: finalEdges.length - allEdges.filter((e) => !e.metadata?.crossFile).length,
  });

  return { nodes: allNodes, edges: finalEdges };
}
