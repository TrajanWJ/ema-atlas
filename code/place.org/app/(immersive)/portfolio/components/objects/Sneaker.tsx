import type { CSSProperties } from 'react';

type SneakerProps = {
  color?: string;
  mode?: 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';
  className?: string;
  style?: CSSProperties;
};

export function Sneaker({
  color = '#3b82f6',
  mode = 'default',
  className,
  style,
}: SneakerProps) {
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
  const accentFill = isMono ? '#ffffff' : '#ffffff';
  const sw = isWireframe ? 1.5 : 2.2;
  const swThick = isWireframe ? 1.5 : 2.5;
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
      {/* Outsole / midsole unit */}
      <path
        d="M 7.5 57.5 L 8.2 61.8 Q 9 65.2 12.5 65.8 L 38 66.5 Q 52 67 65 66.3 L 69 66 Q 72.5 65.5 73 62.8 L 73.5 59.5 Q 73.7 58 71.2 57.5 L 9.2 57 Z"
        fill={isWireframe || isOutline ? 'none' : accentFill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={swThick}
        strokeLinejoin="round"
      />
      {/* Sole tread detail */}
      <path
        d="M 13 65.8 Q 13.5 68.5 16.5 68.8 L 42 69.2 Q 56 69 64 68.7 L 67.5 68.2 Q 70.5 67.8 71 65.5"
        fill="none"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* Tread marks on sole */}
      <line x1={22} y1={68.8} x2={22} y2={66.2} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />
      <line x1={30} y1={69} x2={30} y2={66.3} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />
      <line x1={38} y1={69.2} x2={38} y2={66.5} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />
      <line x1={46} y1={69} x2={46} y2={66.5} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />
      <line x1={54} y1={68.8} x2={54} y2={66.3} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />
      <line x1={62} y1={68.5} x2={62} y2={66} stroke={stroke} strokeWidth={0.7} opacity={0.3} strokeLinecap="round" />

      {/* Main upper body - AJ1 High silhouette */}
      <path
        d="M 9.5 57 L 11 47.5 Q 11.8 43.5 13.5 39.5 L 15 36 Q 16.8 32.5 18.5 29.8 L 20 27.5 Q 21.5 25.2 23 23.8 L 24.5 22.8 Q 27 21 30 21.5 L 32 22.2 Q 33.2 23.2 33.5 25.5 L 33.8 28.5 Q 34 30.5 35 32 L 37.5 33.8 Q 41 35.5 45 36.5 L 53 38 Q 59 39.5 64 41 L 68 42.5 Q 71.5 44 72.5 47 L 73.2 51 Q 73.5 54.5 73.3 57 L 9.5 57 Z"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={swThick}
        strokeLinejoin="round"
      />

      {/* High-top collar - the iconic AJ1 ankle collar */}
      <path
        d="M 19 29.5 Q 20 26.2 22 24 L 24.5 22.5 Q 27 21 30.2 21.5 L 32.5 22.2 Q 34 23.5 34 26 L 33.8 29 Q 33.2 31.5 31.5 33"
        fill="none"
        stroke={accentStroke}
        strokeWidth={isWireframe ? 1 : 1.8}
        strokeLinecap="round"
        opacity={isWireframe || isOutline ? 0.6 : 0.9}
      />
      {/* Collar padding inner edge */}
      <path
        d="M 21 25.8 Q 24 22.5 28 22.2 L 31 22.5 Q 33 23 33.5 25"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.45}
      />

      {/* Tongue visible above collar */}
      <path
        d="M 26 22 Q 27.5 19.5 29 19 L 30.5 19.2 Q 31.5 19.8 31.8 21"
        fill="none"
        stroke={accentStroke}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Toe box - AJ1 characteristic forward lean */}
      <path
        d="M 61 42.5 Q 66 44 69.5 47 L 71 49.5 Q 72.5 52 73 55 L 73.2 57"
        fill="none"
        stroke={accentStroke}
        strokeWidth={isWireframe ? 1 : 1.6}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Toe box perforation dots */}
      <circle cx={63} cy={45.5} r={0.6} fill={accentFill} opacity={0.35} />
      <circle cx={65.5} cy={46.5} r={0.6} fill={accentFill} opacity={0.35} />
      <circle cx={68} cy={48} r={0.6} fill={accentFill} opacity={0.35} />
      <circle cx={66} cy={49.5} r={0.6} fill={accentFill} opacity={0.3} />
      <circle cx={63.5} cy={48} r={0.6} fill={accentFill} opacity={0.3} />

      {/* Toe cap line */}
      <path
        d="M 57 43.5 Q 62.5 45 67 47.5 L 69.5 50"
        fill="none"
        stroke={accentStroke}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* THE SWOOSH - the most important element */}
      <path
        d="M 21.5 51.5 Q 25 43 33 40 L 42 37.8 Q 50 37.2 57 38.5 L 63 40 Q 67 41.5 69.5 43 L 70.5 44"
        fill="none"
        stroke={accentStroke}
        strokeWidth={isWireframe ? 1.5 : 2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isWireframe || isOutline ? 0.8 : 1}
      />
      {/* Swoosh tail taper */}
      <path
        d="M 70.5 44 Q 71 44.8 71.2 45.5"
        fill="none"
        stroke={accentStroke}
        strokeWidth={isWireframe ? 1.2 : 2.2}
        strokeLinecap="round"
      />

      {/* Heel counter panel */}
      <path
        d="M 13.5 39.5 L 12.5 46 L 12 51 L 11.5 55 L 11 57"
        fill="none"
        stroke={accentStroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
      />
      {/* Heel tab */}
      <path
        d="M 14 36 Q 15 34.5 16 35 L 16.5 36.5 Q 16 38 14.5 38.5"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Wing logo - angular mark */}
      <path
        d="M 23.5 36.5 L 27 34 L 30.5 35.2"
        fill="none"
        stroke={accentStroke}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.35}
      />
      <path
        d="M 25 35.2 L 28 36.8"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.25}
      />

      {/* Eyelet / lace holes */}
      <circle cx={26.5} cy={30.5} r={1.1} fill={accentFill} opacity={0.65} />
      <circle cx={28.5} cy={28.5} r={1.1} fill={accentFill} opacity={0.65} />
      <circle cx={30.5} cy={26.8} r={1.1} fill={accentFill} opacity={0.65} />

      {/* Lace criss-cross across tongue */}
      <path
        d="M 25.8 31 Q 28.5 30 32 31"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M 27.5 29 Q 29.5 28 31.5 29"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.45}
      />
      <path
        d="M 29 27 Q 30.5 26.2 31.8 27.2"
        fill="none"
        stroke={accentStroke}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Midfoot panel line */}
      <path
        d="M 34 33 Q 38 38 40 42 L 41 46 Q 41.5 50 41 54"
        fill="none"
        stroke={stroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.2}
      />
    </svg>
  );
}
