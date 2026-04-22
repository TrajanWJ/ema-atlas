import { log } from '../logger.js';
import type { CodeNode } from '../types.js';
import type { KnowledgeGraph } from './knowledge-graph.js';

/**
 * Breadth-first traversal from a starting node, up to maxDepth.
 * Returns nodes in visit order.
 */
export function bfs(
  graph: KnowledgeGraph,
  startId: string,
  maxDepth: number = Infinity,
): CodeNode[] {
  const result: CodeNode[] = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
  visited.add(startId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const node = graph.getNode(id);
    if (node) {
      result.push(node);
    }

    if (depth >= maxDepth) {
      continue;
    }

    // Traverse forward neighbors
    const forwardMap = graph.forward.get(id);
    if (forwardMap) {
      for (const neighborId of forwardMap.keys()) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      }
    }
  }

  log('graph', 'BFS traversal complete', {
    startId,
    maxDepth,
    nodesVisited: result.length,
  });
  return result;
}

/**
 * Depth-first traversal from a starting node, up to maxDepth.
 * Returns nodes in visit order.
 */
export function dfs(
  graph: KnowledgeGraph,
  startId: string,
  maxDepth: number = Infinity,
): CodeNode[] {
  const result: CodeNode[] = [];
  const visited = new Set<string>();

  function visit(id: string, depth: number): void {
    if (visited.has(id) || depth > maxDepth) {
      return;
    }
    visited.add(id);

    const node = graph.getNode(id);
    if (node) {
      result.push(node);
    }

    const forwardMap = graph.forward.get(id);
    if (forwardMap) {
      for (const neighborId of forwardMap.keys()) {
        visit(neighborId, depth + 1);
      }
    }
  }

  visit(startId, 0);

  log('graph', 'DFS traversal complete', {
    startId,
    maxDepth,
    nodesVisited: result.length,
  });
  return result;
}

/**
 * Find the shortest path between two nodes using BFS.
 * Returns an array of node IDs forming the path, or null if no path exists.
 * Considers both forward and reverse edges (undirected search).
 */
export function findPath(
  graph: KnowledgeGraph,
  fromId: string,
  toId: string,
): string[] | null {
  if (fromId === toId) {
    return [fromId];
  }

  if (!graph.getNode(fromId) || !graph.getNode(toId)) {
    return null;
  }

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [fromId];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Gather all neighbors (forward + reverse for undirected path finding)
    const neighborIds = new Set<string>();

    const forwardMap = graph.forward.get(current);
    if (forwardMap) {
      for (const id of forwardMap.keys()) {
        neighborIds.add(id);
      }
    }

    const reverseMap = graph.reverse.get(current);
    if (reverseMap) {
      for (const id of reverseMap.keys()) {
        neighborIds.add(id);
      }
    }

    for (const neighborId of neighborIds) {
      if (visited.has(neighborId)) {
        continue;
      }
      visited.add(neighborId);
      parent.set(neighborId, current);

      if (neighborId === toId) {
        // Reconstruct path
        const path: string[] = [];
        let cur: string | undefined = toId;
        while (cur !== undefined) {
          path.unshift(cur);
          cur = parent.get(cur);
        }
        log('graph', 'Path found', { fromId, toId, pathLength: path.length });
        return path;
      }

      queue.push(neighborId);
    }
  }

  log('graph', 'No path found', { fromId, toId });
  return null;
}

/**
 * Follow only 'calls' edges forward from a starting node.
 * Returns all nodes in the call chain.
 */
export function getCallChain(
  graph: KnowledgeGraph,
  startId: string,
): CodeNode[] {
  const result: CodeNode[] = [];
  const visited = new Set<string>();
  const stack: string[] = [startId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);

    const node = graph.getNode(id);
    if (node) {
      result.push(node);
    }

    // Only follow 'calls' edges
    const forwardMap = graph.forward.get(id);
    if (forwardMap) {
      for (const [targetId, edgeTypes] of forwardMap) {
        if (edgeTypes.includes('calls') && !visited.has(targetId)) {
          stack.push(targetId);
        }
      }
    }
  }

  log('graph', 'Call chain traced', {
    startId,
    chainLength: result.length,
  });
  return result;
}

/**
 * Find everything that depends on a given node by following reverse
 * 'calls', 'imports', and 'uses' edges.
 */
export function getReverseDependencies(
  graph: KnowledgeGraph,
  nodeId: string,
): CodeNode[] {
  const dependencyTypes = new Set(['calls', 'imports', 'uses']);
  const result: CodeNode[] = [];
  const visited = new Set<string>();
  const stack: string[] = [nodeId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);

    // Don't include the starting node in results
    if (id !== nodeId) {
      const node = graph.getNode(id);
      if (node) {
        result.push(node);
      }
    }

    // Follow reverse edges of relevant types
    const reverseMap = graph.reverse.get(id);
    if (reverseMap) {
      for (const [sourceId, edgeTypes] of reverseMap) {
        const hasRelevantEdge = edgeTypes.some((t) => dependencyTypes.has(t));
        if (hasRelevantEdge && !visited.has(sourceId)) {
          stack.push(sourceId);
        }
      }
    }
  }

  log('graph', 'Reverse dependencies found', {
    nodeId,
    dependencyCount: result.length,
  });
  return result;
}

/**
 * Detect circular dependencies in the graph.
 * Returns arrays of node IDs forming cycles.
 * Uses a DFS-based approach with coloring (white/gray/black).
 */
export function findCycles(graph: KnowledgeGraph): string[][] {
  const WHITE = 0; // unvisited
  const GRAY = 1;  // in current path
  const BLACK = 2; // fully processed

  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  for (const id of graph.nodes.keys()) {
    color.set(id, WHITE);
  }

  function dfsVisit(nodeId: string): void {
    color.set(nodeId, GRAY);

    const forwardMap = graph.forward.get(nodeId);
    if (forwardMap) {
      for (const neighborId of forwardMap.keys()) {
        if (!graph.nodes.has(neighborId)) {
          continue;
        }

        const neighborColor = color.get(neighborId);

        if (neighborColor === GRAY) {
          // Found a cycle — reconstruct it
          const cycle: string[] = [neighborId];
          let cur = nodeId;
          while (cur !== neighborId) {
            cycle.unshift(cur);
            const p = parent.get(cur);
            if (p === null || p === undefined) break;
            cur = p;
          }
          cycle.unshift(neighborId);
          cycles.push(cycle);
        } else if (neighborColor === WHITE) {
          parent.set(neighborId, nodeId);
          dfsVisit(neighborId);
        }
      }
    }

    color.set(nodeId, BLACK);
  }

  for (const id of graph.nodes.keys()) {
    if (color.get(id) === WHITE) {
      parent.set(id, null);
      dfsVisit(id);
    }
  }

  log('graph', 'Cycle detection complete', { cyclesFound: cycles.length });
  return cycles;
}

/**
 * Topological sort of nodes using Kahn's algorithm.
 * Nodes involved in cycles are appended at the end.
 */
export function topologicalSort(graph: KnowledgeGraph): string[] {
  // Compute in-degrees
  const inDegree = new Map<string, number>();
  for (const id of graph.nodes.keys()) {
    inDegree.set(id, 0);
  }

  for (const edge of graph.edges) {
    if (graph.nodes.has(edge.source) && graph.nodes.has(edge.target)) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Initialize queue with nodes that have 0 in-degree
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    const forwardMap = graph.forward.get(nodeId);
    if (forwardMap) {
      for (const targetId of forwardMap.keys()) {
        if (!graph.nodes.has(targetId)) continue;
        const newDegree = (inDegree.get(targetId) || 1) - 1;
        inDegree.set(targetId, newDegree);
        if (newDegree === 0) {
          queue.push(targetId);
        }
      }
    }
  }

  // Any remaining nodes are part of cycles — append them
  for (const id of graph.nodes.keys()) {
    if (!sorted.includes(id)) {
      sorted.push(id);
    }
  }

  log('graph', 'Topological sort complete', {
    totalNodes: sorted.length,
    nodesInCycles: sorted.length - queue.length,
  });
  return sorted;
}
