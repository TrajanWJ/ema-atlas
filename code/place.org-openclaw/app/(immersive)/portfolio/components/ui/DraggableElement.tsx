'use client';

import {
  type ReactNode,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { useVariantStore } from '../../lib/variantStore';

/* ------------------------------------------------------------------ */
/*  Module-level z-index counter shared across all DraggableElements  */
/* ------------------------------------------------------------------ */
let globalZCounter = 1;

/* ------------------------------------------------------------------ */
/*  Registry so variant changes can stagger-reset every instance      */
/* ------------------------------------------------------------------ */
type ResetFn = (delayMs: number) => void;
const registry = new Set<ResetFn>();

const SNAP_SPRING = { type: 'spring' as const, stiffness: 200, damping: 25 };

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
type DraggableElementProps = {
  children: ReactNode;
  id: string;
  disabled?: boolean;
  snapBack?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function DraggableElement({
  children,
  id,
  disabled = false,
  snapBack = true,
  className,
  style,
}: DraggableElementProps) {
  const controls = useAnimationControls();
  const zRef = useRef(globalZCounter);
  const indexRef = useRef<number>(-1);

  /* ---- register for variant-change resets ---- */
  const resetToOrigin: ResetFn = useCallback(
    (delayMs: number) => {
      void controls.start({
        x: 0,
        y: 0,
        transition: { ...SNAP_SPRING, delay: delayMs / 1000 },
      });
    },
    [controls],
  );

  useEffect(() => {
    const currentReset = resetToOrigin;
    registry.add(currentReset);

    // Assign a stable index for stagger ordering
    indexRef.current = registry.size - 1;

    return () => {
      registry.delete(currentReset);
    };
  }, [resetToOrigin]);

  /* ---- listen for variant changes ---- */
  const prevVariantRef = useRef(useVariantStore.getState().activeVariantId);

  useEffect(() => {
    const unsub = useVariantStore.subscribe((state) => {
      if (state.activeVariantId !== prevVariantRef.current) {
        prevVariantRef.current = state.activeVariantId;
        let i = 0;
        for (const fn of registry) {
          fn(i * 20);
          i++;
        }
      }
    });
    return unsub;
  }, []);

  /* ---- handlers ---- */
  const handleDragStart = useCallback(() => {
    globalZCounter += 1;
    zRef.current = globalZCounter;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (snapBack) {
      void controls.start({ x: 0, y: 0, transition: SNAP_SPRING });
    }
  }, [snapBack, controls]);

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    void controls.start({ x: 0, y: 0, transition: SNAP_SPRING });
  }, [disabled, controls]);

  if (disabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      data-draggable-id={id}
      drag
      dragMomentum={false}
      dragElastic={0.15}
      animate={controls}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleClick}
      className={className}
      style={{
        ...style,
        zIndex: zRef.current,
        cursor: 'grab',
      }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {children}
    </motion.div>
  );
}
