import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

/** Timeline / activity stream icon — a vertical line with branching dots */
export function FluxIcon({ size = 24, className, ...props }: IconProps) {
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
			{/* Vertical timeline line */}
			<line x1="8" y1="3" x2="8" y2="21" />
			{/* Branching entries */}
			<circle cx="8" cy="6" r="2" fill="currentColor" />
			<line x1="10" y1="6" x2="16" y2="6" />
			<circle cx="8" cy="12" r="2" fill="currentColor" />
			<line x1="10" y1="12" x2="18" y2="12" />
			<circle cx="8" cy="18" r="2" fill="currentColor" />
			<line x1="10" y1="18" x2="14" y2="18" />
		</svg>
	);
}
