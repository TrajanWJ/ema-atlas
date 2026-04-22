'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { useVariantStore } from '../lib/variantStore';
import { useVariantSync } from '../hooks/useVariantSync';
import { HeroSection } from './sections/HeroSection';
import { TerminalSection } from './sections/TerminalSection';
import { FooterSection } from './sections/FooterSection';
import { VariantNav } from './ui/VariantNav';

const SECTION_EASE: [number, number, number, number] = [0.23, 0.32, 0.23, 0.2];

function SectionReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: SECTION_EASE }}
    >
      {children}
    </motion.div>
  );
}


/**
 * Client-side portfolio shell.
 * Reads variant config and applies colors as CSS custom properties.
 * Manages collaboration mode toggle.
 */
export function PortfolioShell() {
  useVariantSync();
  const config = useVariantStore((s) => s.config);
  const [collaborationOn, setCollaborationOn] = useState(false);

  const isGradientBg = config.bg.startsWith('linear-gradient');

  const rootStyle = {
    '--p-bg': config.bg,
    '--p-accent': config.accent,
    '--p-text': config.textColor,
    '--p-text-secondary': config.textSecondary,
    ...(isGradientBg
      ? { background: config.bg }
      : { backgroundColor: config.bg }),
    color: config.textColor,
  } satisfies Record<string, string>;

  return (
    <div style={rootStyle}>
      {/* 6-column background grid — opacity increases when collaboration is on */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.4s ease',
        }}
      >
        <div
          className="max-w-6xl mx-auto h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRight: i < 5 ? `1px solid ${config.textColor}${collaborationOn ? '1f' : '0f'}` : 'none',
                height: '100%',
                transition: 'border-color 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Collaboration toggle pill — fixed top right */}
      <motion.button
        type="button"
        onClick={() => setCollaborationOn((prev) => !prev)}
        className="mono-xs"
        layout
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9998,
          padding: '6px 14px',
          borderRadius: 9999,
          border: '1px solid transparent',
          background: collaborationOn ? `${config.accent}18` : 'rgba(0,0,0,0.04)',
          color: collaborationOn ? config.accent : config.textSecondary,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: collaborationOn
            ? `0 0 0 1px ${config.accent}40, 0 0 12px ${config.accent}20`
            : `0 0 0 1px ${config.textSecondary}30`,
        }}
        animate={{
          boxShadow: collaborationOn
            ? [
                `0 0 0 1px ${config.accent}40, 0 0 12px ${config.accent}20`,
                `0 0 0 1px ${config.accent}60, 0 0 20px ${config.accent}30`,
                `0 0 0 1px ${config.accent}40, 0 0 12px ${config.accent}20`,
              ]
            : `0 0 0 1px ${config.textSecondary}30`,
        }}
        transition={collaborationOn ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        {!collaborationOn ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5z" fill="currentColor" opacity="0.5" />
          </svg>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={collaborationOn ? 'on' : 'off'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {collaborationOn ? 'Collaboration on' : 'Collaborate'}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection config={config} collaborationOn={collaborationOn} />
        <SectionReveal>
          <TerminalSection config={config} />
        </SectionReveal>
        <SectionReveal>
          <FooterSection config={config} />
        </SectionReveal>
      </div>


      {/* Variant nav — only when collaboration is on */}
      {collaborationOn ? <VariantNav /> : null}
    </div>
  );
}
