import type { CSSProperties } from 'react';

type JugglingHandsProps = {
  color?: string;
  mode?: 'default' | 'wireframe' | 'glow' | 'outline' | 'monochrome';
  className?: string;
  style?: CSSProperties;
};

export function JugglingHands({
  color = '#f5c6a0',
  mode = 'default',
  className,
  style,
}: JugglingHandsProps) {
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
  const sw = isWireframe ? 1.5 : 2.2;
  const fillOpacity = isGlow ? 0.3 : isWireframe || isOutline ? 0 : 0.25;

  const glowFilter = isGlow
    ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 0 24px ${color})`
    : undefined;

  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: glowFilter, ...style }}
    >
      {/*
        Pair of stylized hands, palms up, side by side.
        Left hand centered around x=75, right hand around x=165.
        Simplified but human — not anatomical, not cartoonish.
      */}

      {/* === LEFT HAND (palm up, slightly cupped) === */}

      {/* Wrist */}
      <path
        d="M 55 108 Q 58 105 62 103 L 68 101 Q 74 100 80 101 L 86 103 Q 90 105 93 108"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Palm — cupped, palm-up */}
      <path
        d="M 55 108 Q 52 100 51 92 L 50.5 86 Q 51 80 54 76 L 58 73 Q 62 71.5 68 71 L 75 70.5 Q 82 71 87 73 L 91 76 Q 94 80 95 86 L 95.5 92 Q 95 100 93 108"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Palm lines */}
      <path
        d="M 58 88 Q 66 85 75 84.5 Q 84 85 90 88"
        fill="none"
        stroke={stroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.3}
      />
      <path
        d="M 60 94 Q 68 92 75 91.5 Q 82 92 88 94"
        fill="none"
        stroke={stroke}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.2}
      />

      {/* Thumb — splayed outward on left side */}
      <path
        d="M 54 76 Q 50 72 47 67 L 45.5 63 Q 45 60.5 46 59 L 47.5 58.5 Q 49 59 50 61.5 L 51.5 65.5 Q 53 70 55 73"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Index finger */}
      <path
        d="M 60 71 Q 58 65 57 59 L 56.5 54 Q 56.5 51 57.5 49.5 L 59 49 Q 60.5 49.5 61 52 L 62 58 Q 63 64 63.5 70"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle finger (tallest) */}
      <path
        d="M 68 70.5 Q 67 63 66.5 56 L 66 50 Q 66 47 67 45.5 L 68.5 45 Q 70 45.5 70.5 48 L 71 54 Q 71.5 61 72 70"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ring finger */}
      <path
        d="M 77 71 Q 76.5 64 76 58 L 75.5 52.5 Q 75.5 49.5 76.5 48 L 78 47.5 Q 79.5 48 80 51 L 80.5 57 Q 81 64 81 70.5"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pinky finger */}
      <path
        d="M 85 73 Q 85 67 85.5 62 L 86 57 Q 86 54 87 52.5 L 88.5 52 Q 90 52.5 90.5 55 L 90.5 60 Q 90 66 89 72"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* === RIGHT HAND (palm up, slightly cupped, mirror) === */}

      {/* Wrist */}
      <path
        d="M 147 108 Q 150 105 154 103 L 160 101 Q 166 100 172 101 L 178 103 Q 182 105 185 108"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Palm */}
      <path
        d="M 147 108 Q 144 100 143 92 L 142.5 86 Q 143 80 146 76 L 150 73 Q 154 71.5 160 71 L 167 70.5 Q 174 71 179 73 L 183 76 Q 186 80 187 86 L 187.5 92 Q 187 100 185 108"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Palm lines */}
      <path
        d="M 150 88 Q 158 85 167 84.5 Q 176 85 182 88"
        fill="none"
        stroke={stroke}
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.3}
      />
      <path
        d="M 152 94 Q 160 92 167 91.5 Q 174 92 180 94"
        fill="none"
        stroke={stroke}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.2}
      />

      {/* Thumb — splayed outward on right side */}
      <path
        d="M 186 76 Q 190 72 193 67 L 194.5 63 Q 195 60.5 194 59 L 192.5 58.5 Q 191 59 190 61.5 L 188.5 65.5 Q 187 70 185 73"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pinky finger (left side of right hand) */}
      <path
        d="M 151 73 Q 150.5 67 150 62 L 149.5 57 Q 149.5 54 150.5 52.5 L 152 52 Q 153.5 52.5 154 55 L 154 60 Q 153.5 66 153 72"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ring finger */}
      <path
        d="M 159 71 Q 159.5 64 160 58 L 160.5 52.5 Q 160.5 49.5 161.5 48 L 163 47.5 Q 164.5 48 165 51 L 165.5 57 Q 166 64 166 70.5"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle finger (tallest) */}
      <path
        d="M 168 70.5 Q 168.5 63 169 56 L 169.5 50 Q 169.5 47 170.5 45.5 L 172 45 Q 173.5 45.5 174 48 L 174.5 54 Q 175 61 175 70"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Index finger */}
      <path
        d="M 177 71 Q 178 65 179 59 L 179.5 54 Q 179.5 51 180.5 49.5 L 182 49 Q 183.5 49.5 184 52 L 184 58 Q 183.5 64 183 70"
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
