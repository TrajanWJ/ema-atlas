'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

type Metric = {
  value: number | null; // null = infinity symbol
  suffix: string;
  label: string;
};

const METRICS: Metric[] = [
  { value: 9, suffix: '+', label: 'Projects shipped' },
  { value: 5, suffix: '', label: 'Years building' },
  { value: 3, suffix: '', label: 'Patterns mastered' },
  { value: null, suffix: '', label: 'Things in the air' },
];

function useCountUp(target: number, duration: number, active: boolean): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const animate = useCallback(
    (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [target, duration],
  );

  useEffect(() => {
    if (!active) return;
    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, animate]);

  return current;
}

function CountUpMetric({
  metric,
  index,
  active,
  config,
}: {
  metric: Metric;
  index: number;
  active: boolean;
  config: VariantConfig;
}) {
  const count = useCountUp(metric.value ?? 0, 1500, active && metric.value !== null);

  return (
    <motion.div
      style={{ textAlign: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <span
        className="display-xl"
        style={{
          color: '#ffffff',
          display: 'block',
          marginBottom: 8,
          fontSize: 'clamp(48px, 8vw, 120px)',
        }}
      >
        {metric.value === null ? '\u221E' : `${count}${metric.suffix}`}
      </span>
      <span className="body-md" style={{ color: config.textSecondary, opacity: 0.7 }}>
        {metric.label}
      </span>
    </motion.div>
  );
}

type MetricsSectionProps = {
  config: VariantConfig;
};

export function MetricsSection({ config }: MetricsSectionProps) {
  const [active, setActive] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '40vh',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(60px, 10vh, 120px) clamp(24px, 5vw, 80px)',
      }}
    >
      <div
        className="max-w-6xl mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 48,
          width: '100%',
        }}
      >
        {METRICS.map((metric, i) => (
          <CountUpMetric
            key={metric.label}
            metric={metric}
            index={i}
            active={active}
            config={config}
          />
        ))}
      </div>
    </section>
  );
}
