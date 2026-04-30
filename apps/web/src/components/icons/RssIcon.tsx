import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function RssIcon({ size = 24, className, ...props }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			{...props}
		>
			{/* Dot */}
			<circle cx="6" cy="18" r="2" fill="currentColor" />
			{/* Inner wave */}
			<path d="M4 11a7 7 0 0 1 7 7" />
			{/* Outer wave */}
			<path d="M4 4a14 14 0 0 1 14 14" />
		</svg>
	);
}
