'use client';

import { motion } from 'motion/react';

type SocialButtonProps = {
  href: string;
  label: string;
};

export function SocialButton({ href, label }: SocialButtonProps) {
  return (
    <motion.a
      href={href}
      target={href.startsWith('mailto:') ? undefined : '_blank'}
      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      className="portfolio-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        borderRadius: '8px',
        border: '1px solid var(--portfolio-accent-light)',
        background: 'transparent',
        color: 'var(--portfolio-text-on-dark)',
        textDecoration: 'none',
        fontSize: '13px',
        letterSpacing: '0.06em',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
      whileHover={{
        backgroundColor: 'var(--portfolio-accent-light)',
        color: '#09090b',
      }}
      whileTap={{ scale: 0.97 }}
    >
      {label}
    </motion.a>
  );
}
