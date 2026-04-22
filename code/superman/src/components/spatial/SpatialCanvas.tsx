'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore, type IntentNode } from '@/store/editor-store';
import { computeLayout, project, zoomToMaxLevel, type GraphLayout, type LayoutNode } from './layout-engine';
import { NodeInspector } from './NodeInspector';

const STATUS_COLORS: Record<string, string> = {
  complete: '#34d399',
  partial: '#fbbf24',
  planned: '#f87171',
};

const LEVEL_LABELS = ['Product', 'Flows', 'Actions', 'System', 'Code'];

export default function SpatialCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<GraphLayout | null>(null);

  // Orbit camera: rotX (pitch), rotY (yaw), dist (zoom distance)
  const cam = useRef({ rotX: 0.3, rotY: 0, dist: 1800 });
  const camSmooth = useRef({ rotX: 0.3, rotY: 0, dist: 1800 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startRotX: 0, startRotY: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  const intentNodes = useEditorStore((s) => s.intentNodes);
  const loadIntentGraph = useEditorStore((s) => s.loadIntentGraph);
  const projectPath = useEditorStore((s) => s.projectPath);

  useEffect(() => {
    if (projectPath) loadIntentGraph(4);
  }, [projectPath, loadIntentGraph]);

  useEffect(() => {
    if (intentNodes.length > 0) {
      layoutRef.current = computeLayout(intentNodes);
      // Reset camera to a good default
      cam.current = { rotX: 0.25, rotY: 0, dist: 1800 };
      camSmooth.current = { ...cam.current };
    }
  }, [intentNodes]);

  // ── Rendering ──

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Smooth lerp
    const s = camSmooth.current;
    const t = cam.current;
    s.rotX += (t.rotX - s.rotX) * 0.1;
    s.rotY += (t.rotY - s.rotY) * 0.1;
    s.dist += (t.dist - s.dist) * 0.1;

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    const layout = layoutRef.current;
    if (!layout || layout.nodes.size === 0) {
      ctx.fillStyle = '#444';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(projectPath ? 'Loading...' : 'Load a project to explore', w / 2, h / 2);
      return;
    }

    const maxLevel = zoomToMaxLevel(s.dist);
    setCurrentLevel(maxLevel);

    // Project all visible nodes to 2D
    type Projected = { node: LayoutNode; sx: number; sy: number; depth: number; scale: number };
    const projected: Projected[] = [];

    for (const node of layout.nodes.values()) {
      if (node.level > maxLevel) continue;
      const p = project(node.x, node.y, node.z, s.rotX, s.rotY, s.dist, w, h);
      if (!p) continue;
      if (p.sx < -100 || p.sx > w + 100 || p.sy < -100 || p.sy > h + 100) continue;
      const scale = 800 / p.depth;
      projected.push({ node, sx: p.sx, sy: p.sy, depth: p.depth, scale });
    }

    // Sort back-to-front
    projected.sort((a, b) => b.depth - a.depth);

    // ── Draw the main spine line ──
    // Find leftmost and rightmost flow nodes
    const flows = projected.filter((p) => p.node.level === 1);
    if (flows.length >= 2) {
      const sorted = [...flows].sort((a, b) => a.sx - b.sx);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(first.sx - 40, first.sy);
      ctx.lineTo(last.sx + 40, last.sy);
      ctx.stroke();

      // Subtle glow on the line
      const lineGrad = ctx.createLinearGradient(first.sx - 40, first.sy, last.sx + 40, last.sy);
      lineGrad.addColorStop(0, 'rgba(99,102,241,0)');
      lineGrad.addColorStop(0.3, 'rgba(99,102,241,0.04)');
      lineGrad.addColorStop(0.7, 'rgba(99,102,241,0.04)');
      lineGrad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(first.sx - 40, first.sy);
      ctx.lineTo(last.sx + 40, last.sy);
      ctx.stroke();
    }

    // ── Draw edges ──
    for (const edge of layout.edges) {
      const fromP = projected.find((p) => p.node.id === edge.from);
      const toP = projected.find((p) => p.node.id === edge.to);
      if (!fromP || !toP) continue;

      // Skip spine edges (already drawn as the line)
      if (fromP.node.level === 0 && toP.node.level === 1) continue;

      const alpha = Math.max(0.03, 0.12 * Math.min(fromP.scale, toP.scale));
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = Math.max(0.5, 1 * Math.min(fromP.scale, toP.scale));
      ctx.beginPath();
      ctx.moveTo(fromP.sx, fromP.sy);
      // Curve downward
      const midX = (fromP.sx + toP.sx) / 2;
      const midY = (fromP.sy + toP.sy) / 2 + 10 / Math.min(fromP.scale, toP.scale);
      ctx.quadraticCurveTo(midX, midY, toP.sx, toP.sy);
      ctx.stroke();
    }

    // ── Draw nodes (front-to-back order, so we already sorted back-to-front — reverse) ──
    for (let i = projected.length - 1; i >= 0; i--) {
      const { node, sx, sy, scale } = projected[i];
      const status = node.data.status || 'planned';
      const color = STATUS_COLORS[status] || '#888';
      const r = Math.max(2, node.radius * scale);
      const isHov = node.id === hoveredNodeId;
      const isSel = node.id === selectedNodeId;

      // Depth fade — farther = more transparent
      const depthAlpha = Math.min(1, scale * 1.5);

      // Glow
      const glowR = r + (isHov ? 18 : isSel ? 14 : 8) * scale;
      const grad = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, glowR);
      grad.addColorStop(0, color + hexAlpha(depthAlpha * (isHov ? 0.7 : isSel ? 0.55 : 0.3)));
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = isHov || isSel ? '#fff' : color;
      ctx.globalAlpha = depthAlpha;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Selection ring
      if (isSel) {
        ctx.strokeStyle = `rgba(255,255,255,${depthAlpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, r + 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label — only when close enough and scaled enough
      const labelThreshold = 0.4 + node.level * 0.15;
      if (scale > labelThreshold) {
        const labelAlpha = Math.min(1, (scale - labelThreshold) * 4) * depthAlpha;
        if (labelAlpha > 0.05) {
          const fs = Math.max(9, Math.min(14, 13 * scale));
          const text = node.data.title;
          ctx.font = `500 ${fs}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          const tm = ctx.measureText(text);
          const labelY = sy + r + fs + 4;

          // Pill bg
          ctx.fillStyle = `rgba(0,0,0,${labelAlpha * 0.65})`;
          const pw = tm.width + 10, ph = fs + 4;
          ctx.beginPath();
          ctx.roundRect(sx - pw / 2, labelY - fs, pw, ph, 4);
          ctx.fill();

          ctx.fillStyle = `rgba(255,255,255,${labelAlpha * 0.9})`;
          ctx.fillText(text, sx, labelY - 2);
        }
      }
    }
  }, [hoveredNodeId, selectedNodeId, projectPath]);

  // ── Animation loop ──
  useEffect(() => {
    let raf: number;
    const loop = () => { render(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  // ── Hit test ──
  const hitTest = useCallback((clientX: number, clientY: number): LayoutNode | null => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    const s = camSmooth.current;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const maxLevel = zoomToMaxLevel(s.dist);

    let best: LayoutNode | null = null, bestD = Infinity;
    for (const node of layout.nodes.values()) {
      if (node.level > maxLevel) continue;
      const p = project(node.x, node.y, node.z, s.rotX, s.rotY, s.dist, w, h);
      if (!p) continue;
      const scale = 800 / p.depth;
      const hr = Math.max(14, node.radius * scale + 10);
      const d = (mx - p.sx) ** 2 + (my - p.sy) ** 2;
      if (d < hr * hr && d < bestD) { best = node; bestD = d; }
    }
    return best;
  }, []);

  // ── Mouse: drag to orbit ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      startRotX: cam.current.rotX, startRotY: cam.current.rotY,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (d.active) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      cam.current.rotY = d.startRotY + dx * 0.004;
      cam.current.rotX = Math.max(-1.2, Math.min(1.2, d.startRotX + dy * 0.004));
    }
    const hit = hitTest(e.clientX, e.clientY);
    setHoveredNodeId(hit?.id || null);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hit ? 'pointer' : d.active ? 'grabbing' : 'grab';
  }, [hitTest]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    const moved = Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY);
    d.active = false;
    if (moved < 5) {
      const hit = hitTest(e.clientX, e.clientY);
      setSelectedNodeId(hit?.id || null);
    }
  }, [hitTest]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) return;
    // Zoom toward node
    cam.current.dist = Math.max(200, cam.current.dist * 0.4);
  }, [hitTest]);

  // Scroll = zoom (change distance)
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    cam.current.dist = Math.max(150, Math.min(4000, cam.current.dist * factor));
  }, []);

  const zoomIn = useCallback(() => { cam.current.dist = Math.max(150, cam.current.dist * 0.65); }, []);
  const zoomOut = useCallback(() => { cam.current.dist = Math.min(4000, cam.current.dist * 1.5); }, []);
  const resetView = useCallback(() => { cam.current = { rotX: 0.25, rotY: 0, dist: 1800 }; }, []);

  const selectedNode = selectedNodeId
    ? intentNodes.find((n) => n.id === selectedNodeId) || null
    : null;

  const nodeCount = intentNodes.length;
  const flowCount = intentNodes.filter((n) => n.type === 'flow').length;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050505]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragRef.current.active = false; setHoveredNodeId(null); }}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
      />

      {/* Zoom buttons */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 select-none">
        <button onClick={zoomIn} className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all text-lg font-light">+</button>
        <button onClick={zoomOut} className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all text-lg font-light">−</button>
        <button onClick={resetView} title="Reset view" className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="1" width="12" height="12" rx="2" /><path d="M5 3H3v2M9 3h2v2M5 11H3V9M9 11h2V9" /></svg>
        </button>
      </div>

      {/* Level pills */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 select-none pointer-events-none">
        {LEVEL_LABELS.map((label, i) => (
          <span key={label} className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${i <= currentLevel ? 'bg-white/[0.08] text-white/60' : 'bg-transparent text-white/15'} ${i === currentLevel ? 'ring-1 ring-white/20 text-white/80' : ''}`}>{label}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 flex items-center gap-3 text-[11px] text-white/25 select-none pointer-events-none">
        <span>{flowCount} flows</span>
        <span className="text-white/10">·</span>
        <span>{nodeCount} nodes</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-5 right-5 flex items-center gap-3 select-none pointer-events-none">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-white/30">{status}</span>
          </span>
        ))}
      </div>

      {/* Orbit hint */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 mt-8 translate-y-8 text-[10px] text-white/15 select-none pointer-events-none">
        drag to orbit · scroll to zoom · click to inspect
      </div>

      {selectedNode && <NodeInspector node={selectedNode} onClose={() => setSelectedNodeId(null)} />}
    </div>
  );
}

function hexAlpha(a: number): string {
  return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
}
