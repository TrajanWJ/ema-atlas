'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

type FooterSectionProps = {
  config: VariantConfig;
};

const MARQUEE_ITEMS = Array.from({ length: 6 }, (_, i) => i);

export function FooterSection({ config }: FooterSectionProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [marqueeVisible, setMarqueeVisible] = useState(false);

  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMarqueeVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleBackToTop = () => {
    document
      .querySelector('.portfolio-root')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        background: '#060610',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .footer-link {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: rgba(255, 255, 255, 0.87);
        }
        .desktop-link {
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .desktop-link:hover {
          text-decoration: underline;
        }
        .back-to-top {
          color: rgba(255, 255, 255, 0.5);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }
        .back-to-top:hover {
          color: rgba(255, 255, 255, 0.87);
        }
      `}</style>

      {/* Marquee */}
      <div
        ref={marqueeRef}
        style={{
          overflow: 'hidden',
          paddingTop: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            animation: marqueeVisible
              ? 'marquee 25s linear infinite'
              : 'none',
          }}
        >
          {MARQUEE_ITEMS.map((i) => (
            <span
              key={i}
              aria-hidden={i > 0}
              style={{
                fontFamily: "var(--font-cinzel, 'Cinzel'), serif",
                fontSize: 'clamp(120px, 18vw, 220px)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'transparent',
                WebkitTextStroke: '2px rgba(255,255,255,0.1)',
                marginRight: 80,
                lineHeight: 1,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              TRAJAN
            </span>
          ))}
        </div>
      </div>

      {/* Links row */}
      <div
        className="max-w-4xl mx-auto px-6"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          paddingTop: 32,
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <a
            href="https://github.com/trajanmcgill"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ fontSize: 14 }}
          >
            GitHub
          </a>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            &middot;
          </span>
          <a
            href="https://linkedin.com/in/trajanmcgill"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ fontSize: 14 }}
          >
            LinkedIn
          </a>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            &middot;
          </span>
          <a
            href="mailto:hello@trajan.dev"
            className="footer-link"
            style={{ fontSize: 14 }}
          >
            Email
          </a>
        </nav>

        <button
          type="button"
          onClick={handleBackToTop}
          className="back-to-top"
          style={{ fontSize: 14 }}
        >
          Back to top
        </button>
      </div>

      {/* Desktop link */}
      <div
        className="max-w-4xl mx-auto px-6"
        style={{
          paddingTop: 32,
          textAlign: 'center',
        }}
      >
        <motion.a
          href="/"
          className="mono-xs desktop-link"
          style={{ color: config.accent }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.15 }}
        >
          &rarr; explore the desktop
        </motion.a>
      </div>

      {/* Attribution */}
      <div
        className="max-w-4xl mx-auto px-6"
        style={{
          paddingTop: 32,
          paddingBottom: 40,
          textAlign: 'center',
        }}
      >
        <span className="mono-xs" style={{ opacity: 0.15, color: '#fff' }}>
          built with excessive ambition and claude-opus-4-6
        </span>
      </div>
    </footer>
  );
}
