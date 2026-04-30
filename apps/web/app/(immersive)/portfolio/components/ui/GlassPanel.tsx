'use client';

import { type ReactNode, type CSSProperties, useRef, useId } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from 'motion/react';
import { DraggableElement } from './DraggableElement';

const SPRING_CONFIG = { stiffness: 150, damping: 20, mass: 0.5 };
const MAX_ROTATION = 3; // degrees

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function GlassPanel({ children, className, style }: GlassPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  /* ---- raw mouse offsets from panel center (normalised -1..1) ---- */
  const mouseXRaw = useMotionValue(0);
  const mouseYRaw = useMotionValue(0);

  /* ---- smoothed via spring ---- */
  const mouseX = useSpring(mouseXRaw, SPRING_CONFIG);
  const mouseY = useSpring(mouseYRaw, SPRING_CONFIG);

  /* ---- map to rotation (note: X-mouse -> Y-rotation, Y-mouse -> X-rotation) ---- */
  const rotateY = useTransform(mouseX, [-1, 1], [-MAX_ROTATION, MAX_ROTATION]);
  const rotateX = useTransform(
    mouseY,
    [-1, 1],
    [MAX_ROTATION, -MAX_ROTATION],
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = panelRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const nx = (e.clientX - centerX) / (rect.width / 2);
    const ny = (e.clientY - centerY) / (rect.height / 2);

    mouseXRaw.set(Math.max(-1, Math.min(1, nx)));
    mouseYRaw.set(Math.max(-1, Math.min(1, ny)));
  }

  function handleMouseLeave() {
    mouseXRaw.set(0);
    mouseYRaw.set(0);
  }

  return (
    <DraggableElement id={`glass-panel-${id}`}>
      <motion.div
        ref={panelRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={className}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '48px',
          perspective: 1000,
          rotateX,
          rotateY,
          ...style,
        }}
      >
        {children}
      </motion.div>
    </DraggableElement>
  );
}
