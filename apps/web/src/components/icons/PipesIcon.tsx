import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function PipesIcon({ size = 24, className, ...props }: IconProps) {
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
			{/* Input node */}
			<circle cx="4" cy="7" r="2" />
			<circle cx="4" cy="17" r="2" />
			{/* Output node */}
			<circle cx="20" cy="12" r="2" />
			{/* Wires */}
			<path d="M6 7h4c3 0 4 2 6 5h2" />
			<path d="M6 17h4c3 0 4-2 6-5" />
		</svg>
	);
}
