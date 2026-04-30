import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function CanvasIcon({ size = 24, className, ...props }: IconProps) {
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
			{/* Artboard */}
			<rect x="3" y="3" width="18" height="18" rx="2" />
			{/* Pen nib */}
			<path d="M15 3l6 6-9.5 9.5a2 2 0 0 1-1 .5L7 20l1-3.5a2 2 0 0 1 .5-1L15 3z" />
			<path d="M14.5 5.5l4 4" />
		</svg>
	);
}
