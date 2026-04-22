import { IntentGraph } from './intent-graph.js';
import { log } from './logger.js';
import type { IntentNode } from './types.js';

/**
 * Returns all intent nodes visible at a given zoom level.
 *
 * Rules:
 * - Only nodes where node.level <= zoomLevel are returned
 * - Parents always appear before their children (depth-first pre-order)
 * - At zoom 0 you see only the product-level node(s)
 * - At zoom 1 you see product + systems
 * - At zoom 2 you see product + systems + features
 * - etc.
 */
export function getVisibleNodes(graph: IntentGraph, zoomLevel: number): IntentNode[] {
  const visible: IntentNode[] = [];

  graph.traverseGraph((node) => {
    if (node.level <= zoomLevel) {
      visible.push(node);
    }
    // Don't traverse into children beyond the zoom level —
    // if this node is already at the zoom boundary, its children
    // are deeper and won't pass the filter, but we still need to
    // visit them in case the graph has uneven depths.
    // The filter above handles exclusion.
  });

  log('intent', `Zoom level ${zoomLevel}: ${visible.length} node(s) visible`);
  return visible;
}

/**
 * Get a summary of what's visible at each zoom level.
 */
export function getZoomSummary(graph: IntentGraph): Array<{
  level: number;
  nodeCount: number;
  types: Record<string, number>;
  statuses: Record<string, number>;
}> {
  const maxLevel = graph.maxLevel();
  const summary = [];

  for (let level = 0; level <= maxLevel; level++) {
    const visible = getVisibleNodes(graph, level);
    const types: Record<string, number> = {};
    const statuses: Record<string, number> = {};

    for (const node of visible) {
      types[node.type] = (types[node.type] || 0) + 1;
      statuses[node.status || 'planned'] = (statuses[node.status || 'planned'] || 0) + 1;
    }

    summary.push({ level, nodeCount: visible.length, types, statuses });
  }

  return summary;
}

/**
 * Get nodes at a specific level that are incomplete or planned.
 * Useful for finding what needs attention at a given abstraction level.
 */
export function getActionableAtLevel(graph: IntentGraph, level: number): IntentNode[] {
  return graph.getNodesByLevel(level).filter(
    (n) => n.status === 'planned' || n.status === 'partial',
  );
}

/**
 * Get the path from root to a specific node (breadcrumb).
 */
export function getAncestorPath(graph: IntentGraph, nodeId: string): IntentNode[] {
  const path: IntentNode[] = [];
  let current = graph.getNode(nodeId);

  while (current) {
    path.unshift(current);
    current = current.parent ? graph.getNode(current.parent) : undefined;
  }

  return path;
}
