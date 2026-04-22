'use client';

import type { VariantConfig } from '../../lib/variantStore';

const TAGS_ROW_1 = [
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'NLP',
  'AI Agents',
  'Automation',
  'Web Scraping',
];

const TAGS_ROW_2 = [
  'Docker',
  'PostgreSQL',
  'Zustand',
  'Framer Motion',
  'Tailwind',
  'Linux',
  'Claude Code',
  'Puppeteer',
  'FastAPI',
];

function TagPill({ label, textColor }: { label: string; textColor: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '8px 20px',
        borderRadius: 9999,
        border: '1px solid rgba(0,0,0,0.1)',
        fontFamily: 'var(--font-cinzel, Cinzel), serif',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: textColor,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

type SkillsMarqueeSectionProps = {
  config: VariantConfig;
};

export function SkillsMarqueeSection({ config }: SkillsMarqueeSectionProps) {
  // Duplicate tags for seamless loop
  const row1 = [...TAGS_ROW_1, ...TAGS_ROW_1];
  const row2 = [...TAGS_ROW_2, ...TAGS_ROW_2];

  return (
    <section
      style={{
        minHeight: '20vh',
        background: config.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 16,
        overflow: 'hidden',
        padding: '40px 0',
      }}
    >
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Row 1 — scrolls left */}
      <div style={{ display: 'flex', gap: 16, animation: 'scroll-left 30s linear infinite', width: 'max-content' }}>
        {row1.map((tag, i) => (
          <TagPill key={`r1-${tag}-${i}`} label={tag} textColor={config.textColor} />
        ))}
      </div>

      {/* Row 2 — scrolls right */}
      <div style={{ display: 'flex', gap: 16, animation: 'scroll-right 30s linear infinite', width: 'max-content' }}>
        {row2.map((tag, i) => (
          <TagPill key={`r2-${tag}-${i}`} label={tag} textColor={config.textColor} />
        ))}
      </div>
    </section>
  );
}
