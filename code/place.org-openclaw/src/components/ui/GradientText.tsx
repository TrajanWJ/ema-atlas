'use client';

import type { ReactNode } from 'react';

interface GradientTextProps {
	readonly children: ReactNode;
	readonly className?: string;
	readonly speed?: 'slow' | 'normal' | 'fast';
	readonly colors?: readonly string[];
}

export function GradientText({
	children,
	className = '',
	speed = 'normal',
	colors,
}: GradientTextProps) {
	const speedMap = {
		slow: '8s',
		normal: '4s',
		fast: '2s',
	};

	const defaultColors = [
		'var(--accent-blue)',
		'#b88fff',
		'var(--accent-blue)',
	];

	const gradientColors = colors ?? defaultColors;
	const gradientValue = `linear-gradient(90deg, ${gradientColors.join(', ')})`;

	return (
		<span
			className={`gradient-text ${className}`}
			style={{
				background: gradientValue,
				backgroundSize: '200% auto',
				WebkitBackgroundClip: 'text',
				WebkitTextFillColor: 'transparent',
				backgroundClip: 'text',
				animation: `gradient-shift ${speedMap[speed]} linear infinite`,
			}}
		>
			{children}
		</span>
	);
}
