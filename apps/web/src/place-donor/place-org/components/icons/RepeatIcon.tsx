import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function RepeatIcon({ size = 24, className, ...props }: IconProps) {
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
			<path d="M17 1l4 4-4 4" />
			<path d="M3 11V9a4 4 0 0 1 4-4h14" />
			<path d="M7 23l-4-4 4-4" />
			<path d="M21 13v2a4 4 0 0 1-4 4H3" />
		</svg>
	);
}
