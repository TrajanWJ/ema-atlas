'use client';

import { motion } from 'motion/react';

export function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.6 }}
      aria-hidden="true"
    >
      {/* Thin vertical line that pulses height 30–50px */}
      <motion.div
        animate={{ height: ['30px', '50px', '30px'] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: '1px',
          background: 'var(--p-text-secondary, rgba(113,113,122,0.5))',
        }}
      />
      <span
        className="mono-xs"
        style={{ color: 'var(--p-text-secondary, rgba(113,113,122,0.5))' }}
      >
        scroll
      </span>
    </motion.div>
  );
}
