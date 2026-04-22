interface HealthGaugeProps {
  score: number;
  size?: number;
}

export function HealthGauge({ score, size = 100 }: HealthGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#00C851' : score >= 60 ? '#FFB800' : '#FF3D6B';

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 16 }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        {/* Background arc */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M 6 ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 2}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}
