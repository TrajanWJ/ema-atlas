import type { CSSProperties } from 'react';

type BallProps = {
  color?: string;
  mode?: 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';
  className?: string;
  style?: CSSProperties;
};

export function Ball({
  color = '#ef4444',
  mode = 'default',
  className,
  style,
}: BallProps) {
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

  const fill = isWireframe || isOutline ? 'none' : isMono ? '#ffffff' : color;
  const accentStroke = isMono ? '#ffffff' : '#ffffff';
  const sw = isWireframe ? 1.5 : 2.2;
  const fillOpacity = isGlow ? 0.3 : 1;

  const glowFilter = isGlow
    ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})`
    : undefined;

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: glowFilter, ...style }}
    >
      {/* Main ball body — slight organic wobble on the circle */}
      <path
        d="M 40 21 Q 50.5 20.5 56.5 26 Q 62 31.5 62 40 Q 62 49 56.5 54.5 Q 50.5 60 40 60 Q 29.5 60 24 54.5 Q 18.5 49 18.5 40 Q 18.5 31 24 26 Q 29.5 20.5 40 21 Z"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />

      {/* White stripe band across middle — curved to follow sphere */}
      <path
        d="M 22 34 Q 28.5 29.5 40 29 Q 51.5 29.5 58 34 L 57 38 Q 50 34 40 33.5 Q 30 34 23 38 Z"
        fill={isWireframe || isOutline ? 'none' : accentStroke}
        fillOpacity={isWireframe || isOutline ? 0 : 0.75}
        stroke={isWireframe || isOutline ? stroke : 'none'}
        strokeWidth={isWireframe ? 0.8 : 0}
      />
      {/* Stripe top edge */}
      <path
        d="M 22.5 34 Q 29 29.5 40 29 Q 51 29.5 57.5 34"
        fill="none"
        stroke={isWireframe || isOutline ? stroke : accentStroke}
        strokeWidth={isWireframe ? 1 : 1.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Stripe bottom edge */}
      <path
        d="M 23.5 38 Q 30.5 34 40 33.5 Q 49.5 34 56.5 38"
        fill="none"
        stroke={isWireframe || isOutline ? stroke : accentStroke}
        strokeWidth={isWireframe ? 1 : 1.2}
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Subtle highlight — upper-left for dimensionality */}
      <path
        d="M 30 26 Q 34 23.5 38.5 23"
        fill="none"
        stroke={isWireframe || isOutline ? stroke : accentStroke}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.3}
      />

      {/* Bottom shadow curve */}
      <path
        d="M 28 55 Q 34 57.5 40 58 Q 46 57.5 52 55"
        fill="none"
        stroke={stroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.15}
      />

      {/* Outer ring re-stroke for crispness */}
      <path
        d="M 40 21 Q 50.5 20.5 56.5 26 Q 62 31.5 62 40 Q 62 49 56.5 54.5 Q 50.5 60 40 60 Q 29.5 60 24 54.5 Q 18.5 49 18.5 40 Q 18.5 31 24 26 Q 29.5 20.5 40 21 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </svg>
  );
}
