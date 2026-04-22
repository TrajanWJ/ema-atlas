'use client';

import { useEffect, useRef, useState } from 'react';
import type { VariantConfig } from '../../lib/variantStore';

const QUOTE = '// the interesting thing was never the shoe. it was the system that got it.';
const CHAR_DELAY = 25;

type QuoteSectionProps = {
  config: VariantConfig;
};

export function QuoteSection({ config }: QuoteSectionProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= QUOTE.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, CHAR_DELAY);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started]);

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '30vh',
        background: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(60px, 10vh, 120px) clamp(24px, 5vw, 80px)',
      }}
    >
      <p
        className="mono-sm"
        style={{
          maxWidth: '40ch',
          textAlign: 'center',
          color: 'rgba(34, 197, 94, 0.6)',
          fontSize: 'clamp(14px, 1.5vw, 18px)',
          lineHeight: 1.7,
        }}
      >
        <span>{QUOTE.slice(0, visibleChars)}</span>
        <span
          style={{
            display: 'inline-block',
            width: '0.6em',
            height: '1.1em',
            background: 'rgba(34, 197, 94, 0.6)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'cursor-blink 1s step-end infinite',
          }}
        />
        <style>{`
          @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </p>
    </section>
  );
}
