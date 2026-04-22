/**
 * 3D layout engine.
 *
 * Level 1 flows sit on a fixed horizontal line along the X axis (z=0).
 * Children branch off below (negative Y) and outward (Z axis).
 * All positions are in 3D world space.
 */

import type { IntentNode } from '@/store/editor-store';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  z: number;
  level: number;
  radius: number;
  data: IntentNode;
  children: string[];
  parent?: string;
}

export interface LayoutEdge {
  from: string;
  to: string;
}

export interface GraphLayout {
  nodes: Map<string, LayoutNode>;
  edges: LayoutEdge[];
}

const FLOW_SPACING = 180;
const CHILD_DROP_Y = 100;
const CHILD_SPREAD_X = 80;
const CHILD_PUSH_Z = 60;

export function computeLayout(intentNodes: IntentNode[]): GraphLayout {
  const nodeMap = new Map<string, IntentNode>();
  for (const n of intentNodes) nodeMap.set(n.id, n);

  const layoutNodes = new Map<string, LayoutNode>();
  const edges: LayoutEdge[] = [];

  const roots = intentNodes.filter((n) => !n.parent || !nodeMap.has(n.parent));
  if (roots.length === 0) return { nodes: layoutNodes, edges };

  const root = roots[0];
  const flows = root.children
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as IntentNode[];

  // Root at origin, slightly above the line
  addNode(layoutNodes, root, 0, 40, 0, 14);

  // Flows on a straight line along X axis, y=0, z=0
  const totalW = (flows.length - 1) * FLOW_SPACING;
  const startX = -totalW / 2;

  for (let i = 0; i < flows.length; i++) {
    const fx = startX + i * FLOW_SPACING;
    addNode(layoutNodes, flows[i], fx, 0, 0, 8);
    edges.push({ from: root.id, to: flows[i].id });
    layoutChildren(flows[i], fx, 0, 0, nodeMap, layoutNodes, edges, 2);
  }

  return { nodes: layoutNodes, edges };
}

function layoutChildren(
  parent: IntentNode,
  px: number, py: number, pz: number,
  nodeMap: Map<string, IntentNode>,
  layoutNodes: Map<string, LayoutNode>,
  edges: LayoutEdge[],
  depth: number,
): void {
  const children = parent.children
    .map((id) => nodeMap.get(id))
    .filter(Boolean) as IntentNode[];
  if (children.length === 0) return;

  const spread = CHILD_SPREAD_X / Math.max(1, depth * 0.4);
  const totalW = (children.length - 1) * spread;
  const startX = px - totalW / 2;
  const cy = py - CHILD_DROP_Y;
  const cz = pz + CHILD_PUSH_Z * (depth % 2 === 0 ? 1 : -1); // alternate z
  const radius = Math.max(2.5, 7 - depth);

  for (let i = 0; i < children.length; i++) {
    const cx = children.length === 1 ? px : startX + i * spread;
    addNode(layoutNodes, children[i], cx, cy, cz, radius);
    edges.push({ from: parent.id, to: children[i].id });
    if (depth < 5) {
      layoutChildren(children[i], cx, cy, cz, nodeMap, layoutNodes, edges, depth + 1);
    }
  }
}

function addNode(
  layoutNodes: Map<string, LayoutNode>,
  node: IntentNode,
  x: number, y: number, z: number,
  radius: number,
): void {
  layoutNodes.set(node.id, {
    id: node.id, x, y, z,
    level: node.level, radius,
    data: node,
    children: node.children,
    parent: node.parent,
  });
}

/**
 * Project a 3D point to 2D screen coordinates given camera orbit angles.
 * Camera orbits around the origin looking at it.
 */
export function project(
  wx: number, wy: number, wz: number,
  rotX: number, rotY: number, dist: number,
  screenW: number, screenH: number,
): { sx: number; sy: number; depth: number } | null {
  // Rotate around Y axis (horizontal orbit)
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  let rx = wx * cosY + wz * sinY;
  let rz = -wx * sinY + wz * cosY;
  let ry = wy;

  // Rotate around X axis (vertical orbit)
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const ry2 = ry * cosX - rz * sinX;
  const rz2 = ry * sinX + rz * cosX;
  ry = ry2;
  rz = rz2;

  // Perspective: camera at distance along Z
  const eyeZ = rz + dist;
  if (eyeZ < 50) return null; // behind camera

  const fov = 800;
  const scale = fov / eyeZ;
  const sx = rx * scale + screenW / 2;
  const sy = -ry * scale + screenH / 2;

  return { sx, sy, depth: eyeZ };
}

export function zoomToMaxLevel(dist: number): number {
  if (dist > 2500) return 0;
  if (dist > 1500) return 1;
  if (dist > 800) return 2;
  if (dist > 400) return 3;
  return 4;
}
