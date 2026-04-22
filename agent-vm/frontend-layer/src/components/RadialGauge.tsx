"use client";

import { useEffect, useState } from "react";

interface RadialGaugeProps {
  value: number; // 0-100
  size: number; // px
  color: string; // hex
  label: string; // center text
  sublabel?: string; // below center
}

export default function RadialGauge({ value, size, color, label, sublabel }: RadialGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate on mount / value change
    const timeout = setTimeout(() => setAnimatedValue(value), 50);
    return () => clearTimeout(timeout);
  }, [value]);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedValue / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow filter */}
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <filter id={`glow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Animated value ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter={`url(#glow-${color.replace('#', '')})`}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s ease",
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <span
          className="font-bold font-mono leading-none"
          style={{
            fontSize: size * 0.22,
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="mt-0.5"
            style={{
              fontSize: size * 0.09,
              color: "var(--color-text-secondary)",
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
