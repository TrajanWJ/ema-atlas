import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function TimeBlockerIcon({ size = 24, className, ...props }: IconProps) {
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
			{/* Calendar grid */}
			<rect x={3} y={4} width={18} height={17} rx={2} />
			<path d="M3 9h18" />
			<path d="M8 4V2" />
			<path d="M16 4V2" />
			{/* Time blocks inside grid */}
			<rect x={6} y={11.5} width={5} height={2.5} rx={0.5} />
			<rect x={13} y={11.5} width={5} height={4} rx={0.5} />
			<rect x={6} y={16} width={5} height={2.5} rx={0.5} />
		</svg>
	);
}
