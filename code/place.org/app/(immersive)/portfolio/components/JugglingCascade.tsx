'use client';

import { useRef, useEffect, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Sneaker, Browser, Ball, JugglingHands } from './objects';
import { OBJECTS, BALL_COLORS } from '../lib/objects';
import type { ObjectId } from '../lib/objects';
import {
  prepare,
  type JuggleBall,
  type PrepareResult,
  type JugglePattern,
} from '../lib/juggling';
import { useVariantStore } from '../lib/variantStore';

const OBJ_SIZE = 48;
// Shorter beat = lower arcs, more manageable at high object counts
const BEAT_DURATION_MS = 240;
const DWELL = 0.5;

/** Pre-computed random entrance directions for each object (seeded by index). */
function entranceOffset(i: number): { x: number; y: number } {
  const angle = ((i * 137.5) % 360) * (Math.PI / 180);
  const dist = 80 + (i % 3) * 40;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
  };
}

type ObjectMode = 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';

function renderObject(id: ObjectId, mode: ObjectMode) {
  switch (id) {
    case 'sneaker':
      return <Sneaker mode={mode} />;
    case 'browser':
      return <Browser mode={mode} />;
    default:
      return <Ball color={BALL_COLORS[id] ?? '#3b82f6'} mode={mode} />;
  }
}

/** Convert mm (y-up) to screen pixels (y-down).
 *  Clamp y so nothing goes below hand level (y=0 in mm = hands). */
function mmToScreen(
  pos: { x: number; y: number },
  scale: number,
): { x: number; y: number } {
  // In mm space, y >= 0 means at or above hands. Clamp so balls never dip below.
  const clampedY = Math.max(0, pos.y);
  return {
    x: pos.x * scale,
    y: -clampedY * scale,
  };
}

type JugglingCascadeProps = {
  className?: string;
  style?: CSSProperties;
  visibleCount?: number;
  pattern?: JugglePattern;
  /** Half-shower bias (0–0.9) */
  bias?: number;
  /** Windmill cross depth (0.2–1) */
  crossDepth?: number;
};

export function JugglingCascade({
  className,
  style,
  visibleCount,
  pattern = 'cascade',
  bias,
  crossDepth,
}: JugglingCascadeProps) {
  const config = useVariantStore((s) => s.config);

  const objRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftHandRef = useRef<HTMLDivElement | null>(null);
  const rightHandRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef(0);
  const lastTimeRef = useRef(0);

  // Engine state in refs (mutated in rAF, not React state)
  const ballsRef = useRef<JuggleBall[]>([]);
  const innerRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const catchHeightRef = useRef(0);

  // Smoothed hand state for fluid movement + rotation
  const smoothLeftRef = useRef({ x: 0, y: 0, rot: 0 });
  const smoothRightRef = useRef({ x: 0, y: 0, rot: 0 });
  const handsInitialized = useRef(false);

  // Keep props in refs so the rAF loop always reads latest values
  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const countRef = useRef(visibleCount ?? OBJECTS.length);
  countRef.current = visibleCount ?? OBJECTS.length;

  const objectCount = visibleCount ?? OBJECTS.length;

  // Initialize / re-initialize engine when pattern or count changes
  useEffect(() => {
    const result: PrepareResult = prepare({
      pattern: patternRef.current,
      beatDuration: BEAT_DURATION_MS,
      dwell: DWELL,
      objectCount,
      bias,
      crossDepth,
    });
    ballsRef.current = result.balls;
    innerRef.current = { width: result.innerWidth, height: result.innerHeight };
    catchHeightRef.current = result.catchHeight;
    lastTimeRef.current = 0;
    handsInitialized.current = false;
  }, [pattern, objectCount, bias, crossDepth]);

  // Animation loop
  useEffect(() => {
    function tick(time: number) {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16.67;
      lastTimeRef.current = time;

      const balls = ballsRef.current;
      const { width: iw, height: ih } = innerRef.current;

      if (balls.length === 0 || iw === 0) {
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      // Update all ball positions
      for (const ball of balls) {
        ball.update(delta);
      }

      // Compute scale from container size
      const container = containerRef.current;
      const containerWidth = container?.clientWidth ?? 400;
      const containerHeight = container?.clientHeight ?? 400;
      // Scale to fit container — 0.6 keeps pattern compact even at high counts
      const scale = Math.min(containerWidth / iw, containerHeight / ih) * 0.6;

      // Render object positions
      const count = countRef.current;
      for (let i = 0; i < count; i++) {
        const el = objRefs.current[i];
        const ball = balls[i];
        if (!el || !ball) continue;
        const screen = mmToScreen(ball.position, scale);
        const cx = screen.x - (iw / 2) * scale;
        const cy = screen.y;
        el.style.transform = `translate(${cx - OBJ_SIZE / 2}px, ${cy - OBJ_SIZE / 2}px)`;
      }

      // ── Hand tracking ──
      //
      // Priority system (highest first):
      //   1. CATCH — hand is holding a ball, tracks it exactly
      //   2. EARLY THROW — hand just released, stays at throw point briefly
      //   3. ANTICIPATION — hand moves to where the next ball will land
      //   4. REST — hand drifts to default position
      //
      // Each hand is independent. We collect candidates per side,
      // pick the highest-priority one, then smooth.

      const midX = iw / 2;
      const halfScale = (iw / 2) * scale;

      type HandTarget = { x: number; y: number; rot: number; priority: number };

      const leftCandidates: HandTarget[] = [];
      const rightCandidates: HandTarget[] = [];

      for (const ball of balls) {
        const seg = ball.currentSegment;
        if (!seg) continue;
        const progress = ball.segmentProgress;

        if (seg.type === 'catch') {
          // Priority 3 (highest) — hand tracks ball position during catch
          const sp = mmToScreen(ball.position, scale);
          const isLeft = ball.position.x < midX;
          // Gentle scoop tilt: ramps up then back down through the catch
          const scoopPhase = Math.sin(progress * Math.PI);
          const dir = isLeft ? 1 : -1;
          const target: HandTarget = {
            x: sp.x - halfScale,
            y: sp.y,
            rot: dir * scoopPhase * 10,
            priority: 3,
          };
          (isLeft ? leftCandidates : rightCandidates).push(target);

        } else if (seg.type === 'throw') {
          const throwOriginX = seg.position.x;
          const landX = throwOriginX + seg.velocity.x * seg.duration;
          const throwIsLeft = throwOriginX < midX;
          const landIsLeft = landX < midX;

          // Priority 2 — throwing hand stays at release point during first 25%
          if (progress < 0.25) {
            const sp = mmToScreen(seg.position, scale);
            const dir = throwIsLeft ? -1 : 1;
            // Tilt fades out over the 25%
            const tiltFade = 1 - (progress / 0.25);
            const throwAngle = Math.atan2(-seg.velocity.y, seg.velocity.x);
            const tilt = dir * Math.abs(throwAngle) * 8 * tiltFade;

            const target: HandTarget = {
              x: sp.x - halfScale,
              y: sp.y,
              rot: Math.max(-20, Math.min(20, tilt)),
              priority: 2,
            };
            (throwIsLeft ? leftCandidates : rightCandidates).push(target);
          }

          // Priority 1 — receiving hand moves toward landing zone
          // Starts moving after ball is 40% through its flight
          if (progress > 0.4) {
            const landSp = mmToScreen({ x: landX, y: 0 }, scale);
            const target: HandTarget = {
              x: landSp.x - halfScale,
              y: landSp.y,
              rot: 0,
              priority: 1,
            };
            (landIsLeft ? leftCandidates : rightCandidates).push(target);
          }
        }
      }

      // Pick highest priority candidate per hand
      function best(candidates: HandTarget[]): HandTarget | null {
        if (candidates.length === 0) return null;
        let top = candidates[0]!;
        for (let i = 1; i < candidates.length; i++) {
          if (candidates[i]!.priority > top.priority) top = candidates[i]!;
        }
        return top;
      }

      // Rest positions — hands at roughly where they'd naturally hang
      const restLeftX = mmToScreen({ x: iw * 0.2, y: 0 }, scale).x - halfScale;
      const restRightX = mmToScreen({ x: iw * 0.8, y: 0 }, scale).x - halfScale;

      const lt = best(leftCandidates) ?? { x: restLeftX, y: 0, rot: 0, priority: 0 };
      const rt = best(rightCandidates) ?? { x: restRightX, y: 0, rot: 0, priority: 0 };

      // Smoothing rate depends on priority:
      // - Catching (3): snappy, hand must be there
      // - Throw follow-through (2): medium
      // - Anticipation (1) / Rest (0): smooth and gentle
      const rateForPriority = (p: number) => {
        if (p >= 3) return 14;
        if (p >= 2) return 10;
        return 6;
      };

      const leftRate = rateForPriority(lt.priority);
      const rightRate = rateForPriority(rt.priority);
      const leftAlpha = 1 - Math.exp(-leftRate * delta / 1000);
      const rightAlpha = 1 - Math.exp(-rightRate * delta / 1000);
      const rotAlpha = 1 - Math.exp(-12 * delta / 1000);

      if (!handsInitialized.current) {
        smoothLeftRef.current = { x: lt.x, y: lt.y, rot: lt.rot };
        smoothRightRef.current = { x: rt.x, y: rt.y, rot: rt.rot };
        handsInitialized.current = true;
      } else {
        const sl = smoothLeftRef.current;
        sl.x += (lt.x - sl.x) * leftAlpha;
        sl.y += (lt.y - sl.y) * leftAlpha;
        sl.rot += (lt.rot - sl.rot) * rotAlpha;

        const sr = smoothRightRef.current;
        sr.x += (rt.x - sr.x) * rightAlpha;
        sr.y += (rt.y - sr.y) * rightAlpha;
        sr.rot += (rt.rot - sr.rot) * rotAlpha;
      }

      const sl = smoothLeftRef.current;
      const sr = smoothRightRef.current;

      if (leftHandRef.current) {
        leftHandRef.current.style.transform =
          `translate(${sl.x - 30}px, ${sl.y - 30}px) rotate(${sl.rot.toFixed(1)}deg)`;
      }
      if (rightHandRef.current) {
        rightHandRef.current.style.transform =
          `translate(${sr.x - 30}px, ${sr.y - 30}px) rotate(${sr.rot.toFixed(1)}deg)`;
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [visibleCount]);

  const objectMode = config.objectMode;
  const showHands = config.showHands;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Hands */}
      {showHands ? (
        <>
          <div
            ref={leftHandRef}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              willChange: 'transform',
              transformOrigin: 'center bottom',
              overflow: 'hidden',
            }}
          >
            <JugglingHands mode={objectMode} style={{ width: 120, height: 60, marginLeft: 0 }} />
          </div>
          <div
            ref={rightHandRef}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              willChange: 'transform',
              transformOrigin: 'center bottom',
              overflow: 'hidden',
            }}
          >
            <JugglingHands mode={objectMode} style={{ width: 120, height: 60, marginLeft: -60 }} />
          </div>
        </>
      ) : null}

      {/* Objects */}
      {OBJECTS.slice(0, objectCount).map((obj, i) => {
        const offset = entranceOffset(i);
        return (
          <motion.div
            key={obj.id}
            ref={(el: HTMLDivElement | null) => {
              objRefs.current[i] = el;
            }}
            initial={{ opacity: 0, scale: 0, x: offset.x, y: offset.y }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{
              delay: 0.5 + i * 0.1,
              duration: 0.5,
              type: 'spring',
              stiffness: 100,
              damping: 14,
            }}
            style={{
              position: 'absolute',
              width: OBJ_SIZE,
              height: OBJ_SIZE,
              willChange: 'transform',
            }}
          >
            {renderObject(obj.id, objectMode)}
          </motion.div>
        );
      })}

    </div>
  );
}
