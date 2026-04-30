'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

type Exchange = {
  q: string;
  a: string;
};

const EXCHANGES: Exchange[] = [
  {
    q: 'What do you build?',
    a: 'Systems that run themselves. Automation pipelines, AI agents, interfaces that feel alive — software that keeps working while you sleep.',
  },
  {
    q: 'How do you think about craft?',
    a: "Ship first, polish second. The best architecture is the one that lets you change your mind next week. I'd rather have something real and rough than perfect and imaginary.",
  },
  {
    q: 'What does your stack look like?',
    a: 'TypeScript end-to-end. React + Next.js for the UI. Python when I need ML pipelines. Claude for the heavy reasoning. Docker to ship it all the same way everywhere.',
  },
  {
    q: 'Why the juggling thing?',
    a: "It's the whole metaphor. Building software is keeping seven things in the air at once — deadlines, dependencies, users, debt. The patterns are real siteswap notation. Physics-correct arcs.",
  },
  {
    q: 'What are you working on now?',
    a: 'An operating system for your life. Desktop metaphor, local-first data, AI agents that actually help you think. Everything on this site runs on it.',
  },
];

function ScrollExchange({
  exchange,
  index,
  scrollProgress,
  accent,
  textSecondary,
}: {
  exchange: Exchange;
  index: number;
  scrollProgress: MotionValue<number>;
  accent: string;
  textSecondary: string;
}) {
  const total = EXCHANGES.length;
  // Each exchange gets an equal slice of the 0.10–0.88 range
  const start = 0.10 + (index / total) * 0.78;
  const qIn = start;
  const aIn = start + 0.04;

  const qOpacity = useTransform(scrollProgress, [qIn, qIn + 0.02], [0, 1]);
  const qY = useTransform(scrollProgress, [qIn, qIn + 0.03], [20, 0]);
  const aOpacity = useTransform(scrollProgress, [aIn, aIn + 0.02], [0, 1]);
  const aY = useTransform(scrollProgress, [aIn, aIn + 0.03], [16, 0]);

  return (
    <div style={{ marginBottom: 'clamp(48px, 6vh, 72px)' }}>
      {/* Question */}
      <motion.p
        style={{
          opacity: qOpacity,
          y: qY,
          color: textSecondary,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          letterSpacing: '0.02em',
          marginBottom: 16,
        }}
      >
        {exchange.q}
      </motion.p>

      {/* Answer */}
      <motion.p
        style={{
          opacity: aOpacity,
          y: aY,
          color: 'rgba(255,255,255,0.88)',
          fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
          fontSize: 'clamp(18px, 2.2vw, 26px)',
          lineHeight: 1.55,
          fontWeight: 400,
          maxWidth: '42ch',
        }}
      >
        {exchange.a}
      </motion.p>

      {/* Accent line under answer */}
      <motion.div
        style={{
          opacity: aOpacity,
          width: 24,
          height: 2,
          background: `color-mix(in srgb, ${accent} 30%, transparent)`,
          borderRadius: 1,
          marginTop: 20,
        }}
      />
    </div>
  );
}

type ConversationSectionProps = {
  config: VariantConfig;
};

export function ConversationSection({ config }: ConversationSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const closingOpacity = useTransform(scrollYProgress, [0.90, 0.95], [0, 0.5]);

  return (
    <section
      ref={sectionRef}
      style={{
        height: '280vh',
        position: 'relative',
        background: '#060610',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(32px, 8vw, 160px)',
        }}
      >
        <div style={{ maxWidth: 720 }}>
          {EXCHANGES.map((ex, i) => (
            <ScrollExchange
              key={i}
              exchange={ex}
              index={i}
              scrollProgress={scrollYProgress}
              accent={config.accent}
              textSecondary={config.textSecondary}
            />
          ))}
        </div>

        {/* Closing */}
        <motion.p
          style={{
            opacity: closingOpacity,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
            fontSize: 11,
            color: config.accent,
            letterSpacing: '0.06em',
            marginTop: 8,
          }}
        >
          {'// end of conversation. beginning of something.'}
        </motion.p>
      </div>
    </section>
  );
}
