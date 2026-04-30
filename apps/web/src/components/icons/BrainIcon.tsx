import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
	readonly size?: number;
}

export function BrainIcon({ size = 24, className, ...props }: IconProps) {
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
			<path d="M12 2a5 5 0 0 1 4.5 2.8A4.5 4.5 0 0 1 21 9.5a4.5 4.5 0 0 1-2.1 3.8A5 5 0 0 1 16 18h-1v4h-6v-4H8a5 5 0 0 1-2.9-4.7A4.5 4.5 0 0 1 3 9.5a4.5 4.5 0 0 1 4.5-4.7A5 5 0 0 1 12 2z" />
			<path d="M12 2v8" />
			<path d="M8 10h8" />
		</svg>
	);
}
