import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function TargetIcon({ size = 24, className, ...props }: IconProps) {
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
			<circle cx={12} cy={12} r={10} />
			<circle cx={12} cy={12} r={6} />
			<circle cx={12} cy={12} r={2} />
		</svg>
	);
}
