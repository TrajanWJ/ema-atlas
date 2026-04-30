'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

const CUSTOM_EASE: [number, number, number, number] = [0.23, 0.32, 0.23, 0.2];

const STATEMENTS = [
  { num: '01', text: 'Automate the boring. Build the interesting.' },
  { num: '02', text: 'The system is always more interesting than the output.' },
  { num: '03', text: 'Ship it. Learn. Ship again.' },
] as const;

const columnVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: CUSTOM_EASE },
  },
};

const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

type PhilosophySectionProps = {
  config: VariantConfig;
};

export function PhilosophySection({ config }: PhilosophySectionProps) {
  return (
    <section
      style={{
        minHeight: '40vh',
        background: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(60px, 10vh, 120px) clamp(24px, 5vw, 80px)',
      }}
    >
      <motion.div
        className="max-w-6xl mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 64,
          width: '100%',
        }}
        variants={containerVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {STATEMENTS.map((s) => (
          <motion.div key={s.num} variants={columnVariant}>
            <span
              className="mono-xs"
              style={{ color: config.textSecondary, marginBottom: 16, display: 'block' }}
            >
              {s.num}
            </span>
            <p className="display-md" style={{ color: config.textColor }}>
              {s.text}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
