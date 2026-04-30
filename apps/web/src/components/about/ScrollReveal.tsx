'use client';

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ScrollRevealProps {
	readonly children: ReactNode;
	readonly direction?: "up" | "left" | "right";
	readonly delay?: number;
	readonly threshold?: number;
	readonly className?: string;
}

const INITIAL_OFFSETS = {
	up: { x: 0, y: 40 },
	left: { x: -40, y: 0 },
	right: { x: 40, y: 0 },
} as const;

export function ScrollReveal({
	children,
	direction = "up",
	delay = 0,
	threshold = 0.15,
	className,
}: ScrollRevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [threshold]);

	const offset = INITIAL_OFFSETS[direction];

	return (
		<motion.div
			ref={ref}
			className={className}
			initial={{ opacity: 0, x: offset.x, y: offset.y }}
			animate={visible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
			transition={{ duration: 0.6, delay, ease: [0.65, 0.05, 0, 1] }}
		>
			{children}
		</motion.div>
	);
}
