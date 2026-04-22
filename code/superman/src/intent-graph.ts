import { log } from './logger.js';
import type { IntentNode, IntentNodeType, IntentStatus } from './types.js';

/**
 * Multi-level intent graph.
 *
 * Level 0 = product-level ("Build a SaaS API")
 * Level 1 = systems (auth, api, database)
 * Level 2 = features (login route, user model, JWT middleware)
 * Level 3 = implementation details (validate input, hash password)
 * Level 4+ = code-level nodes (linked to actual CodeNode IDs)
 */
export class IntentGraph {
  private nodes = new Map<string, IntentNode>();
  private rootIds: string[] = [];

  createNode(
    id: string,
    level: number,
    title: string,
    type: IntentNodeType,
    opts?: {
      description?: string;
      parent?: string;
      linkedCode?: string[];
      status?: IntentStatus;
      userVisible?: boolean;
    },
  ): IntentNode {
    const node: IntentNode = {
      id,
      level,
      title,
      type,
      children: [],
      description: opts?.description,
      parent: opts?.parent,
      linkedCode: opts?.linkedCode,
      userVisible: opts?.userVisible,
      status: opts?.status ?? 'planned',
    };
    this.nodes.set(id, node);

    if (!opts?.parent) {
      if (!this.rootIds.includes(id)) this.rootIds.push(id);
    }

    return node;
  }

  addChild(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    if (!parent || !child) return;

    if (!parent.children.includes(childId)) {
      parent.children.push(childId);
    }
    child.parent = parentId;

    // Remove from roots if it was there
    this.rootIds = this.rootIds.filter((id) => id !== childId);
  }

  getNode(id: string): IntentNode | undefined {
    return this.nodes.get(id);
  }

  getRoots(): IntentNode[] {
    return this.rootIds.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Get the full subtree rooted at a node, including the node itself.
   * Returns nodes in depth-first pre-order (parent before children).
   */
  getSubtree(nodeId: string): IntentNode[] {
    const result: IntentNode[] = [];
    const visit = (id: string) => {
      const node = this.nodes.get(id);
      if (!node) return;
      result.push(node);
      for (const childId of node.children) {
        visit(childId);
      }
    };
    visit(nodeId);
    return result;
  }

  /**
   * Get all nodes at a specific level.
   */
  getNodesByLevel(level: number): IntentNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.level === level);
  }

  /**
   * Traverse the entire graph in depth-first pre-order.
   * Callback receives each node; return false to stop.
   */
  traverseGraph(callback: (node: IntentNode) => boolean | void): void {
    const visited = new Set<string>();
    const visit = (id: string): boolean => {
      if (visited.has(id)) return true;
      visited.add(id);
      const node = this.nodes.get(id);
      if (!node) return true;
      if (callback(node) === false) return false;
      for (const childId of node.children) {
        if (!visit(childId)) return false;
      }
      return true;
    };
    for (const rootId of this.rootIds) {
      if (!visit(rootId)) break;
    }
  }

  /**
   * Update the status of a node based on its children's statuses.
   * A node is 'complete' if all children are complete,
   * 'partial' if some children are complete, 'planned' if none.
   */
  updateStatus(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    if (node.children.length === 0) return; // leaf status is set externally

    const childStatuses = node.children
      .map((id) => this.nodes.get(id)?.status)
      .filter(Boolean) as IntentStatus[];

    if (childStatuses.length === 0) return;

    const allComplete = childStatuses.every((s) => s === 'complete');
    const anyComplete = childStatuses.some((s) => s === 'complete' || s === 'partial');

    node.status = allComplete ? 'complete' : anyComplete ? 'partial' : 'planned';

    // Propagate up
    if (node.parent) this.updateStatus(node.parent);
  }

  /**
   * Link code node IDs to an intent node.
   */
  linkCode(intentNodeId: string, codeNodeIds: string[]): void {
    const node = this.nodes.get(intentNodeId);
    if (!node) return;
    if (!node.linkedCode) node.linkedCode = [];
    for (const id of codeNodeIds) {
      if (!node.linkedCode.includes(id)) node.linkedCode.push(id);
    }
  }

  /**
   * Get all nodes in the graph.
   */
  allNodes(): IntentNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get max depth in the graph.
   */
  maxLevel(): number {
    let max = 0;
    for (const node of this.nodes.values()) {
      if (node.level > max) max = node.level;
    }
    return max;
  }

  /**
   * Get stats about the graph.
   */
  getStats(): {
    totalNodes: number;
    maxLevel: number;
    byLevel: Record<number, number>;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  } {
    const byLevel: Record<number, number> = {};
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      byLevel[node.level] = (byLevel[node.level] || 0) + 1;
      byStatus[node.status || 'planned'] = (byStatus[node.status || 'planned'] || 0) + 1;
      byType[node.type] = (byType[node.type] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      maxLevel: this.maxLevel(),
      byLevel,
      byStatus,
      byType,
    };
  }

  /**
   * Serialize the graph for JSON output.
   */
  toJSON(): { roots: string[]; nodes: IntentNode[] } {
    return {
      roots: this.rootIds,
      nodes: Array.from(this.nodes.values()),
    };
  }

  /**
   * Load from serialized JSON.
   */
  static fromJSON(data: { roots: string[]; nodes: IntentNode[] }): IntentGraph {
    const graph = new IntentGraph();
    for (const node of data.nodes) {
      graph.nodes.set(node.id, { ...node });
    }
    graph.rootIds = [...data.roots];
    return graph;
  }
}
