import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function ChartIcon({ size = 24, className, ...props }: IconProps) {
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
			<path d="M18 20V10" />
			<path d="M12 20V4" />
			<path d="M6 20v-6" />
		</svg>
	);
}
