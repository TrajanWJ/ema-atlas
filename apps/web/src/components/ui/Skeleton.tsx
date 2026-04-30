'use client';

import type { ReactNode } from 'react';

interface SkeletonProps {
	readonly width?: string | number;
	readonly height?: string | number;
	readonly rounded?: boolean;
	readonly className?: string;
	readonly children?: never;
}

export function Skeleton({
	width = '100%',
	height = '20px',
	rounded = false,
	className = '',
}: SkeletonProps) {
	const widthValue = typeof width === 'number' ? `${width}px` : width;
	const heightValue = typeof height === 'number' ? `${height}px` : height;
	const borderRadius = rounded ? '9999px' : '8px';

	return (
		<div
			className={`skeleton ${className}`}
			style={{
				width: widthValue,
				height: heightValue,
				borderRadius,
			}}
		/>
	);
}

interface SkeletonTextProps {
	readonly lines?: number;
	readonly width?: string | number;
	readonly className?: string;
	readonly children?: never;
}

export function SkeletonText({
	lines = 1,
	width = '100%',
	className = '',
}: SkeletonTextProps) {
	return (
		<div className={`space-y-2 ${className}`}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton
					key={i}
					width={i === lines - 1 ? '80%' : width}
					height="16px"
					className="rounded"
				/>
			))}
		</div>
	);
}

interface SkeletonBlockProps {
	readonly width?: string | number;
	readonly height?: string | number;
	readonly className?: string;
	readonly children?: never;
}

export function SkeletonBlock({
	width = '100%',
	height = '200px',
	className = '',
}: SkeletonBlockProps) {
	return (
		<Skeleton
			width={width}
			height={height}
			rounded={false}
			className={className}
		/>
	);
}

interface SkeletonCircleProps {
	readonly size?: number;
	readonly className?: string;
	readonly children?: never;
}

export function SkeletonCircle({
	size = 40,
	className = '',
}: SkeletonCircleProps) {
	return (
		<Skeleton
			width={size}
			height={size}
			rounded={true}
			className={className}
		/>
	);
}
