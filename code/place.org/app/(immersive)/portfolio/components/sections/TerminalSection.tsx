'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

/* ── Terminal line data ──────────────────────────────────────────────── */

type TerminalLine =
  | { type: 'prompt'; text: string }
  | { type: 'output'; text: string };

const LINES: TerminalLine[] = [
  { type: 'prompt', text: '$ whoami' },
  { type: 'output', text: 'trajan' },
  { type: 'prompt', text: '$ cat philosophy.txt' },
  { type: 'output', text: 'automate the boring. build the interesting.' },
  { type: 'prompt', text: '$ ls skills/' },
  { type: 'output', text: 'typescript  react  nextjs  python  nlp  ai-agents  automation' },
  { type: 'prompt', text: '$ uptime' },
  { type: 'output', text: '5 years building, still going' },
  { type: 'prompt', text: '$ wc -l projects/*' },
  { type: 'output', text: '9 projects, thousands of lines, zero regrets' },
  { type: 'prompt', text: '$ echo $STATUS' },
  { type: 'output', text: 'ONLINE. BUILDING.' },
];

/* ── Timing constants ────────────────────────────────────────────────── */

const CHAR_DELAY = 30;
const OUTPUT_PAUSE = 200;
const LINE_PAUSE = 400;

/* ── Styles ──────────────────────────────────────────────────────────── */

const terminalBg = '#111113';
const terminalBorder = 'rgba(255,255,255,0.08)';
const promptGreen = '#22c55e';
const outputColor = 'rgba(255,255,255,0.7)';

/* ── Component ───────────────────────────────────────────────────────── */

type TerminalSectionProps = {
  config: VariantConfig;
};

export function TerminalSection({ config }: TerminalSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.4 });

  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  // Completed lines (fully typed prompts + revealed outputs)
  const [completedLines, setCompletedLines] = useState<TerminalLine[]>([]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  }, []);

  // Kick off typing when section enters viewport
  useEffect(() => {
    if (isInView && currentLineIndex === -1) {
      setCurrentLineIndex(0);
      setCurrentCharIndex(0);
    }
  }, [isInView, currentLineIndex]);

  // Typing state machine
  useEffect(() => {
    if (currentLineIndex < 0 || currentLineIndex >= LINES.length) return;
    cleanup();

    const line = LINES[currentLineIndex] as TerminalLine;

    if (line.type === 'prompt') {
      // Type character by character
      if (currentCharIndex < line.text.length) {
        timeoutRef.current = setTimeout(() => {
          setCurrentCharIndex((c) => c + 1);
        }, CHAR_DELAY);
      } else {
        // Prompt fully typed -- move to next line after pause
        const completed = line;
        timeoutRef.current = setTimeout(() => {
          setCompletedLines((prev) => [...prev, completed]);
          advanceLine();
        }, OUTPUT_PAUSE);
      }
    } else {
      // Output lines appear instantly, then pause before next prompt
      const completed = line;
      setCompletedLines((prev) => [...prev, completed]);
      timeoutRef.current = setTimeout(() => {
        advanceLine();
      }, LINE_PAUSE);
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLineIndex, currentCharIndex]);

  function advanceLine() {
    const next = currentLineIndex + 1;
    if (next >= LINES.length) {
      setFinished(true);
      setCurrentLineIndex(next);
    } else {
      setCurrentLineIndex(next);
      setCurrentCharIndex(0);
    }
  }

  // Build the currently-typing partial text (only for prompt lines)
  const activeLine =
    currentLineIndex >= 0 && currentLineIndex < LINES.length
      ? LINES[currentLineIndex]
      : undefined;

  const partialLine =
    activeLine?.type === 'prompt'
      ? activeLine.text.slice(0, currentCharIndex)
      : null;

  return (
    <section
      ref={sectionRef}
      className="portfolio-section"
      style={{
        background: config.bg,
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.23, 0.32, 0.23, 0.2] }}
        style={{ width: '100%', maxWidth: '48rem', margin: '0 auto', padding: '0 24px' }}
      >
        {/* Terminal window */}
        <div
          style={{
            background: terminalBg,
            borderRadius: 12,
            border: `1px solid ${terminalBorder}`,
            overflow: 'hidden',
          }}
        >
          {/* Title bar with traffic-light dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              borderBottom: `1px solid ${terminalBorder}`,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
          </div>

          {/* Terminal content */}
          <div className="mono-sm" style={{ padding: 24, minHeight: 280 }}>
            {/* Completed lines */}
            {completedLines.map((line, i) => (
              <TerminalLineRow key={i} line={line} />
            ))}

            {/* Currently typing line (prompt only) */}
            {partialLine !== null && (
              <div style={{ display: 'flex', whiteSpace: 'pre' }}>
                <PromptText text={partialLine} />
                <BlinkingCursor />
              </div>
            )}

            {/* Resting cursor after all lines finish */}
            {finished && (
              <div style={{ display: 'flex', whiteSpace: 'pre' }}>
                <span style={{ color: promptGreen }}>$ </span>
                <BlinkingCursor />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function TerminalLineRow({ line }: { line: TerminalLine }) {
  if (line.type === 'prompt') {
    return (
      <div style={{ whiteSpace: 'pre' }}>
        <PromptText text={line.text} />
      </div>
    );
  }

  return (
    <div style={{ color: outputColor, whiteSpace: 'pre-wrap', marginBottom: 4 }}>
      {line.text}
    </div>
  );
}

function PromptText({ text }: { text: string }) {
  // Split on first space to color the "$" green
  const dollarEnd = text.indexOf(' ');
  const prefix = dollarEnd >= 0 ? text.slice(0, dollarEnd) : text;
  const rest = dollarEnd >= 0 ? text.slice(dollarEnd) : '';

  return (
    <>
      <span style={{ color: promptGreen }}>{prefix}</span>
      <span style={{ color: '#fff' }}>{rest}</span>
    </>
  );
}

function BlinkingCursor() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 1,
        height: 16,
        background: promptGreen,
        marginLeft: 1,
        verticalAlign: 'middle',
        animation: 'terminal-cursor-blink 1s step-end infinite',
      }}
    />
  );
}
