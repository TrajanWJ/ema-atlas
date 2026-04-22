import { log } from '../logger.js';
import type { CodeNode, CodeEdge, NodeType, EdgeType } from '../types.js';

export class KnowledgeGraph {
  nodes: Map<string, CodeNode> = new Map();
  edges: CodeEdge[] = [];
  forward: Map<string, Map<string, EdgeType[]>> = new Map();
  reverse: Map<string, Map<string, EdgeType[]>> = new Map();

  build(nodes: CodeNode[], edges: CodeEdge[]): void {
    this.nodes.clear();
    this.edges = [];
    this.forward.clear();
    this.reverse.clear();

    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }

    for (const edge of edges) {
      this.edges.push(edge);
      this.indexEdge(edge);
    }

    log('graph', 'Knowledge graph built', {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
    });
  }

  addNode(node: CodeNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: CodeEdge): void {
    this.edges.push(edge);
    this.indexEdge(edge);
  }

  removeByFile(filePath: string): void {
    // Collect node IDs for this file
    const removedIds = new Set<string>();
    for (const [id, node] of this.nodes) {
      if (node.filePath === filePath) {
        removedIds.add(id);
      }
    }

    // Remove nodes
    for (const id of removedIds) {
      this.nodes.delete(id);
    }

    // Remove edges that reference removed nodes and rebuild indices
    this.edges = this.edges.filter(
      (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
    );

    // Rebuild adjacency maps
    this.forward.clear();
    this.reverse.clear();
    for (const edge of this.edges) {
      this.indexEdge(edge);
    }

    log('graph', 'Removed nodes/edges by file', {
      filePath,
      removedNodes: removedIds.size,
    });
  }

  getNode(id: string): CodeNode | undefined {
    return this.nodes.get(id);
  }

  getNeighbors(id: string, direction: 'forward' | 'reverse' | 'both'): CodeNode[] {
    const neighborIds = new Set<string>();

    if (direction === 'forward' || direction === 'both') {
      const forwardMap = this.forward.get(id);
      if (forwardMap) {
        for (const targetId of forwardMap.keys()) {
          neighborIds.add(targetId);
        }
      }
    }

    if (direction === 'reverse' || direction === 'both') {
      const reverseMap = this.reverse.get(id);
      if (reverseMap) {
        for (const sourceId of reverseMap.keys()) {
          neighborIds.add(sourceId);
        }
      }
    }

    const result: CodeNode[] = [];
    for (const nid of neighborIds) {
      const node = this.nodes.get(nid);
      if (node) {
        result.push(node);
      }
    }
    return result;
  }

  getEdgesFor(id: string, direction: 'forward' | 'reverse' | 'both'): CodeEdge[] {
    const result: CodeEdge[] = [];

    if (direction === 'forward' || direction === 'both') {
      for (const edge of this.edges) {
        if (edge.source === id) {
          result.push(edge);
        }
      }
    }

    if (direction === 'reverse' || direction === 'both') {
      for (const edge of this.edges) {
        if (edge.target === id) {
          result.push(edge);
        }
      }
    }

    return result;
  }

  findByName(name: string): CodeNode[] {
    const lower = name.toLowerCase();
    const result: CodeNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.name.toLowerCase().includes(lower)) {
        result.push(node);
      }
    }
    return result;
  }

  findByType(type: NodeType): CodeNode[] {
    const result: CodeNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        result.push(node);
      }
    }
    return result;
  }

  findByFile(filePath: string): CodeNode[] {
    const result: CodeNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.filePath === filePath) {
        result.push(node);
      }
    }
    return result;
  }

  getSubgraph(
    nodeIds: string[],
    depth: number,
  ): { nodes: CodeNode[]; edges: CodeEdge[] } {
    const visited = new Set<string>();
    let frontier = new Set<string>(nodeIds);

    // Collect all node IDs within depth
    for (let d = 0; d <= depth; d++) {
      for (const id of frontier) {
        visited.add(id);
      }
      if (d === depth) break;

      const nextFrontier = new Set<string>();
      for (const id of frontier) {
        // Forward neighbors
        const fwd = this.forward.get(id);
        if (fwd) {
          for (const targetId of fwd.keys()) {
            if (!visited.has(targetId)) {
              nextFrontier.add(targetId);
            }
          }
        }
        // Reverse neighbors
        const rev = this.reverse.get(id);
        if (rev) {
          for (const sourceId of rev.keys()) {
            if (!visited.has(sourceId)) {
              nextFrontier.add(sourceId);
            }
          }
        }
      }
      frontier = nextFrontier;
    }

    const subNodes: CodeNode[] = [];
    for (const id of visited) {
      const node = this.nodes.get(id);
      if (node) {
        subNodes.push(node);
      }
    }

    const subEdges = this.edges.filter(
      (e) => visited.has(e.source) && visited.has(e.target),
    );

    return { nodes: subNodes, edges: subEdges };
  }

  getStats(): {
    nodeCount: number;
    edgeCount: number;
    fileCount: number;
    nodesByType: Record<string, number>;
  } {
    const files = new Set<string>();
    const nodesByType: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      files.add(node.filePath);
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      fileCount: files.size,
      nodesByType,
    };
  }

  private indexEdge(edge: CodeEdge): void {
    // Forward index: source -> target -> edge types
    let fwdTargets = this.forward.get(edge.source);
    if (!fwdTargets) {
      fwdTargets = new Map();
      this.forward.set(edge.source, fwdTargets);
    }
    let fwdTypes = fwdTargets.get(edge.target);
    if (!fwdTypes) {
      fwdTypes = [];
      fwdTargets.set(edge.target, fwdTypes);
    }
    fwdTypes.push(edge.type);

    // Reverse index: target -> source -> edge types
    let revSources = this.reverse.get(edge.target);
    if (!revSources) {
      revSources = new Map();
      this.reverse.set(edge.target, revSources);
    }
    let revTypes = revSources.get(edge.source);
    if (!revTypes) {
      revTypes = [];
      revSources.set(edge.source, revTypes);
    }
    revTypes.push(edge.type);
  }
}
