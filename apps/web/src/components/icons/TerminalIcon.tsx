import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function TerminalIcon({ size = 24, className, ...props }: IconProps) {
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
			<polyline points="4 17 10 11 4 5" />
			<line x1={12} y1={19} x2={20} y2={19} />
		</svg>
	);
}
