import type { CSSProperties } from 'react';

type BrowserProps = {
  color?: string;
  mode?: 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';
  className?: string;
  style?: CSSProperties;
};

export function Browser({
  color = '#71717a',
  mode = 'default',
  className,
  style,
}: BrowserProps) {
  const isWireframe = mode === 'wireframe';
  const isGlow = mode === 'glow';
  const isOutline = mode === 'outline';
  const isMono = mode === 'monochrome';

  const stroke = isWireframe
    ? '#22c55e'
    : isOutline
      ? '#000000'
      : isMono
        ? '#ffffff'
        : color;

  const sw = isWireframe ? 1.5 : 2;
  const fillOpacity = isGlow ? 0.3 : 1;
  const noFill = isWireframe || isOutline;

  const glowFilter = isGlow
    ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})`
    : undefined;

  const dotRed = isWireframe ? '#22c55e' : isOutline ? '#000' : isMono ? '#ffffff' : '#f43f5e';
  const dotYellow = isWireframe ? '#22c55e' : isOutline ? '#000' : isMono ? '#ffffff' : '#f59e0b';
  const dotGreen = isWireframe ? '#22c55e' : isOutline ? '#000' : isMono ? '#ffffff' : '#10b981';
  const contentBlue = isWireframe ? '#22c55e' : isOutline ? '#000' : isMono ? '#ffffff' : '#3b82f6';
  const contentGreen = isWireframe ? '#22c55e' : isOutline ? '#000' : isMono ? '#ffffff' : '#10b981';

  return (
    <svg
      viewBox="0 0 100 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: glowFilter, ...style }}
    >
      {/* Window frame with slight wobble on corners */}
      <path
        d="M 9 5.5 Q 4.5 5.5 4.2 10 L 4 15 L 4 60 Q 4.2 64.5 9 64.8 L 91 65 Q 95.8 64.8 96 60 L 96 10 Q 95.8 5.5 91 5.5 Z"
        fill={noFill ? 'none' : isMono ? '#ffffff' : '#ffffff'}
        fillOpacity={noFill ? 0 : isGlow ? 0.05 : 0.03}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />

      {/* Title bar background */}
      <path
        d="M 9 5.5 Q 4.5 5.5 4.2 10 L 4 15 L 4 19 L 96 19 L 96 10 Q 95.8 5.5 91 5.5 Z"
        fill={noFill ? 'none' : stroke}
        fillOpacity={noFill ? 0 : 0.06}
        stroke="none"
      />

      {/* Title bar divider */}
      <line
        x1={4}
        y1={19}
        x2={96}
        y2={19.2}
        stroke={stroke}
        strokeWidth={1.2}
      />

      {/* Traffic light dots */}
      <circle cx={14} cy={12.5} r={2.2} fill={noFill ? 'none' : dotRed} fillOpacity={fillOpacity} stroke={noFill ? stroke : 'none'} strokeWidth={noFill ? 0.8 : 0} />
      <circle cx={21.5} cy={12.5} r={2.2} fill={noFill ? 'none' : dotYellow} fillOpacity={fillOpacity} stroke={noFill ? stroke : 'none'} strokeWidth={noFill ? 0.8 : 0} />
      <circle cx={29} cy={12.5} r={2.2} fill={noFill ? 'none' : dotGreen} fillOpacity={fillOpacity} stroke={noFill ? stroke : 'none'} strokeWidth={noFill ? 0.8 : 0} />

      {/* URL bar with organic rect */}
      <path
        d="M 39 9 Q 39 8.2 40 8 L 85 8 Q 86.2 8.2 86 9 L 86 16 Q 86.2 17 85 17.2 L 40 17 Q 39 16.8 39 16 Z"
        fill={noFill ? 'none' : stroke}
        fillOpacity={noFill ? 0 : 0.08}
        stroke={stroke}
        strokeWidth={0.8}
      />
      {/* URL text suggestion */}
      <path
        d="M 43 12.5 L 58 12.5"
        stroke={stroke}
        strokeWidth={1}
        opacity={0.35}
        strokeLinecap="round"
      />
      {/* Lock icon hint */}
      <circle cx={41} cy={12.5} r={1} fill="none" stroke={stroke} strokeWidth={0.6} opacity={0.3} />

      {/* Content area background */}
      <rect
        x={9}
        y={23}
        width={82}
        height={37}
        rx={1.5}
        fill={noFill ? 'none' : contentBlue}
        fillOpacity={noFill ? 0 : 0.04}
        stroke="none"
      />

      {/* Abstract content: heading bar */}
      <path
        d="M 13 27 L 48 27.2"
        stroke={stroke}
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={0.12}
      />

      {/* Abstract content: text lines with slight irregularity */}
      <path d="M 13 34 L 62 34.2" stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.08} />
      <path d="M 13 39 L 54 39.2" stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.08} />
      <path d="M 13 44 L 58 43.8" stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.08} />

      {/* Abstract content: image placeholder */}
      <rect
        x={68}
        y={32}
        width={19}
        height={16}
        rx={1.5}
        fill={noFill ? 'none' : contentGreen}
        fillOpacity={noFill ? 0 : 0.1}
        stroke={stroke}
        strokeWidth={0.6}
        opacity={0.3}
      />
      {/* Image placeholder X */}
      <path d="M 72 36 L 83 44" stroke={stroke} strokeWidth={0.4} opacity={0.15} strokeLinecap="round" />
      <path d="M 83 36 L 72 44" stroke={stroke} strokeWidth={0.4} opacity={0.15} strokeLinecap="round" />

      {/* Abstract content: button */}
      <rect
        x={13}
        y={50}
        width={22}
        height={6}
        rx={3}
        fill={noFill ? 'none' : contentBlue}
        fillOpacity={noFill ? 0 : 0.15}
        stroke={contentBlue}
        strokeWidth={0.7}
        opacity={0.4}
      />
      {/* Button text */}
      <path d="M 17 53 L 31 53" stroke={contentBlue} strokeWidth={1} strokeLinecap="round" opacity={0.25} />
    </svg>
  );
}
