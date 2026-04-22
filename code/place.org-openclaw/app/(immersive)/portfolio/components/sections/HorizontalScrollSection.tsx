'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

const ACCENT_COLORS = [
  '#3b82f6',
  '#f43f5e',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#ef4444',
  '#14b8a6',
  '#a855f7',
] as const;

const TECH_CARDS = [
  { name: 'TypeScript', desc: 'The foundation. Types keep everything honest.' },
  { name: 'React', desc: 'Component thinking. Composition over configuration.' },
  { name: 'Next.js', desc: 'Full-stack in one framework. Ship fast.' },
  { name: 'Python', desc: 'NLP pipelines, automation scripts, quick prototypes.' },
  { name: 'Framer Motion', desc: 'Animation that feels physical, not decorative.' },
  { name: 'Tailwind', desc: 'Style as fast as you think.' },
  { name: 'Docker', desc: 'Ship the same thing everywhere.' },
  { name: 'PostgreSQL', desc: 'Data that outlasts the application.' },
  { name: 'Claude', desc: 'The pair programmer that never sleeps.' },
  { name: 'Linux', desc: 'The OS underneath everything I build.' },
] as const;

type HorizontalScrollSectionProps = {
  config: VariantConfig;
};

export function HorizontalScrollSection({ config }: HorizontalScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);

  return (
    <section
      ref={sectionRef}
      style={{
        height: '300vh',
        position: 'relative',
        background: '#09090b',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <motion.div
          style={{
            x,
            display: 'flex',
            gap: 24,
            paddingLeft: 'clamp(40px, 8vw, 120px)',
            paddingRight: 'clamp(40px, 8vw, 120px)',
          }}
        >
          {TECH_CARDS.map((card, i) => (
            <TechCard
              key={card.name}
              name={card.name}
              desc={card.desc}
              index={i}
              accentDot={ACCENT_COLORS[i % ACCENT_COLORS.length] ?? '#3b82f6'}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

type TechCardProps = {
  name: string;
  desc: string;
  index: number;
  accentDot: string;
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
};

function TechCard({ name, desc, index, accentDot, scrollYProgress }: TechCardProps) {
  const yOffset = (index % 2 === 0 ? 1 : -1) * (8 + (index % 3) * 4);
  const y = useTransform(scrollYProgress, [0, 1], [0, yOffset]);

  return (
    <motion.div
      style={{
        y,
        minWidth: 300,
        height: 280,
        flexShrink: 0,
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 32,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Accent dot */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: accentDot,
        }}
      />

      <h3
        className="display-md"
        style={{
          color: '#ffffff',
          fontFamily: 'var(--font-cinzel)',
          marginBottom: 12,
        }}
      >
        {name}
      </h3>
      <p
        className="body-md"
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.6,
        }}
      >
        {desc}
      </p>
    </motion.div>
  );
}
