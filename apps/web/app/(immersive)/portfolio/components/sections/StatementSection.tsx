'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

const wordVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 0.32, 0.23, 0.2] },
  },
};

const containerVariant: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const STATEMENT = 'I build systems that keep everything in the air.';

type StatementSectionProps = {
  config: VariantConfig;
};

export function StatementSection({ config }: StatementSectionProps) {
  const words = STATEMENT.split(' ');

  return (
    <section
      style={{
        minHeight: '60vh',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 80px)',
      }}
    >
      <motion.h2
        className="display-lg"
        style={{
          color: '#ffffff',
          textAlign: 'center',
          maxWidth: '18ch',
          fontSize: 'clamp(40px, 6vw, 80px)',
          lineHeight: 1.15,
        }}
        variants={containerVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={wordVariant}
            style={{ display: 'inline-block', marginRight: '0.3em' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.h2>
    </section>
  );
}
